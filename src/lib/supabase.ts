import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "";

// Initialize Supabase client only if credentials are provided to prevent startup crashes.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Leer el maestro fijo de entidades bancarias (tabla `banks`).
 * code/name viven acá, no en risk_datasets, para no duplicarlos por año.
 */
export async function loadBanksMaster(): Promise<Array<{
  id: number;
  code: number;
  name: string;
}> | null> {
  if (!supabase) {
    console.warn("⚠️ Supabase no configurado, no se puede cargar el maestro de bancos");
    return null;
  }

  try {
    const { data, error } = await supabase.from("banks").select("id, code, name");
    if (error) {
      console.error("❌ Error cargando maestro de bancos:", error);
      return null;
    }
    return data || [];
  } catch (error) {
    console.error("❌ Error en loadBanksMaster:", error);
    return null;
  }
}

/**
 * Leer datos brutos de riesgo (risk_datasets) para un año desde Supabase.
 * No trae code/name: esas columnas viven en el maestro `banks` y se resuelven
 * en el cliente cruzando por bank_id.
 */
export async function loadRiskDatasetsByYear(year: string): Promise<Array<{
  year: string;
  bank_id: number;
  raw_deposits: number;
  raw_clients: number;
  raw_audit: number;
}> | null> {
  if (!supabase) {
    console.warn("⚠️ Supabase no configurado, no se pueden cargar risk_datasets");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("risk_datasets")
      .select("year, bank_id, raw_deposits, raw_clients, raw_audit")
      .eq("year", year);

    if (error) {
      console.error(`❌ Error cargando risk_datasets para ${year}:`, error);
      return null;
    }

    console.log(`✅ Datos cargados de Supabase para año ${year} (${data?.length || 0} bancos)`);
    return data || [];
  } catch (error) {
    console.error("❌ Error en loadRiskDatasetsByYear:", error);
    return null;
  }
}

/**
 * Guardar cálculos de riesgo para un período
 */
export async function saveRiskCalculations(
  year: string,
  calculations: Array<{
    bank_id: number;
    deposits: number;
    clients: number;
    audit: number;
    total: number;
    risk_level: string;
  }>
): Promise<void> {
  if (!supabase) {
    console.warn("⚠️ Supabase no configurado, ignorando persistencia de risk_calculations");
    return;
  }

  try {
    for (const calc of calculations) {
      const { error } = await supabase
        .from("risk_calculations")
        .upsert(
          {
            year,
            bank_id: calc.bank_id,
            deposits: calc.deposits,
            clients: calc.clients,
            audit: calc.audit,
            total: calc.total,
            risk_level: calc.risk_level,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "year,bank_id" }
        );

      if (error) {
        console.error(`❌ Error guardando risk_calculation para banco ${calc.bank_id}:`, error);
      }
    }
    console.log(`✅ Risk calculations guardados para ${year}`);
  } catch (error) {
    console.error("❌ Error en saveRiskCalculations:", error);
  }
}

/**
 * Guardar reporte de riesgo para un período
 */
export async function saveRiskReport(
  year: string,
  reportText: string,
  generatedBy: string = "system"
): Promise<void> {
  if (!supabase) {
    console.warn("⚠️ Supabase no configurado, ignorando persistencia de risk_reports");
    return;
  }

  try {
    const { error } = await supabase
      .from("risk_reports")
      .upsert(
        {
          year,
          report_text: reportText,
          generated_by: generatedBy,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "year" }
      );

    if (error) {
      console.error(`❌ Error guardando risk_report para ${year}:`, error);
    } else {
      console.log(`✅ Risk report guardado para ${year}`);
    }
  } catch (error) {
    console.error("❌ Error en saveRiskReport:", error);
  }
}

/**
 * SQL Schema for Supabase Tables — ver el esquema completo y autoritativo en
 * scripts/init-supabase.sql. Resumen:
 *
 * -- 0. Maestro fijo de entidades (code/name viven acá, no en risk_datasets)
 * CREATE TABLE IF NOT EXISTS banks (
 *   id INT PRIMARY KEY,
 *   code INT NOT NULL,
 *   name TEXT UNIQUE NOT NULL,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 *
 * -- 1. Table for calibration thresholds
 * CREATE TABLE IF NOT EXISTS risk_thresholds (
 *   id TEXT PRIMARY KEY,
 *   data JSONB NOT NULL,
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 *
 * -- 2. Datos brutos por período, referenciando el maestro por bank_id
 * CREATE TABLE IF NOT EXISTS risk_datasets (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   year TEXT NOT NULL,
 *   bank_id INT NOT NULL REFERENCES banks(id),
 *   raw_deposits BIGINT NOT NULL,
 *   raw_clients BIGINT NOT NULL,
 *   raw_audit INT NOT NULL,
 *   UNIQUE (year, bank_id)
 * );
 *
 * -- 3. Table for generated executive reports
 * CREATE TABLE IF NOT EXISTS risk_reports (
 *   year TEXT PRIMARY KEY,
 *   report_text TEXT NOT NULL,
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 */
