# 🧹 ARCHIVOS LIMPIOS — Sin Hardcodeado

**Versión**: 1.0  
**Fecha**: 4 de julio 2026  
**Estado**: Listo para reemplazar

---

## 📥 DESCARGAS

Tenés **2 archivos limpios**:

| Archivo | Reemplaza | Cambios |
|---------|-----------|---------|
| **`utils_CLEAN.ts`** | `src/utils.ts` | Eliminó RAW_DATASETS + generador dinámico |
| **`App_CLEAN.tsx`** | `src/App.tsx` | Eliminó PRELOADED_REPORTS + valores por defecto |

---

## ✅ ¿QUÉ CAMBIÓ?

### **1. `utils_CLEAN.ts`**

**Eliminado**:
- ❌ `RAW_DATASETS["2024"]` (42 líneas de datos simulados)
- ❌ `RAW_DATASETS["2025"]` (42 líneas de datos simulados)
- ❌ `RAW_DATASETS["2026"]` (43 líneas de datos simulados)
- ❌ Loop generador dinámico 2021-2045 (58 líneas)

**Reemplazado por**:
```typescript
export const RAW_DATASETS: Record<string, BankRawData[]> = {};
// Los datos vienen de Supabase via loadRiskDatasetsByYear()
```

**Umbrales** (`DEFAULT_THRESHOLDS`):
- ✅ MANTIENE (es fallback de Supabase `risk_thresholds`)

---

### **2. `App_CLEAN.tsx`**

**Eliminado**:
- ❌ `PRELOADED_REPORTS["2024"]` (plantilla 1500+ caracteres)
- ❌ `PRELOADED_REPORTS["2025"]` (plantilla 1500+ caracteres)
- ❌ `PRELOADED_REPORTS["2026"]` (plantilla 1500+ caracteres)

**Reemplazado por**:
```typescript
const PRELOADED_REPORTS: Record<string, string> = {};
// Los reportes se generan con Gemini AI
```

**Valores por defecto**:
- ❌ `setUploadedSaldosName("SALDOS.xlsx")` → ✅ `"No cargado"`
- ❌ `setUploadedClientsName("CLIENTES.xlsx")` → ✅ `"No cargado"`
- ❌ `setUploadedAuditName("AI.xlsx")` → ✅ `"No cargado"`
- ✅ `[report]` inicial → ✅ Mensaje: "Selecciona un año y presiona 'Recalcular'..."

---

## 📊 LÍNEAS ELIMINADAS

| Archivo | Líneas eliminadas | Contenido |
|---------|---|---|
| `utils.ts` | 47-233 | RAW_DATASETS + generador dinámico |
| `App.tsx` | 38-81 | PRELOADED_REPORTS |
| **Total** | **~250 líneas** | **100% de datos simulados** |

---

## 🚀 CÓMO USAR

```bash
# 1. Descargar archivos
# utils_CLEAN.ts → renombra a utils.ts
# App_CLEAN.tsx → renombra a App.tsx

# 2. Reemplazar en tu repo
cd tu_repo/src
cp ~/Downloads/utils_CLEAN.ts ./utils.ts
cp ~/Downloads/App_CLEAN.tsx ./App.tsx

# 3. Push
git add src/
git commit -m "chore: remove hardcoded datasets and preformatted reports"
git push origin main

# 4. Vercel redeploya automáticamente
```

---

## ⚠️ CAMBIOS DE COMPORTAMIENTO

### **Antes (Simulado)**
```
User abre app
  ↓
App carga RAW_DATASETS["2025"]
  ↓
Tabla muestra 5 bancos con datos ficticios
  ↓
User ve PRELOADED_REPORTS["2025"]
  ↓
User recarga → mismos datos (hardcodeados)
```

### **Después (Supabase-centric)**
```
User abre app
  ↓
App intenta cargar de Supabase
  ├─ Si existe → muestra datos reales
  └─ Si no existe → tabla vacía + "Cargar datos"
  ↓
User ve: "Selecciona año y presiona Recalcular..."
  ↓
User pide reporte → Gemini genera uno dinámico
  ↓
Usuario recarga → reportes/datos de Supabase (persistentes)
```

---

## 🔍 ¿POR QUÉ NO CARGARON DATOS EN SUPABASE?

### **Diagnosis necesaria**

Para diagnosticar por qué fallaron los inserts, necesito saber:

1. **¿Cuál fue el error exacto?**
   - ¿Mensaje de error en consola?
   - ¿Timeout?
   - ¿Permission denied?
   - ¿Constraint violation?

2. **¿De dónde intentaste insertar?**
   - ¿Desde Supabase UI (SQL Editor)?
   - ¿Desde frontend (JavaScript)?
   - ¿Desde terminal (curl)?

3. **¿Qué datos?**
   - ¿Excel cargado vía UI?
   - ¿JSON?
   - ¿SQL directo?

4. **¿En qué tabla?**
   - ¿`risk_datasets`?
   - ¿`risk_calculations`?
   - ¿Otra?

---

## 🎯 PRÓXIMOS PASOS

### **1. Reemplaza archivos** (5 min)
Descarga `utils_CLEAN.ts` y `App_CLEAN.tsx`, renombra y reemplaza.

### **2. Responde las preguntas de diagnóstico** (2 min)
Dame detalles del error de Supabase.

### **3. Cargo datos correctamente** (30 min)
Con MCP Supabase, inserto datos formalmente:
```sql
INSERT INTO risk_datasets (year, bank_id, raw_deposits, raw_clients, raw_audit)
VALUES ('2024', 13, 9500, 2500000, 5),
       ('2024', 5, 11000, 1800000, 2),
       ...
```

### **4. Verificamos en Vercel** (5 min)
App carga datos de Supabase automáticamente.

---

## 📋 RESUMEN DE CAMBIOS

**Archivos**:
- `src/utils.ts` → `utils_CLEAN.ts` (185 líneas más corto)
- `src/App.tsx` → `App_CLEAN.tsx` (44 líneas más corto)

**Código eliminado**:
- ❌ 250 líneas de datos simulados
- ❌ Generador dinámico de años
- ❌ Reportes textuales hardcodeados
- ✅ Mantiene: lógica de cálculo, estructura, UI

**Base de datos**:
- 🔴 Año 2020: Está cargado (5 bancos)
- 🔴 Años 2024-2026: Falló al cargar
- 🟡 Años 2021-2023, 2027+: No cargados

---

## 🔧 TEST RÁPIDO

Después de reemplazar, abre DevTools y:

```javascript
// En consola, esto debería estar vacío:
console.log(RAW_DATASETS);
// Resultado: {}

// Los reportes también:
console.log(PRELOADED_REPORTS);
// Resultado: {}
```

Si ves datos → significa que los archivos no se reemplazaron bien.

---

## 📞 PARA CONTINUAR

Descarga los 2 archivos, reemplaza en tu repo, **y cuéntame qué error viste cuando intentaste cargar datos en Supabase**.

Con eso diagnosis hago los inserts correctamente y te muestro dónde falló.

---

*Documento generado: 4 de julio 2026*
*Archivos listos para descargar ⬆️*
