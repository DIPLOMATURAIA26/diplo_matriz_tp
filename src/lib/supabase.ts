import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "";

// Initialize Supabase client only if credentials are provided to prevent startup crashes.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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
