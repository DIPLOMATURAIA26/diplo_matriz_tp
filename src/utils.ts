import { Bank } from "./types";

export interface BankRawData {
  id: string;
  code: string;
  name: string;
  rawDeposits: number; // in Millions of USD, e.g. 15000, 7500, 3000
  rawClients: number;  // count, e.g. 4200000, 2500000, 800000
  rawAudit: number;    // count of observations, e.g. 5, 8, 2, 10
}

export interface ThresholdConfig {
  dep1Val: number; dep1Score: number; dep1Idx: number;
  dep2Val: number; dep2Score: number; dep2Idx: number;
  dep3Val: number; dep3Score: number; dep3Idx: number;
  dep4Score: number; dep4Idx: number;

  cli1Val: number; cli1Score: number; cli1Idx: number;
  cli2Val: number; cli2Score: number; cli2Idx: number;
  cli3Val: number; cli3Score: number; cli3Idx: number;
  cli4Score: number; cli4Idx: number;

  aud1Val: number; aud1Score: number; aud1Idx: number;
  aud2Val: number; aud2Score: number; aud2Idx: number;
  aud3Val: number; aud3Score: number; aud3Idx: number;
  aud4Score: number; aud4Idx: number;
}

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  dep1Val: 12000, dep1Score: 40, dep1Idx: 1.0,
  dep2Val: 8000,  dep2Score: 32, dep2Idx: 0.8,
  dep3Val: 5000,  dep3Score: 16, dep3Idx: 0.4,
  dep4Score: 6,                  dep4Idx: 0.15,

  cli1Val: 3600000, cli1Score: 120, cli1Idx: 1.0,
  cli2Val: 1200000, cli2Score: 90,  cli2Idx: 0.75,
  cli3Val: 1000000, cli3Score: 12,  cli3Idx: 0.1,
  cli4Score: 4.5,                   cli4Idx: 0.0375,

  aud1Val: 7, aud1Score: 30, aud1Idx: 1.0,
  aud2Val: 6, aud2Score: 24, aud2Idx: 0.8,
  aud3Val: 4, aud3Score: 12, aud3Idx: 0.4,
  aud4Score: 4.5,            aud4Idx: 0.15,
};

/**
 * DATOS ELIMINADOS — Ahora leen de Supabase `risk_datasets`
 * 
 * El frontend cargará datos dinámicamente de Supabase via loadRiskDatasetsByYear()
 * Mantener este objeto VACÍO como fallback si Supabase está vacío
 */
export const RAW_DATASETS: Record<string, BankRawData[]> = {};

// Computes standard risk total score & risk level
export function computeRisk(deposits: number, clients: number, audit: number): { total: number, riskLevel: 'Alto' | 'Medio' | 'Bajo' } {
  const total = parseFloat((deposits + clients + audit).toFixed(2));
  let riskLevel: 'Alto' | 'Medio' | 'Bajo' = 'Bajo';
  if (total >= 130) {
    riskLevel = 'Alto';
  } else if (total >= 90) {
    riskLevel = 'Medio';
  }
  return { total, riskLevel };
}

// Computes bank scores dynamically with current calibrated thresholds
export function computeBankScores(
  raw: BankRawData,
  cfg: ThresholdConfig
): Bank {
  // Deposits
  let deposits = cfg.dep4Score;
  let depositIndex = cfg.dep4Idx;
  if (raw.rawDeposits > cfg.dep1Val) {
    deposits = cfg.dep1Score;
    depositIndex = cfg.dep1Idx;
  } else if (raw.rawDeposits >= cfg.dep2Val) {
    deposits = cfg.dep2Score;
    depositIndex = cfg.dep2Idx;
  } else if (raw.rawDeposits >= cfg.dep3Val) {
    deposits = cfg.dep3Score;
    depositIndex = cfg.dep3Idx;
  }

  // Clients
  let clients = cfg.cli4Score;
  let clientIndex = cfg.cli4Idx;
  if (raw.rawClients >= cfg.cli1Val) {
    clients = cfg.cli1Score;
    clientIndex = cfg.cli1Idx;
  } else if (raw.rawClients >= cfg.cli2Val) {
    clients = cfg.cli2Score;
    clientIndex = cfg.cli2Idx;
  } else if (raw.rawClients >= cfg.cli3Val) {
    clients = cfg.cli3Score;
    clientIndex = cfg.cli3Idx;
  }

  // Audit
  let audit = cfg.aud4Score;
  let auditIndex = cfg.aud4Idx;
  if (raw.rawAudit > cfg.aud1Val) {
    audit = cfg.aud1Score;
    auditIndex = cfg.aud1Idx;
  } else if (raw.rawAudit >= cfg.aud2Val) {
    audit = cfg.aud2Score;
    auditIndex = cfg.aud2Idx;
  } else if (raw.rawAudit >= cfg.aud3Val) {
    audit = cfg.aud3Score;
    auditIndex = cfg.aud3Idx;
  }

  const { total, riskLevel } = computeRisk(deposits, clients, audit);

  return {
    id: raw.id,
    code: raw.code,
    name: raw.name,
    deposits,
    clients,
    audit,
    total,
    riskLevel,
    depositIndex,
    clientIndex,
    auditIndex
  };
}
