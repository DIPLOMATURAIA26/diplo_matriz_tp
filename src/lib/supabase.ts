import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "";

// Initialize Supabase client only if credentials are provided to prevent startup crashes.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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
 * SQL Schema for Supabase Tables (Run this in Supabase SQL Editor):
 * 
 * -- 1. Table for calibration thresholds
 * CREATE TABLE IF NOT EXISTS risk_thresholds (
 *   id TEXT PRIMARY KEY,
 *   data JSONB NOT NULL,
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 * 
 * -- 2. Table for consolidated bank datasets
 * CREATE TABLE IF NOT EXISTS risk_datasets (
 *   year TEXT NOT NULL,
 *   bank_id TEXT NOT NULL,
 *   code TEXT NOT NULL,
 *   name TEXT NOT NULL,
 *   raw_deposits BIGINT NOT NULL,
 *   raw_clients BIGINT NOT NULL,
 *   raw_audit INT NOT NULL,
 *   PRIMARY KEY (year, bank_id)
 * );
 * 
 * -- 3. Table for generated executive reports
 * CREATE TABLE IF NOT EXISTS risk_reports (
 *   year TEXT PRIMARY KEY,
 *   report_text TEXT NOT NULL,
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 */
