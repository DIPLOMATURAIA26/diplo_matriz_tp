# 📝 Resumen de Cambios — Persistencia en Supabase

## ✅ Modificaciones Realizadas

### 1. **`src/lib/supabase.ts`** — Agregadas 2 funciones helper

#### `saveRiskCalculations(year, calculations)`
- Persiste cálculos de riesgo para todos los bancos en un período
- Usa `.upsert()` con clave compuesta `(year, bank_id)`
- Maneja errores de forma silenciosa (log en consola)
- Se ejecuta automáticamente cuando cambia el año o thresholds

**Uso**:
```typescript
const calcData = computed.map((bank) => ({
  bank_id: parseInt(bank.code, 10),
  deposits: bank.deposits,
  clients: bank.clients,
  audit: bank.audit,
  total: bank.total,
  risk_level: bank.riskLevel,
}));
await saveRiskCalculations(year, calcData);
```

#### `saveRiskReport(year, reportText, generatedBy)`
- Persiste reporte ejecutivo para un período
- Usa `.upsert()` con clave primaria `year`
- Marca quién generó el reporte (`"gemini-ai"` o `"system"`)

**Uso**:
```typescript
await saveRiskReport(year, reportText, "gemini-ai");
```

---

### 2. **`src/App.tsx`** — 3 cambios operacionales

#### Cambio A: Import de funciones (línea 31)
```typescript
// ANTES
import { supabase, isSupabaseConfigured } from "./lib/supabase";

// DESPUÉS
import { supabase, isSupabaseConfigured, saveRiskCalculations, saveRiskReport } from "./lib/supabase";
```

#### Cambio B: Sincronización automática de cálculos (línea 348-365)
```typescript
// AHORA: Cuando cambia año/thresholds → auto-guarda en Supabase
useEffect(() => {
  const rawList = datasets[year] || datasets["2025"];
  const computed = rawList.map((raw) => computeBankScores(raw, thresholds));
  setBanks(computed);

  // ← NUEVO: Persist to Supabase
  if (isSupabaseConfigured) {
    const calcData = computed.map((bank) => ({...}));
    saveRiskCalculations(year, calcData);
  }
}, [year, thresholds, datasets]);
```

#### Cambio C: Guardar reporte de Gemini (línea 406-449)
```typescript
// AHORA: handleRegenerateReport usa saveRiskReport
const handleRegenerateReport = async () => {
  // ... llamada a /api/analyze
  const reportText = data.report || "...";
  setReport(reportText);
  
  // ← NUEVO: Usar función helper
  if (isSupabaseConfigured && data.report) {
    await saveRiskReport(year, reportText, "gemini-ai");
  }
};
```

---

## 🔄 Flujo Actualizado

### Antes (sin persistencia)
```
Usuario selecciona año/thresholds
    ↓
Frontend calcula risk_calculations
    ↓
Datos quedan SOLO en memoria (React state)
    ✗ Se pierden al recargar página
```

### Ahora (con persistencia)
```
Usuario selecciona año/thresholds
    ↓
Frontend calcula risk_calculations
    ↓
saveRiskCalculations() → Supabase (automático)
    ↓
Datos guardados en risk_calculations table
    ✓ Persisten entre recargas
```

---

## 🎯 Tabla de BD Actualizada

### `risk_calculations` — Estructura esperada
```sql
CREATE TABLE risk_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year TEXT NOT NULL,
  bank_id INT NOT NULL REFERENCES banks(id),
  deposits DECIMAL(10,2) NOT NULL,
  clients DECIMAL(10,2) NOT NULL,
  audit DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  risk_level TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(year, bank_id)  ← Clave para upsert
);
```

### `risk_reports` — Estructura esperada
```sql
CREATE TABLE risk_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year TEXT NOT NULL UNIQUE,  ← Clave para upsert
  report_text TEXT NOT NULL,
  generated_by TEXT DEFAULT 'system',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## ⚡ Env Vars Verificadas en Vercel

✅ `VITE_SUPABASE_URL` — Configurado  
✅ `VITE_SUPABASE_ANON_KEY` — Configurado  
✅ `GEMINI_API_KEY` — Configurado  

**Estado**: Listo para deploy

---

## 📦 Próximos Pasos

1. **Reemplazar archivos**:
   ```bash
   cp App.tsx src/
   cp supabase.ts src/lib/
   ```

2. **Instalar dependencias** (si no están):
   ```bash
   npm install
   ```

3. **Hacer commit y push**:
   ```bash
   git add src/
   git commit -m "feat: agregar persistencia de risk_calculations y risk_reports en Supabase"
   git push origin main
   ```

4. **Vercel desplegará automáticamente**

5. **Verificar en navegador**:
   - Abre DevTools → Console
   - Busca: `✅ Risk calculations guardados` / `✅ Risk report guardado`
   - Si ves esos logs → todo funciona

---

## 🔍 Testing

### En consola (DevTools)
```javascript
// Para ver si Supabase está configurado
supabase  // debería mostrar el cliente

// Para verificar que los datos se guardaron
fetch('https://buxjktfxfhlvggioqfdk.supabase.co/rest/v1/risk_calculations?select=*', {
  headers: {
    'Authorization': 'Bearer tu_anon_key',
    'apikey': 'tu_anon_key'
  }
})
.then(r => r.json())
.then(console.log)
```

---

## ⚠️ Notas Importantes

- **RLS está deshabilitado** (testing mode) → cualquiera puede leer/escribir
  - Cambiar cuando salga a producción
- **Errores se logean silenciosamente** → revisar console.log si algo falla
- **No hay validación de datos** en el frontend
  - Agregar si es necesario después
- **Gemini API** → debe estar configurado en Vercel para que `/api/analyze` funcione

---

*Cambios realizados: 3 de julio de 2026*
*Versión: 1.0*
