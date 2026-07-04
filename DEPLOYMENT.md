# 🚀 Guía de Deployment - Vercel + Supabase

## 📋 Pre-requisitos

1. **Cuenta Vercel**: https://vercel.com
2. **Cuenta Google AI Studio**: https://aistudio.google.com (para Gemini API)
3. **Cuenta Supabase**: https://supabase.com (para base de datos)
4. **Git + GitHub**: Repositorio en GitHub

---

## 🔑 PASO 1: Obtener las Claves API

### A) GEMINI_API_KEY
1. Ir a https://aistudio.google.com/app/apikeys
2. Crear una nueva API key
3. Copiar la clave (ej: `AIzaSyD1234567890...`)

### B) SUPABASE (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY)
1. Ir a https://supabase.com y crear un proyecto
2. Ir a **Settings** → **API**
3. Copiar:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon (public)** → `VITE_SUPABASE_ANON_KEY`

---

## 🔗 PASO 2: Conectar GitHub a Vercel

1. Ir a https://vercel.com/dashboard
2. Click en **"Add New..."** → **"Project"**
3. Seleccionar tu repositorio `diplo_matriz_tp`
4. Vercel detectará automáticamente:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

---

## 🔐 PASO 3: Agregar Variables de Entorno en Vercel

1. En tu proyecto Vercel → **Settings** → **Environment Variables**
2. Agregar las 3 variables:

```
GEMINI_API_KEY = "AIzaSyD1234567890..."
VITE_SUPABASE_URL = "https://tu-proyecto.supabase.co"
VITE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI..."
```

3. Seleccionar ambientes: ✅ **Production** ✅ **Preview** ✅ **Development**
4. Hacer click en **"Save"**

---

## 🗄️ PASO 4: Crear Tablas en Supabase (Requerido para persistencia real)

Abrí el archivo `scripts/init-supabase.sql` de este repo, copiá **todo** su contenido en el SQL Editor de Supabase y ejecutalo. Ese script es la única fuente de verdad del esquema (crea `risk_datasets`, `risk_calculations`, `risk_thresholds` y `risk_reports` con los tipos exactos que usa el código — importante: `bank_id` es `INT`, no `TEXT`, para que coincida con lo que graba `src/App.tsx`).

Si vas a usar la ANON KEY directo desde el navegador (sin login de usuarios todavía), al final del script vas a encontrar comentadas las líneas de `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + `CREATE POLICY ...`. Descomentalas y ejecutalas también, o las inserciones desde la app van a fallar por permisos.

---

## ✅ PASO 5: Deploy a Vercel

1. Asegúrate de que las 3 variables estén en Vercel Settings
2. Hacer un **push a main** en GitHub:
   ```bash
   git add .
   git commit -m "Deploy: Configuración lista para Vercel"
   git push origin main
   ```
3. Vercel detectará el cambio y **desplegará automáticamente**
4. Esperar a que termine el build (2-3 min)
5. Ver el URL: `https://tu-proyecto.vercel.app`

---

## 🧪 PASO 6: Verificar que Funciona

### Verificar Frontend
- Ir a `https://tu-proyecto.vercel.app`
- Debe cargar la aplicación React

### Verificar API /api/analyze
```bash
curl -X POST https://tu-proyecto.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "banks": [
      {
        "code": "13",
        "name": "BANCO M S.A.",
        "deposits": 40,
        "clients": 120,
        "audit": 30,
        "total": 190,
        "riskLevel": "Alto"
      }
    ],
    "year": "2025"
  }'
```

Debe retornar un JSON con `report: "...texto del análisis..."`

### Verificar API /api/chat
```bash
curl -X POST https://tu-proyecto.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "¿Cuál es el banco con mayor riesgo?"}],
    "banks": [
      {
        "code": "13",
        "name": "BANCO M",
        "deposits": 40,
        "clients": 120,
        "audit": 30,
        "total": 190,
        "riskLevel": "Alto"
      }
    ],
    "year": "2025"
  }'
```

Debe retornar un JSON con `reply: "...respuesta del asistente..."`

---

## 🐛 TROUBLESHOOTING

### ❌ Error: "GEMINI_API_KEY no está configurada"
**Solución**: 
1. Ir a Vercel → Settings → Environment Variables
2. Verificar que `GEMINI_API_KEY` está agregada
3. Hacer redeploy: **Deployments** → Click en el deploy → **Redeploy**

### ❌ Error: "Supabase connection failed"
**Solución**:
1. Verificar que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` están en Vercel
2. Ir a Supabase Dashboard → verificar que el proyecto está activo
3. Copiar las keys nuevamente desde Supabase

### ❌ Error 404 en API
**Solución**:
1. Verificar que los archivos `api/analyze.ts` y `api/chat.ts` existen
2. Verificar `vercel.json` está correcto
3. Hacer redeploy

### ❌ "Build failed"
**Solución**:
1. Ver logs en Vercel → Deployments → Click en "Failed"
2. Verificar que todas las dependencias están en `package.json`
3. Hacer `npm install` localmente y verificar que no hay errores

---

## 📱 Desarrollo Local

Para probar localmente:

```bash
# Instalar dependencias
npm install

# Desarrollo (Vite + Frontend)
npm run dev

# Esto abre: http://localhost:5173
# Los API calls van a /api/analyze, /api/chat

# Los endpoints serverless NO se pueden probar localmente
# pero el frontend hará llamadas HTTP reales a Vercel
```

---

## 🔄 Actualizar Código

Cada vez que hagas cambios:

```bash
git add .
git commit -m "Fix: descripción del cambio"
git push origin main
```

Vercel automáticamente:
1. Detecta el cambio
2. Corre `npm run build`
3. Despliega a producción
4. Puedes ver el progreso en Vercel Dashboard

---

## ✨ Listo!

Tu aplicación está en producción:
- **Frontend**: `https://tu-proyecto.vercel.app`
- **API /analyze**: `https://tu-proyecto.vercel.app/api/analyze`
- **API /chat**: `https://tu-proyecto.vercel.app/api/chat`
- **Base de datos**: Supabase

🎉 ¡Felicidades!
