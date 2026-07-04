# 📊 Motor de Inteligencia de Supervisión Bancaria - Guía de Producción (GitHub + Supabase + Vercel)

Esta aplicación es una herramienta de supervisión bancaria consolidada con un motor cognitivo de riesgo potenciado por **Gemini AI** y persistencia en tiempo real con **Supabase**.

A continuación se detalla el proceso para realizar el deploy del código sanitizado y su integración definitiva.

---

## 🛠️ Paso 1: Configurar la Base de Datos en Supabase

1. Crea un proyecto gratuito en [Supabase](https://supabase.com).
2. Ve al **SQL Editor** de tu proyecto, abrí el archivo `scripts/init-supabase.sql` de este repo, copiá todo su contenido y ejecutalo. Ese script es la única fuente de verdad del esquema: crea `banks` (maestro fijo de 20 entidades con código/nombre), `risk_datasets`, `risk_calculations`, `risk_thresholds` y `risk_reports`, con exactamente las columnas que el código en `src/lib/supabase.ts` y `src/App.tsx` lee y escribe. `risk_datasets` **no** duplica código/nombre: los resuelve contra `banks` por `bank_id`, así una entidad se reconoce aunque el Excel de otro año traiga su nombre escrito distinto.
3. Si tu proyecto de Supabase tiene Row Level Security activado por defecto y estás usando la ANON KEY directo desde el navegador (sin login de usuarios todavía), descomentá y ejecutá también las políticas `CREATE POLICY ...` que están al final del script, o las requests fallarán con un error de permisos.

---

## ⚙️ Paso 2: Configurar las Variables de Entorno

Crea un archivo `.env` en la raíz de tu proyecto local para desarrollo, o añade las siguientes variables en la sección de configuración de tu dashboard de **Vercel**:

```env
# 1. Clave de API de Gemini (Google AI Studio) - Requerido para el backend
GEMINI_API_KEY="TU_API_KEY_AQUI"

# 2. Claves de Supabase - Requerido en el cliente (Vite)
VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
VITE_SUPABASE_ANON_KEY="tu_anon_key_de_supabase_aqui"
```

---

## 🚀 Paso 3: Deploy en Vercel (1-Click)

La aplicación está completamente adaptada para funcionar de forma **serverless** en Vercel:

1. Sube tu código sanitizado a un repositorio en **GitHub**.
2. Ve a [Vercel](https://vercel.com) y haz clic en **Add New** -> **Project**.
3. Importa tu repositorio de GitHub.
4. Vercel detectará automáticamente que es un proyecto Vite.
5. Abre la sección **Environment Variables** e introduce las variables de entorno listadas en el Paso 2.
6. Haz clic en **Deploy**. ¡Listo! Vercel servirá el frontend de Vite estático y enrutará las llamadas `/api/*` hacia nuestra función serverless de Node en `api/index.ts` de manera transparente.

---

## 🔒 Lista de Verificación de Sanitización y Seguridad
- [x] **Sin credenciales expuestas**: Toda la información sensible y tokens se cargan estrictamente mediante variables de entorno (`process.env` y `import.meta.env`).
- [x] **Fallback Seguro**: Si las claves de Supabase no están configuradas, la aplicación se inicia automáticamente en modo **Simulado/Local** para no romper la experiencia de usuario y permitir pruebas locales con localStorage.
- [x] **Consistencia de Datos (Escenario A)**: Toda la fusión de datos cargados de áreas de origen se consolida a través del **ID Único de la Entidad**, garantizando la integridad de auditoría sin importar cambios en la razón social.
- [x] **Sin datos precargados / hardcodeados**: Ningún año trae bancos ni coeficientes de ejemplo. El "Centro de Carga" parsea de verdad los 3 archivos Excel/CSV (Depósitos, Clientes, Auditoría Interna) que subas y cruza sus filas por el ID de Entidad (primera columna numérica de cada archivo). Todos los años empiezan vacíos hasta que subís los archivos correspondientes.

---

## 📂 Paso 4: Formato esperado de los 3 archivos de origen

El parser (`src/lib/excelParser.ts`) detecta automáticamente la fila de encabezado (busca la primera celda que contenga "Cod", "N°", "Nro" o "ID") y luego, para cada fila de datos:
- toma la **primera celda numérica** de la fila como código de entidad (ID Único),
- toma la **primera celda de texto** como nombre de la entidad (solo como referencia; el nombre "oficial" que se muestra en la app sale del maestro `banks`, cruzando por ese mismo ID),
- toma la **última celda numérica** de la fila como valor (depósitos, clientes u observaciones, según el sector).

Si un ID que aparece en el Excel no está dado de alta en `banks`, la app avisa con una notificación y usa el nombre del Excel como respaldo hasta que lo agregues a la tabla maestra.

Esto es compatible tal cual con los 3 archivos reales de ejemplo entregados (`Coef_Cant_Clientes_2023.xlsx`, `Coef_Observ_AI_2023.xlsx`, `Coef__Vol_depositos_2023.xlsx`), que tienen un título y una línea de fuente antes del encabezado real, y columnas en distintas posiciones entre archivos.

En el panel **"Centro de Carga e Integración"**, subí cada archivo en su sector correspondiente (Depósitos / Clientes / Auditoría Interna), elegí el año de supervisión y presioná **"Fijar y Consolidar Datos"**. Los datos se guardan en `datasets` (estado local) y, si Supabase está configurado, se sincronizan automáticamente en `risk_datasets`.
