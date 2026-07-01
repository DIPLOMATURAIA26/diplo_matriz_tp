# 📊 Motor de Inteligencia de Supervisión Bancaria - Guía de Producción (GitHub + Supabase + Vercel)

Esta aplicación es una herramienta de supervisión bancaria consolidada con un motor cognitivo de riesgo potenciado por **Gemini AI** y persistencia en tiempo real con **Supabase**.

A continuación se detalla el proceso para realizar el deploy del código sanitizado y su integración definitiva.

---

## 🛠️ Paso 1: Configurar la Base de Datos en Supabase

1. Crea un proyecto gratuito en [Supabase](https://supabase.com).
2. Ve al **SQL Editor** de tu proyecto y ejecuta el siguiente script para crear las tablas requeridas por la aplicación:

```sql
-- 1. Tabla para calibración de ponderadores y umbrales de riesgo
CREATE TABLE IF NOT EXISTS risk_thresholds (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla para almacenar las matrices consolidadas por periodo/año
CREATE TABLE IF NOT EXISTS risk_datasets (
  year TEXT NOT NULL,
  bank_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  raw_deposits BIGINT NOT NULL,
  raw_clients BIGINT NOT NULL,
  raw_audit INT NOT NULL,
  PRIMARY KEY (year, bank_id)
);

-- 3. Tabla para almacenar los reportes ejecutivos generados por Gemini AI
CREATE TABLE IF NOT EXISTS risk_reports (
  year TEXT PRIMARY KEY,
  report_text TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

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
- [x] **Año 2020 para Pruebas de Carga**: Se removieron los datos pre-cargados para el año **2020**, permitiendo a cualquier supervisor hacer clic en el año 2020 y experimentar el flujo de carga desde cero con archivos de ejemplo.
