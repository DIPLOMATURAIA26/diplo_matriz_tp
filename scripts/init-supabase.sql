-- ============================================
-- SCRIPT DE INICIALIZACIÓN SUPABASE
-- Sistema de Supervisión Bancaria - Matriz de Riesgo
--
-- Este script refleja EXACTAMENTE las columnas que la aplicación lee y
-- escribe (src/lib/supabase.ts y src/App.tsx). No incluye bancos
-- precargados: las entidades (código, nombre y valores) se cargan
-- 100% desde los archivos Excel/CSV que subís en el panel de carga.
-- ============================================

-- 1. Datos Brutos por Período (Depósitos, Clientes, Auditoría), consolidados
--    por ID Único de Entidad. code/name quedan denormalizados acá porque
--    provienen directamente del archivo Excel de cada período (una entidad
--    puede cambiar de razón social entre años sin perder trazabilidad,
--    porque el cruce siempre se hace por bank_id).
CREATE TABLE IF NOT EXISTS risk_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year TEXT NOT NULL,
  bank_id INT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  raw_deposits BIGINT NOT NULL,
  raw_clients BIGINT NOT NULL,
  raw_audit INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (year, bank_id)
);

-- 2. Resultados Calculados (Coeficientes + Total + Nivel de Riesgo)
CREATE TABLE IF NOT EXISTS risk_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year TEXT NOT NULL,
  bank_id INT NOT NULL,
  deposits DECIMAL(10,2) NOT NULL,
  clients DECIMAL(10,2) NOT NULL,
  audit DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  risk_level TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (year, bank_id)
);

-- 3. Configuración de Umbrales (Calibración global de ponderadores)
CREATE TABLE IF NOT EXISTS risk_thresholds (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Reportes Ejecutivos (Generados por Gemini AI vía /api/analyze)
CREATE TABLE IF NOT EXISTS risk_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year TEXT NOT NULL UNIQUE,
  report_text TEXT NOT NULL,
  generated_by TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA OPTIMIZAR QUERIES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_risk_datasets_year ON risk_datasets(year);
CREATE INDEX IF NOT EXISTS idx_risk_datasets_bank_id ON risk_datasets(bank_id);
CREATE INDEX IF NOT EXISTS idx_risk_datasets_year_bank ON risk_datasets(year, bank_id);
CREATE INDEX IF NOT EXISTS idx_risk_calculations_year ON risk_calculations(year);
CREATE INDEX IF NOT EXISTS idx_risk_calculations_bank_id ON risk_calculations(bank_id);
CREATE INDEX IF NOT EXISTS idx_risk_calculations_year_bank ON risk_calculations(year, bank_id);
CREATE INDEX IF NOT EXISTS idx_risk_reports_year ON risk_reports(year);

-- ============================================
-- (Opcional) Habilitar Row Level Security + policy de lectura/escritura
-- pública si vas a usar la ANON KEY directo desde el navegador y todavía
-- no tenés autenticación de usuarios. Ajustá esto antes de ir a producción
-- real con datos sensibles.
-- ============================================
-- ALTER TABLE risk_datasets ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "public read/write risk_datasets" ON risk_datasets FOR ALL USING (true) WITH CHECK (true);
-- ALTER TABLE risk_calculations ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "public read/write risk_calculations" ON risk_calculations FOR ALL USING (true) WITH CHECK (true);
-- ALTER TABLE risk_thresholds ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "public read/write risk_thresholds" ON risk_thresholds FOR ALL USING (true) WITH CHECK (true);
-- ALTER TABLE risk_reports ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "public read/write risk_reports" ON risk_reports FOR ALL USING (true) WITH CHECK (true);
