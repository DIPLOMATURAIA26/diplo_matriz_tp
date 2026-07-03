import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Detectar si Supabase está configurado en environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

export let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
    console.log("✅ Supabase inicializado correctamente");
  } catch (error) {
    console.error("❌ Error inicializando Supabase:", error);
    supabase = null;
  }
} else {
  console.warn("⚠️ Supabase no configurado");
  console.warn("   Agrega en Vercel Settings > Environment Variables:");
  console.warn("   - VITE_SUPABASE_URL");
  console.warn("   - VITE_SUPABASE_ANON_KEY");
}

// Tipos para Supabase
export interface Bank {
  id: number;
  code: number;
  name: string;
}

export interface RiskDataset {
  id: string;
  year: string;
  bank_id: number;
  code: string;
  name: string;
  raw_deposits: number;
  raw_clients: number;
  raw_audit: number;
  created_at: string;
}

export interface RiskCalculation {
  id: string;
  year: string;
  bank_id: number;
  deposits: number;
  clients: number;
  audit: number;
  total: number;
  risk_level: string;
  created_at: string;
}

export interface RiskReport {
  id: string;
  year: string;
  report_text: string;
  generated_by: string;
  created_at: string;
  updated_at: string;
}

export interface RiskThreshold {
  id: string;
  data: Record<string, any>;
  updated_at: string;
}

/**
 * Helper para ejecutar operaciones con reintentos
 */
export async function retryableSupabaseCall<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0) {
      console.warn(`⚠️ Reintentando Supabase (${3 - retries}/3)...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryableSupabaseCall(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}
