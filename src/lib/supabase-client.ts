import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Detectar si Supabase está configurado
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

export let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
  console.log("✅ Supabase inicializado correctamente");
} else {
  console.warn("⚠️ Supabase no configurado. Comprueba VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY");
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
}

export interface RiskThreshold {
  id: string;
  data: Record<string, any>;
  updated_at: string;
}
