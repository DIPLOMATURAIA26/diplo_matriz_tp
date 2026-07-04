-- ============================================
-- SCRIPT DE INICIALIZACIÓN SUPABASE
-- Sistema de Supervisión Bancaria - Matriz de Riesgo
--
-- Este es el esquema real y vigente (coincide con lo que ya tenés corriendo
-- en tu proyecto de Supabase). El maestro `banks` es la única fuente de
-- verdad para código/nombre de cada entidad: los 3 Excel que subís
-- (Depósitos, Clientes, Auditoría) se cruzan por bank_id contra este
-- maestro, así una entidad se reconoce aunque el archivo traiga su nombre
-- escrito distinto entre años.
-- ============================================

-- 1. Maestro de Entidades Bancarias (20 bancos fijos)
CREATE TABLE IF NOT EXISTS banks (
  id INT PRIMARY KEY,
  code INT NOT NULL,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar los 20 bancos (no pisa filas que ya existan)
INSERT INTO banks (id, code, name) VALUES
(1, 1, 'BANCO A'),
(2, 2, 'BANCO B'),
(3, 3, 'BANCO C'),
(4, 4, 'BANCO D'),
(5, 5, 'BANCO E'),
(6, 6, 'BANCO F'),
(7, 7, 'BANCO G'),
(8, 8, 'BANCO H'),
(9, 9, 'BANCO I'),
(10, 10, 'BANCO J'),
(11, 11, 'BANCO K'),
(12, 12, 'BANCO L'),
(13, 13, 'BANCO M'),
(14, 14, 'BANCO N'),
(15, 15, 'BANCO O'),
(16, 16, 'BANCO P'),
(17, 17, 'BANCO Q'),
(18, 18, 'BANCO R'),
(19, 19, 'BANCO S'),
(20, 20, 'BANCO T')
ON CONFLICT (id) DO NOTHING;

-- 2. Datos Brutos por Período (Depósitos, Clientes, Auditoría), sin duplicar
--    code/name: se resuelven contra `banks` por bank_id.
CREATE TABLE IF NOT EXISTS risk_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year TEXT NOT NULL,
  bank_id INT NOT NULL REFERENCES banks(id),
  raw_deposits BIGINT NOT NULL,
  raw_clients BIGINT NOT NULL,
  raw_audit INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, bank_id)
);

-- 3. Resultados Calculados (Coeficientes + Total + Nivel de Riesgo)
CREATE TABLE IF NOT EXISTS risk_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year TEXT NOT NULL,
  bank_id INT NOT NULL REFERENCES banks(id),
  deposits DECIMAL(10,2) NOT NULL,
  clients DECIMAL(10,2) NOT NULL,
  audit DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  risk_level TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, bank_id)
);

-- 4. Configuración de Umbrales (Calibración global)
CREATE TABLE IF NOT EXISTS risk_thresholds (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Reportes Ejecutivos (Generados por Gemini AI)
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
-- no tenés autenticación de usuarios.
-- ============================================
-- ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "public read/write banks" ON banks FOR ALL USING (true) WITH CHECK (true);
-- ALTER TABLE risk_datasets ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "public read/write risk_datasets" ON risk_datasets FOR ALL USING (true) WITH CHECK (true);
-- ALTER TABLE risk_calculations ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "public read/write risk_calculations" ON risk_calculations FOR ALL USING (true) WITH CHECK (true);
-- ALTER TABLE risk_thresholds ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "public read/write risk_thresholds" ON risk_thresholds FOR ALL USING (true) WITH CHECK (true);
-- ALTER TABLE risk_reports ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "public read/write risk_reports" ON risk_reports FOR ALL USING (true) WITH CHECK (true);
