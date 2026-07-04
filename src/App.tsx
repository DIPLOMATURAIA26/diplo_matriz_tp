import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx-js-style";
import { 
  Building2, 
  ShieldAlert, 
  FileText, 
  RefreshCw, 
  Download, 
  Check, 
  AlertTriangle,
  UploadCloud,
  Database,
  Sliders,
  Sparkles,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  TrendingUp,
  FileDown,
  Info,
  Calendar,
  X,
  Plus,
  Grid
} from "lucide-react";
import { Bank } from "./types";
import { 
  RAW_DATASETS, 
  DEFAULT_THRESHOLDS, 
  ThresholdConfig, 
  computeBankScores,
  BankRawData 
} from "./utils";
import { supabase, isSupabaseConfigured, saveRiskCalculations, saveRiskReport, loadRiskDatasetsByYear } from "./lib/supabase";

// Static premium reports matching the exact requested format
const PRELOADED_REPORTS: Record<string, string> = {
  "2024": `### 📊 RESUMEN EJECUTIVO DE RIESGO 2024
En el período de supervisión 2024, el mapa de riesgo consolidado del sistema financiero presenta una vulnerabilidad crítica media, con 3 entidades financieras clasificadas bajo la categoría de **Alto Riesgo** y 1 en **Medio Riesgo**. La unificación a través de ID único del Escenario A ha permitido detectar fallas de reporte en controles internos tempranos. El principal motor del Coeficiente Consolidado promedio es la expansión masiva en cantidad de clientes sin la debida madurez en auditoría preventiva.

### 🚨 ALERTAS DE SUPERVISIÓN PRIORITARIA
- **BANCO M S.A. (Coeficiente: 134):** Registra el mayor nivel de riesgo debido a una combinación de depósitos moderados (32 puntos) con un volumen crítico de clientes (90 puntos) y deficiencias iniciales en su estructura de Auditoría Interna.
- **BANCO C (Coeficiente: 130.5):** Entidad catalogada de Alto Riesgo, impulsada de forma casi exclusiva por poseer el límite superior de Clientes (120 puntos), lo que demanda un incremento urgente en sus resguardos operativos.
- **BANCO T S.R.L (Coeficiente: 130):** En categoría de Alto Riesgo como consecuencia de acumular deficiencias sustanciales en Auditoría Interna (24 observaciones/puntos), revelando fallas sistémicas.

### 💡 HALLAZGOS Y ANOMALÍAS DETECTADAS
- **Asimetría Operativa en BANCO C:** Se evidencia un quiebre de control, operando con baja escala de depósitos ($3.500 Millones) pero con una base inmensa de clientes, lo que multiplica los riesgos transaccionales.
- **Debilidad en Auditoría Interna:** Tres de las cinco entidades muestran coeficientes de Auditoría Interna insuficientes para el nivel de digitalización de sus carteras, indicando una falta de resiliencia ante riesgos operativos de PLA/FT.

Periodo de supervisión consolidado analizado: 2024`,

  "2025": `### 📊 RESUMEN EJECUTIVO DE RIESGO 2025
En el período 2025, el sistema financiero bajo supervisión presenta un perfil de riesgo consolidado altamente crítico, con un total de 4 entidades de un universo de 5 clasificadas en la categoría de **Alto Riesgo**. El Coeficiente de Riesgo Promedio alcanza los 123.6 puntos, impulsado de manera determinante por los factores de escala operativa en cantidad de clientes y deficiencias severas en el control de Auditoría Interna de los principales operadores. La unificación consolidada del Escenario A mediante ID único ha permitido neutralizar distorsiones de reporte sectorial, garantizando la trazabilidad absoluta de las alertas prioritarias.

### 🚨 ALERTAS DE SUPERVISIÓN PRIORITARIA
- **BANCO M S.A. (Coeficiente: 172):** Registra el máximo de exposición sistémica debido al Coeficiente de Volumen de Depósitos máximo (40 puntos) combinado con el límite superior de Cantidad de Clientes (120 puntos) y debilidades moderadas en Auditoría Interna (12 puntos), requiriendo un plan de remediación urgente de controles preventivos.
- **BANCO E (Coeficiente: 154):** Entidad en riesgo crítico impulsada por una preocupante combinación de alta captación de depósitos (40 puntos) y una alarmante acumulación de observaciones de Auditoría Interna (24 puntos), lo que expone al sistema a fallas de control operacional y cumplimiento.
- **BANCO T S.R.L (Coeficiente: 140.5):** Clasificado en Alto Riesgo por su alta cantidad de clientes (120 puntos), que satura su capacidad de control, junto a depósitos por 16 puntos y un control de auditoría inicial de 4.5 puntos.
- **BANCO C (Coeficiente: 136):** Entidad crítica debido a la acumulación severa de observaciones en Auditoría Interna, alcanzando el puntaje máximo de penalidad (30 puntos), lo que evidencia un quiebre total en su estructura de gobierno corporativo.

### 💡 HALLAZGOS Y ANOMALÍAS DETECTADAS
- **Asimetría de Control en BANCO C:** Se detecta una anomalía crítica en el BANCO C, el cual presenta un coeficiente de depósitos moderado (16 puntos) pero la máxima penalización en Auditoría Interna (30 observaciones/puntos), revelando que la entidad opera con un nivel de descontrol interno desproporcionado a su volumen financiero.
- **Tendencia Sistémica de Riesgo:** El perfil de riesgo de la muestra está impulsado de manera prioritaria por la escala masiva de Clientes (dos entidades con el máximo de 120 puntos) y por deficiencias de Auditoría Interna, lo que indica que las fallas de control interno y de cumplimiento normativo (PLA/FT) representan la principal vulnerabilidad del sistema financiero consolidado en el periodo analizado.

Periodo de supervisión consolidado analizado: 2025`,

  "2026": `### 📊 RESUMEN EJECUTIVO DE RIESGO 2026
En la proyección de supervisión para el periodo 2026, el sistema consolidado financiero muestra una persistencia del nivel crítico de riesgo, con un total de 4 de 5 entidades financieras consolidadas en categoría de **Alto Riesgo**. Los incrementos proyectados en captación de depósitos presionan fuertemente los esquemas de cumplimiento de PLA/FT. El cruzamiento exacto por ID único bajo el Escenario A consolida alertas tempranas para contener posibles quiebres transaccionales.

### 🚨 ALERTAS DE SUPERVISIÓN PRIORITARIA
- **BANCO E (Coeficiente: 190):** Entidad con máxima puntuación crítica debido a la coincidencia de un volumen tope de depósitos (40 puntos) con clientes masivos (120 puntos) y el puntaje máximo en Auditoría Interna (30 observaciones/puntos), exigiendo intervención regulatoria inmediata.
- **BANCO M S.A. (Coeficiente: 184):** Alerta crítica derivada de su alta escala de depósitos (40 puntos) y clientes masivos (120 puntos), con fallas severas de control en Auditoría Interna (24 puntos).
- **BANCO T S.R.L (Coeficiente: 134):** Entidad consolidada en Alto Riesgo producto de depósitos de 32 puntos, clientes altos (90 puntos) y deficiencias en Auditoría Interna (12 puntos).

### 💡 HALLAZGOS Y ANOMALÍAS DETECTADAS
- **Anomalía en BANCO C:** BANCO C proyecta depósitos bajos pero registra un elevado descontrol en Auditoría Interna, totalizando 130 puntos, lo cual representa una brecha crítica para actividades ilícitas.
- **Tendencia de Expansión Sistémica:** La tendencia para 2026 indica que la cantidad masiva de clientes y la falta de capacitación de Auditoría Interna en nuevas sucursales continúan siendo los vectores de contagio más graves de la matriz consolidada.

Periodo de supervisión consolidado analizado: 2026`
};

export default function App() {
  // Navigation active tab: matriz, depositos, clientes, auditoria
  const [activeTab, setActiveTab] = useState<"matriz" | "depositos" | "clientes" | "auditoria">("matriz");

  // Selection of Period (Year)
  const [year, setYear] = useState<string>("2025");

  // Calibration Threshold config
  const [thresholds, setThresholds] = useState<ThresholdConfig>(DEFAULT_THRESHOLDS);

  // Dynamic calculated Banks data list
  const [banks, setBanks] = useState<Bank[]>([]);

  // Simulation upload file names
  const [uploadedSaldosName, setUploadedSaldosName] = useState<string>("SALDOS.xlsx");
  const [uploadedClientsName, setUploadedClientsName] = useState<string>("CLIENTES.xlsx");
  const [uploadedAuditName, setUploadedAuditName] = useState<string>("AI.xlsx");

  // Dynamic datasets by year
  const [datasets, setDatasets] = useState<Record<string, BankRawData[]>>(RAW_DATASETS);

  // Selected upload year (2020 to 2045)
  const [uploadYear, setUploadYear] = useState<string>("2025");

  // Temporary raw bank data for the uploadYear inside the modal
  const [tempRawData, setTempRawData] = useState<BankRawData[]>([]);

  // Function to dynamically generate realistic seed-based bank values for custom years
  const generateDatasetForYear = (yearVal: string): BankRawData[] => {
    const seed = parseInt(yearVal) || 2025;
    return [
      {
        id: `banco-m-${yearVal}`,
        code: "13",
        name: "BANCO M S.A.",
        rawDeposits: 10000 + ((seed * 73) % 7) * 1000,
        rawClients: 2000000 + ((seed * 19) % 5) * 600000,
        rawAudit: 2 + ((seed * 3) % 8),
      },
      {
        id: `banco-e-${yearVal}`,
        code: "5",
        name: "BANCO E",
        rawDeposits: 8000 + ((seed * 17) % 6) * 1200,
        rawClients: 1500000 + ((seed * 31) % 4) * 800000,
        rawAudit: 1 + ((seed * 11) % 7),
      },
      {
        id: `banco-t-${yearVal}`,
        code: "20",
        name: "BANCO T S.R.L",
        rawDeposits: 5000 + ((seed * 11) % 5) * 800,
        rawClients: 1000000 + ((seed * 43) % 6) * 700000,
        rawAudit: 1 + ((seed * 2) % 6),
      },
      {
        id: `banco-c-${yearVal}`,
        code: "3",
        name: "BANCO C",
        rawDeposits: 3000 + ((seed * 29) % 7) * 1100,
        rawClients: 1200000 + ((seed * 7) % 5) * 800000,
        rawAudit: 1 + ((seed * 5) % 9),
      },
      {
        id: `banco-s-${yearVal}`,
        code: "19",
        name: "BANCO S Inc.",
        rawDeposits: 2000 + ((seed * 37) % 6) * 900,
        rawClients: 400000 + ((seed * 13) % 4) * 300000,
        rawAudit: 1 + ((seed * 17) % 4),
      }
    ];
  };

  // Synchronize tempRawData inside modal when uploadYear or datasets changes
  useEffect(() => {
    if (datasets[uploadYear]) {
      // Deep copy to prevent mutating datasets state prematurely
      setTempRawData(JSON.parse(JSON.stringify(datasets[uploadYear])));
    } else {
      setTempRawData(generateDatasetForYear(uploadYear));
    }
  }, [uploadYear, datasets]);

  const handleTempRawDataChange = (index: number, field: keyof BankRawData, value: any) => {
    const updated = [...tempRawData];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setTempRawData(updated);
  };

  const handleFixDataForYear = () => {
    const updatedDatasets = {
      ...datasets,
      [uploadYear]: tempRawData
    };
    setDatasets(updatedDatasets);
    
    // Automatically switch active year to uploadYear
    setYear(uploadYear);
    // Directly calculate and set the report for the new state to prevent race conditions
    const preloadedText = PRELOADED_REPORTS[uploadYear];
    let finalReportText = "";
    if (preloadedText) {
      finalReportText = preloadedText;
    } else {
      const computedBanks = tempRawData.map((raw) => computeBankScores(raw, thresholds));
      const sorted = [...computedBanks].sort((a, b) => b.total - a.total);
      const highestBank = sorted[0] || { name: "N/A", total: 0 };
      const secondHighest = sorted[1] || { name: "N/A", total: 0 };
      const highRiskCount = computedBanks.filter(b => b.riskLevel === 'Alto').length;
      const medioRiskCount = computedBanks.filter(b => b.riskLevel === 'Medio').length;
      
      finalReportText = `### 📊 RESUMEN EJECUTIVO DE RIESGO ${uploadYear}
En el período de supervisión ${uploadYear}, el sistema financiero consolidado presenta un perfil de riesgo con ${highRiskCount} entidades en la categoría de **Alto Riesgo** y ${medioRiskCount} en **Medio Riesgo**. La unificación consolidada del Escenario A mediante ID único ha permitido transparentar el monitoreo preventivo y neutralizar las asimetrías de reporte en la determinación de la Matriz de Riesgo.

### 🚨 ALERTAS DE SUPERVISIÓN PRIORITARIA
- **${highestBank.name} (Coeficiente: ${highestBank.total}):** Registra el mayor nivel de exposición sistémica del periodo. Presenta factores críticos que exigen el diseño de planes de contingencia urgentes de remediación de controles de prevención de lavado de activos y financiamiento del terrorismo (PLA/FT).
- **${secondHighest.name} (Coeficiente: ${secondHighest.total}):** Entidad con alta exposición debido a la descompensación en sus coeficientes de riesgo, posicionándose en alerta de monitoreo prioritario.

### 💡 HALLAZGOS Y ANOMALÍAS DETECTADAS
- **Evolución de Riesgo Operativo en ${uploadYear}:** Se detectan desviaciones transaccionales en la relación de clientes y volumen de depósitos frente a la madurez de la estructura de auditoría interna de las entidades principales.
- **Trazabilidad mediante ID Único:** El cruzamiento exacto de datos consolidados resulta vital para mantener la consistencia del sistema de prevención del riesgo de lavado de activos de este periodo.

Periodo de supervisión consolidado analizado: ${uploadYear}`;
    }
    
    setReport(finalReportText);

    // Sync to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      const rows = tempRawData.map((b) => ({
        year: uploadYear,
        bank_id: b.id,
        code: b.code,
        name: b.name,
        raw_deposits: b.rawDeposits,
        raw_clients: b.rawClients,
        raw_audit: b.rawAudit,
      }));

      supabase
        .from("risk_datasets")
        .upsert(rows)
        .then(({ error: dErr }) => {
          if (dErr) {
            console.error("Error saving datasets to Supabase:", dErr);
            showNotification("Fijado en memoria local. Error al sincronizar con Supabase.", "info");
          } else {
            supabase
              .from("risk_reports")
              .upsert({
                year: uploadYear,
                report_text: finalReportText,
                updated_at: new Date().toISOString()
              })
              .then(({ error: rErr }) => {
                if (rErr) {
                  console.error("Error saving report to Supabase:", rErr);
                  showNotification("Datos guardados. Reporte ejecutivo falló al sincronizar con Supabase.", "info");
                } else {
                  showNotification(`Periodo ${uploadYear} fijado y sincronizado con Supabase con éxito.`, "success");
                }
              });
          }
        });
    } else {
      showNotification(`Datos consolidados y fijados para el periodo ${uploadYear} con éxito en memoria local.`, "success");
    }
    
    setIsUploadModalOpen(false);
  };

  // Sector loading statuses
  const [sector1Status, setSector1Status] = useState<"loaded" | "processing">("loaded");
  const [sector2Status, setSector2Status] = useState<"loaded" | "processing">("loaded");
  const [sector3Status, setSector3Status] = useState<"loaded" | "processing">("loaded");

  // Modal open status for file uploading
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  // Notifications
  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // Executive Report text
  const [report, setReport] = useState<string>(PRELOADED_REPORTS["2025"]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  // Interactive local states for current calibration controls (bound to active editing inputs)
  const [localThresholds, setLocalThresholds] = useState<ThresholdConfig>(DEFAULT_THRESHOLDS);

  // Connection status with Supabase: green (true) if configured and connected, false if not configured
  const [isSupabaseOk, setIsSupabaseOk] = useState<boolean>(isSupabaseConfigured);

  // Sync with Supabase on mount (Load Thresholds, Datasets, Reports)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    const fetchSupabaseData = async () => {
      try {
        // Fetch calibration thresholds
        const { data: tData, error: tErr } = await supabase
          .from("risk_thresholds")
          .select("data")
          .eq("id", "default")
          .maybeSingle();

        if (!tErr && tData?.data) {
          setThresholds(tData.data as ThresholdConfig);
          showNotification("Configuración de ponderadores cargada desde Supabase.", "info");
        }

        // Fetch custom datasets
        const { data: dbDatasets, error: dErr } = await supabase
          .from("risk_datasets")
          .select("*");

        if (!dErr && dbDatasets && dbDatasets.length > 0) {
          const reconstructed: Record<string, BankRawData[]> = {};
          dbDatasets.forEach((row: any) => {
            if (!reconstructed[row.year]) {
              reconstructed[row.year] = [];
            }
            reconstructed[row.year].push({
              id: row.bank_id,
              code: row.code,
              name: row.name,
              rawDeposits: Number(row.raw_deposits),
              rawClients: Number(row.raw_clients),
              rawAudit: Number(row.raw_audit),
            });
          });
          setDatasets((prev) => ({ ...prev, ...reconstructed }));
          showNotification("Datos históricos consolidados cargados desde Supabase.", "info");
        }

        // Fetch reports
        const { data: dbReports, error: rErr } = await supabase
          .from("risk_reports")
          .select("*");

        if (!rErr && dbReports && dbReports.length > 0) {
          // Find if we have custom report for current active year
          const activeReport = dbReports.find((r: any) => r.year === year);
          if (activeReport) {
            setReport(activeReport.report_text);
          }
        }

        setIsSupabaseOk(true);
      } catch (err) {
        console.error("Error al conectar con Supabase:", err);
        setIsSupabaseOk(false);
      }
    };

    fetchSupabaseData();
  }, []);

  // Cargar datos de Supabase cuando cambia el año
  useEffect(() => {
    const loadYearFromSupabase = async () => {
      if (!isSupabaseConfigured || !supabase) {
        return; // Sin Supabase, usar datos locales
      }

      const supabaseData = await loadRiskDatasetsByYear(year);
      
      if (supabaseData && supabaseData.length > 0) {
        // Convertir datos de Supabase a formato BankRawData
        const converted: BankRawData[] = supabaseData.map((row) => ({
          id: `banco-${row.bank_id}-${year}`,
          code: String(row.bank_id),
          name: `BANCO ${String(row.bank_id)}`, // fallback, mejor si viene del lookup
          rawDeposits: row.raw_deposits,
          rawClients: row.raw_clients,
          rawAudit: row.raw_audit,
        }));

        // Actualizar datasets con datos de Supabase
        setDatasets((prev) => ({
          ...prev,
          [year]: converted,
        }));
        console.log(`✅ Datos del año ${year} cargados de Supabase`);
      } else {
        // Fallback a RAW_DATASETS si Supabase no tiene datos
        console.log(`⚠️ Supabase no tiene datos para ${year}, usando datos locales`);
      }
    };

    loadYearFromSupabase();
  }, [year]); // Ejecutar cuando cambia el año

  // On first load or whenever year/thresholds/datasets change, compute banks list and sync to Supabase
  useEffect(() => {
    const rawList = datasets[year] || datasets["2025"];
    const computed = rawList.map((raw) => computeBankScores(raw, thresholds));
    setBanks(computed);

    // Persist risk_calculations to Supabase if configured
    if (isSupabaseConfigured) {
      const calcData = computed.map((bank) => ({
        bank_id: parseInt(bank.code, 10),
        deposits: bank.deposits,
        clients: bank.clients,
        audit: bank.audit,
        total: bank.total,
        risk_level: bank.riskLevel,
      }));
      saveRiskCalculations(year, calcData);
    }
  }, [year, thresholds, datasets]);

  // Sync edit local thresholds when state is reset or loaded
  useEffect(() => {
    setLocalThresholds(thresholds);
  }, [thresholds]);

  // Trigger helper notification
  const showNotification = (message: string, type: "success" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const getPreloadedReportForYear = (selectedYear: string) => {
    if (PRELOADED_REPORTS[selectedYear]) {
      return PRELOADED_REPORTS[selectedYear];
    }
    
    const rawList = datasets[selectedYear] || datasets["2025"];
    const computedBanks = rawList.map((raw) => computeBankScores(raw, thresholds));
    
    // Sort banks by total risk descending to identify high risk
    const sorted = [...computedBanks].sort((a, b) => b.total - a.total);
    const highestBank = sorted[0] || { name: "N/A", total: 0 };
    const secondHighest = sorted[1] || { name: "N/A", total: 0 };
    
    const highRiskCount = computedBanks.filter(b => b.riskLevel === 'Alto').length;
    const medioRiskCount = computedBanks.filter(b => b.riskLevel === 'Medio').length;
    
    return `### 📊 RESUMEN EJECUTIVO DE RIESGO ${selectedYear}
En el período de supervisión ${selectedYear}, el sistema financiero consolidado presenta un perfil de riesgo con ${highRiskCount} entidades en la categoría de **Alto Riesgo** y ${medioRiskCount} en **Medio Riesgo**. La unificación consolidada del Escenario A mediante ID único ha permitido transparentar el monitoreo preventivo y neutralizar las asimetrías de reporte en la determinación de la Matriz de Riesgo.

### 🚨 ALERTAS DE SUPERVISIÓN PRIORITARIA
- **${highestBank.name} (Coeficiente: ${highestBank.total}):** Registra el mayor nivel de exposición sistémica del periodo. Presenta factores críticos que exigen el diseño de planes de contingencia urgentes de remediación de controles de prevención de lavado de activos y financiamiento del terrorismo (PLA/FT).
- **${secondHighest.name} (Coeficiente: ${secondHighest.total}):** Entidad con alta exposición debido a la descompensación en sus coeficientes de riesgo, posicionándose en alerta de monitoreo prioritario.

### 💡 HALLAZGOS Y ANOMALÍAS DETECTADAS
- **Evolución de Riesgo Operativo en ${selectedYear}:** Se detectan desviaciones transaccionales en la relación de clientes y volumen de depósitos frente a la madurez de la estructura de auditoría interna de las entidades principales.
- **Trazabilidad mediante ID Único:** El cruzamiento exacto de datos consolidados resulta vital para mantener la consistencia del sistema de prevención del riesgo de lavado de activos de este periodo.

Periodo de supervisión consolidado analizado: ${selectedYear}`;
  };

  // Change period handler
  const handlePeriodChange = (selectedYear: string) => {
    setYear(selectedYear);
    // Automatically switch the preloaded report corresponding to that year
    setReport(getPreloadedReportForYear(selectedYear));
    showNotification(`Período de supervisión cambiado al año ${selectedYear}.`);
  };

  // Call the backend Gemini API to regenerate report with custom rules
  const handleRegenerateReport = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banks, year, thresholds }),
      });

      if (!response.ok) {
        throw new Error("Error de conexión con el motor cognitivo de riesgo.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const reportText = data.report || "No se pudo recuperar un análisis consolidado válido.";
      setReport(reportText);
      
      // Persist report to Supabase if configured
      if (isSupabaseConfigured && data.report) {
        await saveRiskReport(year, reportText, "gemini-ai");
      }
      
      showNotification("Reporte ejecutivo recalculado con éxito utilizando Gemini AI.", "success");
    } catch (err: any) {
      console.error(err);
      showNotification("Error de conexión. Se conservó el análisis consolidado local.", "info");
    } finally {
      setIsGenerating(false);
    }
  };

  // Export Matrix and detailed Coefficients to beautiful Multi-tab Excel file (.xlsx) with professional coloring and layout
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const rawList = datasets[year] || [];

      // Styles applied to specific sections
      const applyStylesToSheet = (ws: any, type: 'dashboard' | 'matrix' | 'details') => {
        if (!ws) return;
        
        const fontDefault = { name: "Segoe UI", sz: 10, color: { rgb: "334155" } };
        const fontHeader = { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "FFFFFF" } };
        const fontTitle = { name: "Segoe UI", sz: 13, bold: true, color: { rgb: "1E3A8A" } }; // Deep corporate Blue
        const fontSection = { name: "Segoe UI", sz: 11, bold: true, color: { rgb: "1E3A8A" } }; // Corporate Blue
        
        const fillHeader = { fgColor: { rgb: "1E293B" } }; // Slate 800 - elegant dark headers with white text
        const fillTitle = { fgColor: { rgb: "EFF6FF" } }; // Blue 50 - light blue banner
        const fillSection = { fgColor: { rgb: "F1F5F9" } }; // Slate 100 - soft gray section backgrounds
        const fillAlternating = { fgColor: { rgb: "F8FAFC" } }; // Slate 50 - extremely soft alternating rows
        
        const borderThin = {
          top: { style: "thin", color: { rgb: "E2E8F0" } },
          bottom: { style: "thin", color: { rgb: "E2E8F0" } },
          left: { style: "thin", color: { rgb: "E2E8F0" } },
          right: { style: "thin", color: { rgb: "E2E8F0" } }
        };
        
        for (const cellId in ws) {
          if (cellId.startsWith("!")) continue;
          const cell = ws[cellId];
          if (!cell) continue;
          
          const parsed = XLSX.utils.decode_cell(cellId);
          const r = parsed.r;
          const c = parsed.c;
          
          // Default cell styling
          cell.s = {
            font: { ...fontDefault },
            alignment: { vertical: "center", horizontal: "left" },
            border: { ...borderThin }
          };
          
          if (type === 'dashboard') {
            if (r === 0) {
              // Title banner
              cell.s.font = { ...fontTitle };
              cell.s.fill = { ...fillTitle };
              cell.s.alignment = { horizontal: "center", vertical: "center" };
              cell.s.border = {
                bottom: { style: "medium", color: { rgb: "93C5FD" } }
              };
            } else if (r === 1 || r === 2) {
              // Metadata fields
              cell.s.fill = { fgColor: { rgb: "F8FAFC" } };
              cell.s.font.color = { rgb: "475569" };
              cell.s.font.italic = true;
              if (c === 0 || c === 2) {
                cell.s.font.bold = true;
                cell.s.font.color = { rgb: "1E293B" };
              }
            } else if (r === 4 || r === 11 || r === 17 || r === 22) {
              // Section headers
              cell.s.font = { ...fontSection };
              cell.s.fill = { ...fillSection };
              cell.s.border = {
                top: { style: "medium", color: { rgb: "CBD5E1" } },
                bottom: { style: "medium", color: { rgb: "CBD5E1" } }
              };
            } else if (r === 5 || r === 12 || r === 18) {
              // Table header columns
              cell.s.font = { ...fontHeader };
              cell.s.fill = { ...fillHeader };
              cell.s.alignment = { horizontal: "center", vertical: "center" };
            } else if (r >= 6 && r <= 9) {
              // KPIs Rows
              if (c === 0) {
                cell.s.font.bold = true;
                cell.s.font.color = { rgb: "0F172A" };
              } else if (c === 1) {
                cell.s.font.bold = true;
                cell.s.alignment = { horizontal: "center" };
                if (r === 7 && Number(cell.v) > 0) {
                  cell.s.fill = { fgColor: { rgb: "FEE2E2" } };
                  cell.s.font.color = { rgb: "991B1B" };
                } else if (r === 8 && Number(cell.v) > 0) {
                  cell.s.fill = { fgColor: { rgb: "FEF3C7" } };
                  cell.s.font.color = { rgb: "92400E" };
                } else if (r === 9) {
                  cell.s.fill = { fgColor: { rgb: "D1FAE5" } };
                  cell.s.font.color = { rgb: "065F46" };
                }
              } else if (c === 2) {
                cell.s.font.bold = true;
                cell.s.alignment = { horizontal: "center" };
                if (r === 7 && String(cell.v).includes("🔴")) {
                  cell.s.font.color = { rgb: "DC2626" };
                  cell.s.fill = { fgColor: { rgb: "FEF2F2" } };
                } else if (r === 8 && String(cell.v).includes("🟡")) {
                  cell.s.font.color = { rgb: "D97706" };
                  cell.s.fill = { fgColor: { rgb: "FFFBEB" } };
                } else {
                  cell.s.font.color = { rgb: "059669" };
                  cell.s.fill = { fgColor: { rgb: "F0FDF4" } };
                }
              }
            } else if (r >= 13 && r <= 15) {
              // Histogram Rows
              if (c === 0) {
                cell.s.font.bold = true;
                if (r === 13) {
                  cell.s.font.color = { rgb: "B91C1C" };
                  cell.s.fill = { fgColor: { rgb: "FEF2F2" } };
                } else if (r === 14) {
                  cell.s.font.color = { rgb: "B45309" };
                  cell.s.fill = { fgColor: { rgb: "FFFBEB" } };
                } else {
                  cell.s.font.color = { rgb: "047857" };
                  cell.s.fill = { fgColor: { rgb: "F0FDF4" } };
                }
              } else if (c === 1 || c === 2) {
                cell.s.alignment = { horizontal: "center" };
              } else if (c === 3) {
                cell.s.font.name = "Segoe UI";
                cell.s.font.bold = true;
                cell.s.alignment = { horizontal: "center" };
                if (r === 13) cell.s.font.color = { rgb: "EF4444" };
                if (r === 14) cell.s.font.color = { rgb: "F59E0B" };
                if (r === 15) cell.s.font.color = { rgb: "10B981" };
              }
            } else if (r >= 19 && r <= 20) {
              // Priorities Rows
              if (c === 0) {
                cell.s.font.bold = true;
                cell.s.alignment = { horizontal: "center" };
                if (r === 19) {
                  cell.s.fill = { fgColor: { rgb: "FEE2E2" } };
                  cell.s.font.color = { rgb: "B91C1C" };
                } else {
                  cell.s.fill = { fgColor: { rgb: "FEF3C7" } };
                  cell.s.font.color = { rgb: "D97706" };
                }
              } else if (c === 1) {
                cell.s.font.bold = true;
                cell.s.font.color = { rgb: "0F172A" };
              } else if (c === 2) {
                cell.s.font.bold = true;
                cell.s.alignment = { horizontal: "center" };
                cell.s.font.color = { rgb: "B91C1C" };
                cell.s.fill = { fgColor: { rgb: "FEF2F2" } };
              }
            } else if (r >= 23) {
              // Methodology Description rows
              if (c === 0) {
                cell.s.font.bold = true;
                cell.s.font.color = { rgb: "1E293B" };
              }
            }
          } else if (type === 'matrix') {
            if (r === 0) {
              // Title row
              cell.s.font = { ...fontTitle };
              cell.s.fill = { ...fillTitle };
              cell.s.alignment = { horizontal: "center", vertical: "center" };
              cell.s.border = {
                bottom: { style: "medium", color: { rgb: "93C5FD" } }
              };
            } else if (r === 1) {
              // Subtitle/metadata
              cell.s.fill = { fgColor: { rgb: "F8FAFC" } };
              cell.s.font.color = { rgb: "64748B" };
              cell.s.font.italic = true;
              cell.s.alignment = { horizontal: "center" };
            } else if (r === 3) {
              // Table header columns
              cell.s.font = { ...fontHeader };
              cell.s.fill = { ...fillHeader };
              cell.s.alignment = { horizontal: "center", vertical: "center", wrapText: true };
            } else if (r >= 4) {
              if (r % 2 === 1) {
                cell.s.fill = { ...fillAlternating };
              }
              if (c === 0) {
                cell.s.alignment = { horizontal: "center" };
                cell.s.font.color = { rgb: "64748B" };
                cell.s.font.bold = true;
              } else if (c === 1) {
                cell.s.font.bold = true;
                cell.s.font.color = { rgb: "0F172A" };
              } else if (c >= 2 && c <= 5) {
                cell.s.alignment = { horizontal: "center" };
                if (c === 5) {
                  cell.s.font.bold = true;
                  const valNum = parseFloat(cell.v);
                  if (valNum >= 130) {
                    cell.s.font.color = { rgb: "B91C1C" };
                    cell.s.fill = { fgColor: { rgb: "FEE2E2" } };
                  } else if (valNum >= 90) {
                    cell.s.font.color = { rgb: "B45309" };
                    cell.s.fill = { fgColor: { rgb: "FEF3C7" } };
                  } else {
                    cell.s.font.color = { rgb: "047857" };
                    cell.s.fill = { fgColor: { rgb: "D1FAE5" } };
                  }
                }
              } else if (c === 6) {
                cell.s.alignment = { horizontal: "center" };
                cell.s.font.bold = true;
                // Soft elegant badges matching application colors
                if (String(cell.v).includes("ALTO")) {
                  cell.s.fill = { fgColor: { rgb: "FEE2E2" } };
                  cell.s.font.color = { rgb: "B91C1C" };
                } else if (String(cell.v).includes("MEDIO")) {
                  cell.s.fill = { fgColor: { rgb: "FEF3C7" } };
                  cell.s.font.color = { rgb: "B45309" };
                } else if (String(cell.v).includes("BAJO")) {
                  cell.s.fill = { fgColor: { rgb: "D1FAE5" } };
                  cell.s.font.color = { rgb: "047857" };
                }
              }
            }
          } else if (type === 'details') {
            if (r === 0) {
              // Title row
              cell.s.font = { ...fontTitle };
              cell.s.fill = { ...fillTitle };
              cell.s.alignment = { horizontal: "center", vertical: "center" };
              cell.s.border = {
                bottom: { style: "medium", color: { rgb: "93C5FD" } }
              };
            } else if (r === 1) {
              // Subtitle
              cell.s.fill = { fgColor: { rgb: "F8FAFC" } };
              cell.s.font.color = { rgb: "64748B" };
              cell.s.font.italic = true;
              cell.s.alignment = { horizontal: "center" };
            } else if (r === 3) {
              // Table header columns (Details)
              cell.s.font = { ...fontHeader };
              cell.s.fill = { fgColor: { rgb: "475569" } }; // Slate 600
              cell.s.alignment = { horizontal: "center", vertical: "center" };
            } else if (r >= 4) {
              if (r % 2 === 1) {
                cell.s.fill = { ...fillAlternating };
              }
              if (c === 0) {
                cell.s.alignment = { horizontal: "center" };
                cell.s.font.color = { rgb: "64748B" };
                cell.s.font.bold = true;
              } else if (c === 1) {
                cell.s.font.bold = true;
                cell.s.font.color = { rgb: "0F172A" };
              } else if (c === 2) {
                cell.s.alignment = { horizontal: "center" };
              } else if (c === 3) {
                cell.s.alignment = { horizontal: "center" };
                cell.s.font.bold = true;
                cell.s.fill = { fgColor: { rgb: "EFF6FF" } }; // Soft blue highlight for score obtained
                cell.s.font.color = { rgb: "1D4ED8" };
              } else if (c === 4) {
                cell.s.alignment = { horizontal: "center" };
                cell.s.font.bold = true;
                cell.s.font.color = { rgb: "1D4ED8" };
              }
            }
          }
        }
      };

      // 1. Sheet 1: 📊 DASHBOARD Y RESUMEN
      const highCount = banks.filter(b => b.riskLevel === "Alto").length;
      const medioCount = banks.filter(b => b.riskLevel === "Medio").length;
      const bajoCount = banks.filter(b => b.riskLevel === "Bajo").length;
      const totalBanks = banks.length;

      const sorted = [...banks].sort((a, b) => b.total - a.total);
      const highestBank = sorted[0] || { name: "N/A", total: 0, riskLevel: "N/A" };
      const secondHighest = sorted[1] || { name: "N/A", total: 0, riskLevel: "N/A" };

      const dashboardData = [
        ["📊 DASHBOARD EJECUTIVO DE SUPERVISIÓN Y RIESGO CONSOLIDADO (PERIODO " + year + ")"],
        ["Fecha de Generación:", new Date().toLocaleDateString(), "Analista Responsable:", "Dirección de Prevención (PLA/FT)"],
        ["Normativa Aplicada:", "Reglas de Clasificación Coef. Total", "Estado de la Base:", "Consolidado Integrado (Escenario A)"],
        [], // Empty Spacer
        ["1. INDICADORES CLAVE DEL SISTEMA FINANCIERO (KPIs)"],
        ["Métrica de Supervisión", "Resultado", "Umbral / Estado", "Significado Operativo"],
        ["Total Entidades Monitoreadas", totalBanks, "100% de la muestra", "Alcance total consolidado"],
        ["Entidades en RIESGO CRÍTICO (Alto)", highCount, highCount > 0 ? "🔴 REQUIERE ACCIÓN URGENTE" : "🟢 CONTROLADO", "Coeficiente Total >= 130 puntos"],
        ["Entidades en RIESGO MODERADO (Medio)", medioCount, medioCount > 0 ? "🟡 MONITOREO PREVENTIVO" : "🟢 ESTABLE", "Coeficiente Total entre 90 y 129 puntos"],
        ["Entidades en RIESGO CONTROLADO (Bajo)", bajoCount, "🟢 ESTABLE Y SALUDABLE", "Coeficiente Total < 90 puntos"],
        [],
        ["2. DISTRIBUCIÓN DEL RIESGO EN EL SISTEMA (HISTOGRAMA DE FRECUENCIA)"],
        ["Nivel de Riesgo", "Frecuencia Absoluta", "Frecuencia Relativa (%)", "Representación Gráfica (Entidades)"],
        ["🔴 ALTO", highCount, ((highCount / totalBanks) * 100).toFixed(1) + "%", "●".repeat(highCount) + "○".repeat(Math.max(0, 10 - highCount))],
        ["🟡 MEDIO", medioCount, ((medioCount / totalBanks) * 100).toFixed(1) + "%", "●".repeat(medioCount) + "○".repeat(Math.max(0, 10 - medioCount))],
        ["🟢 BAJO", bajoCount, ((bajoCount / totalBanks) * 100).toFixed(1) + "%", "●".repeat(bajoCount) + "○".repeat(Math.max(0, 10 - bajoCount))],
        [],
        ["3. ALERTAS CRÍTICAS DE SUPERVISIÓN PRIORITARIA DE ESTE PERIODO"],
        ["Nivel", "Entidad Financiera", "Coeficiente Total", "Factor de Exposición Principal"],
        [
          "🚨 PRIORIDAD 1", 
          highestBank.name, 
          highestBank.total + " pts", 
          "Mayor exposición sistémica. Coeficiente en rango " + (highestBank.riskLevel === "Alto" ? "CRÍTICO (Alto)" : "MEDIO") + "."
        ],
        [
          "🚨 PRIORIDAD 2", 
          secondHighest.name, 
          secondHighest.total + " pts", 
          "Segundo nivel de atención prioritaria. Vigilancia especial de prevención de lavado de activos."
        ],
        [],
        ["4. HALLAZGOS METODOLÓGICOS Y CONTROL INTERNO"],
        ["• Coeficiente de Depósitos:", "Evalúa volumen de fondos. Pondera el potencial riesgo de colocaciones (Máx. 40 puntos)."],
        ["• Coeficiente de Clientes:", "Mide la base transaccional de usuarios activos (Máx. 120 puntos)."],
        ["• Coeficiente de Auditoría:", "Mide falencias, hallazgos y alertas reportadas por auditoría interna (Máx. 30 puntos)."]
      ];

      const wsDash = XLSX.utils.aoa_to_sheet(dashboardData);
      wsDash["!cols"] = [
        { wch: 35 }, // Col 1
        { wch: 30 }, // Col 2
        { wch: 30 }, // Col 3
        { wch: 55 }  // Col 4
      ];
      wsDash["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
        { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } },
        { s: { r: 11, c: 0 }, e: { r: 11, c: 3 } },
        { s: { r: 17, c: 0 }, e: { r: 17, c: 3 } },
        { s: { r: 22, c: 0 }, e: { r: 22, c: 3 } }
      ];
      applyStylesToSheet(wsDash, 'dashboard');
      XLSX.utils.book_append_sheet(wb, wsDash, "📊 Dashboard Ejecutivo");

      // 2. Sheet 2: 📋 MATRIZ DE RIESGO
      const sheet1Data = [
        ["📋 REPORTE DE SUPERVISIÓN CONSOLIDADA - MATRIZ DE RIESGO (" + year + ")"],
        ["Fecha de Emisión: " + new Date().toLocaleDateString() + "  |  Base de Datos: Consolidada Escenario A  |  Riesgo Crítico >= 130 pts"],
        [], // Empty Spacer
        [
          "ID Único", 
          "Entidad Financiera", 
          "Coef. Volumen\nde Depósitos", 
          "Coef. Cantidad\nde Clientes", 
          "Coef. Auditoría\nInterna", 
          "Coeficiente\nTotal", 
          "Clasificación de Riesgo"
        ]
      ];

      // Sort by total descending as seen in the app
      sorted.forEach((b) => {
        const formattedRisk = b.riskLevel === "Alto" 
          ? "🔴 ALTO" 
          : b.riskLevel === "Medio" 
            ? "🟡 MEDIO" 
            : "🟢 BAJO";

        sheet1Data.push([
          b.code,
          b.name,
          b.deposits,
          b.clients,
          b.audit,
          b.total,
          formattedRisk
        ]);
      });

      const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
      ws1["!cols"] = [
        { wch: 12 }, // ID Único
        { wch: 30 }, // Entidad Financiera
        { wch: 20 }, // Coef. Volumen de Depósitos
        { wch: 20 }, // Coef. Cantidad de Clientes
        { wch: 20 }, // Coef. Auditoría Interna
        { wch: 16 }, // Coeficiente Total
        { wch: 24 }  // Nivel de Riesgo
      ];
      ws1["!rows"] = [
        { hpt: 24 }, // Title
        { hpt: 18 }, // Subtitle
        { hpt: 10 }, // Spacer
        { hpt: 35 }  // Tall Header Row to allow wrap text over two lines
      ];
      ws1["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }
      ];
      applyStylesToSheet(ws1, 'matrix');
      XLSX.utils.book_append_sheet(wb, ws1, "📋 Matriz de Riesgo");

      // 3. Sheet 3: 💸 COEFICIENTE DEPÓSITOS
      const sheet2Data = [
        ["💸 CÁLCULO DETALLADO - COEFICIENTE DE VOLUMEN DE DEPÓSITOS (" + year + ")"],
        ["Criterio de Evaluación: Conversión de depósitos totales reportados a la puntuación de riesgo.  |  Máximo Absoluto: 40 puntos"],
        [],
        ["ID Único", "Entidad Financiera", "Volumen de Depósitos (M$)", "Puntaje de Riesgo", "Puntaje %"]
      ];

      sorted.forEach((b) => {
        const raw = rawList.find(r => r.code === b.code);
        sheet2Data.push([
          b.code,
          b.name,
          raw ? raw.rawDeposits : 0,
          b.deposits,
          Math.round((b.deposits / 40) * 100) + "%"
        ]);
      });

      const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
      ws2["!cols"] = [
        { wch: 12 },
        { wch: 30 },
        { wch: 28 },
        { wch: 22 },
        { wch: 16 }
      ];
      ws2["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }
      ];
      applyStylesToSheet(ws2, 'details');
      XLSX.utils.book_append_sheet(wb, ws2, "💸 Volumen de Depósitos");

      // 4. Sheet 4: 👥 COEFICIENTE CLIENTES
      const sheet3Data = [
        ["👥 CÁLCULO DETALLADO - COEFICIENTE DE CANTIDAD DE CLIENTES (" + year + ")"],
        ["Criterio de Evaluación: Conversión de cantidad de clientes registrados a la puntuación de riesgo.  |  Máximo Absoluto: 120 puntos"],
        [],
        ["ID Único", "Entidad Financiera", "Cantidad de Clientes", "Puntaje de Riesgo", "Puntaje %"]
      ];

      sorted.forEach((b) => {
        const raw = rawList.find(r => r.code === b.code);
        sheet3Data.push([
          b.code,
          b.name,
          raw ? raw.rawClients : 0,
          b.clients,
          Math.round((b.clients / 120) * 100) + "%"
        ]);
      });

      const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
      ws3["!cols"] = [
        { wch: 12 },
        { wch: 30 },
        { wch: 28 },
        { wch: 22 },
        { wch: 16 }
      ];
      ws3["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }
      ];
      applyStylesToSheet(ws3, 'details');
      XLSX.utils.book_append_sheet(wb, ws3, "👥 Cantidad de Clientes");

      // 5. Sheet 5: 🔍 COEFICIENTE AUDITORÍA
      const sheet4Data = [
        ["🔍 CÁLCULO DETALLADO - COEFICIENTE DE OBSERVACIONES DE AUDITORÍA (" + year + ")"],
        ["Criterio de Evaluación: Conversión de observaciones de auditoría interna a puntuación de riesgo.  |  Máximo Absoluto: 30 puntos"],
        [],
        ["ID Único", "Entidad Financiera", "Cantidad de Observaciones", "Puntaje de Riesgo", "Puntaje %"]
      ];

      sorted.forEach((b) => {
        const raw = rawList.find(r => r.code === b.code);
        sheet4Data.push([
          b.code,
          b.name,
          raw ? raw.rawAudit : 0,
          b.audit,
          Math.round((b.audit / 30) * 100) + "%"
        ]);
      });

      const ws4 = XLSX.utils.aoa_to_sheet(sheet4Data);
      ws4["!cols"] = [
        { wch: 12 },
        { wch: 30 },
        { wch: 28 },
        { wch: 22 },
        { wch: 16 }
      ];
      ws4["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }
      ];
      applyStylesToSheet(ws4, 'details');
      XLSX.utils.book_append_sheet(wb, ws4, "🔍 Auditoría Interna");

      // Write the workbook and trigger download
      XLSX.writeFile(wb, `Matriz_Riesgo_Consolidada_Formal_${year}.xlsx`);
      showNotification("Matriz, Dashboard y Coeficientes exportados con éxito en un libro formal Excel (.xlsx) de alta gama con múltiples solapas.");
    } catch (err) {
      console.error(err);
      showNotification("Error al intentar exportar a Excel formal.", "info");
    }
  };

  // Download Report as printable HTML
  const handleDownloadReportHTML = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Supervisión de Riesgo Consolidado - Periodo ${year}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; background-color: #f9fafb; }
          .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
          h1 { font-size: 24px; color: #111827; margin: 0 0 5px 0; }
          .meta { font-size: 13px; color: #6b7280; font-family: monospace; }
          h3 { font-size: 18px; color: #dc2626; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px; margin-top: 30px; }
          p { font-size: 14px; color: #374151; }
          li { font-size: 14px; color: #374151; margin-bottom: 10px; }
          ul { padding-left: 20px; }
          .badge { background-color: #fef2f2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INFORME DE SUPERVISIÓN DE RIESGO FINANCIERO / PLA-FT</h1>
          <div class="meta">PERIODO: ${year} | ESCENARIO A (ID ÚNICO CONSOLIDADO) | EMITIDO: ${new Date().toLocaleDateString()}</div>
        </div>
        <div>
          ${report
            .replace(/###\s*(.*)/g, "<h3>$1</h3>")
            .replace(/\n-\s*\*\*(.*?)\*\*:\s*(.*)/g, "<li><strong>$1:</strong> $2</li>")
            .replace(/-\s*(.*)/g, "<li>$1</li>")
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .split("\n\n")
            .map(p => p.trim().startsWith("<h") || p.trim().startsWith("<li") ? p : `<p>${p}</p>`)
            .join("\n")}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Reporte_Ejecutivo_Supervision_${year}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("Reporte Ejecutivo descargado con éxito en formato HTML.");
  };

  // Copy report to clipboard
  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
    showNotification("Reporte copiado al portapapeles.");
  };

  // Reset file simulated loads
  const handleResetSector = (sectorNum: 1 | 2 | 3) => {
    if (sectorNum === 1) {
      setSector1Status("processing");
      setTimeout(() => {
        setUploadedSaldosName("SALDOS.xlsx");
        setSector1Status("loaded");
        showNotification("Sector de Depósitos restablecido.");
      }, 600);
    } else if (sectorNum === 2) {
      setSector2Status("processing");
      setTimeout(() => {
        setUploadedClientsName("CLIENTES.xlsx");
        setSector2Status("loaded");
        showNotification("Sector de Clientes restablecido.");
      }, 600);
    } else if (sectorNum === 3) {
      setSector3Status("processing");
      setTimeout(() => {
        setUploadedAuditName("AI.xlsx");
        setSector3Status("loaded");
        showNotification("Sector de Auditoría Interna restablecido.");
      }, 600);
    }
  };

  // Trigger simulated file loaders
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, sectorNum: 1 | 2 | 3) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (sectorNum === 1) {
      setUploadedSaldosName(file.name);
      setSector1Status("processing");
      setTimeout(() => {
        setSector1Status("loaded");
        showNotification(`Archivo '${file.name}' mapeado en Depósitos por ID Único.`);
      }, 800);
    } else if (sectorNum === 2) {
      setUploadedClientsName(file.name);
      setSector2Status("processing");
      setTimeout(() => {
        setSector2Status("loaded");
        showNotification(`Archivo '${file.name}' mapeado en Clientes por ID Único.`);
      }, 800);
    } else if (sectorNum === 3) {
      setUploadedAuditName(file.name);
      setSector3Status("processing");
      setTimeout(() => {
        setSector3Status("loaded");
        showNotification(`Archivo '${file.name}' mapeado en Auditoría Interna por ID Único.`);
      }, 800);
    }
  };

  // Calibrate & Apply thresholds changes
  const applyCalibrationChanges = () => {
    setThresholds(localThresholds);
    if (isSupabaseConfigured && supabase) {
      supabase
        .from("risk_thresholds")
        .upsert({ id: "default", data: localThresholds })
        .then(({ error }) => {
          if (error) console.error("Error saving thresholds to Supabase:", error);
        });
    }
    showNotification("Calibración de ponderadores de riesgo actualizada. La matriz se recalculó inmediatamente.", "success");
  };

  // Reset thresholds to preloaded defaults
  const resetThresholdsToDefaults = () => {
    setThresholds(DEFAULT_THRESHOLDS);
    setLocalThresholds(DEFAULT_THRESHOLDS);
    if (isSupabaseConfigured && supabase) {
      supabase
        .from("risk_thresholds")
        .upsert({ id: "default", data: DEFAULT_THRESHOLDS })
        .then(({ error }) => {
          if (error) console.error("Error resetting thresholds in Supabase:", error);
        });
    }
    showNotification("Valores de ponderadores restablecidos a la configuración base.", "info");
  };

  // Formatted markdown reports parsing to DOM
  const renderFormattedReport = (text: string) => {
    if (!text) return null;
    const items = text.split("\n");
    return items.map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("###")) {
        const title = trimmed.replace(/^###\s*/, "");
        return (
          <h3 key={i} className="font-display text-base md:text-lg font-bold text-slate-900 border-l-4 border-red-600 pl-3 mt-6 mb-3 flex items-center gap-2">
            {title}
          </h3>
        );
      }
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const content = trimmed.replace(/^[-*]\s*/, "");
        return (
          <li key={i} className="ml-5 list-disc text-sm text-slate-700 leading-relaxed mb-3">
            {parseMarkdownBold(content)}
          </li>
        );
      }
      if (trimmed) {
        return (
          <p key={i} className="text-sm md:text-base text-slate-600 leading-relaxed mb-4">
            {parseMarkdownBold(trimmed)}
          </p>
        );
      }
      return null;
    });
  };

  const parseMarkdownBold = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-bold text-slate-900 underline decoration-red-200 decoration-2">{part}</strong>;
      }
      return part;
    });
  };

  // Retrieve raw bank detail lists based on currently selected year
  const rawListForActiveYear = datasets[year] || datasets["2025"];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-red-100 selection:text-red-900">
      
      {/* System Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white border border-slate-800 rounded-xl shadow-2xl p-4 flex items-center gap-3 animate-slide-in">
          <div className="bg-red-600 text-white rounded-lg p-1.5 shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400">SISTEMA DE SUPERVISIÓN</p>
            <p className="text-xs text-white mt-0.5">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Corporate High-End Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto pl-3 md:pl-4 pr-5 md:pr-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="text-slate-800 shrink-0 flex items-center justify-center">
              {/* Custom High-Quality Interactive Risk Matrix Icon (No words, heat-map colored 4x4 grid) */}
              <svg width="34" height="34" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" id="risk-matrix-header-icon">
                {/* Y-axis Arrow */}
                <path d="M5 27V5" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M3 7L5 5L7 7" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* X-axis Arrow */}
                <path d="M5 27H27" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M25 25L27 27L25 29" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Cells 4x4 Grid - Color Heat Map representing risk */}
                {/* Row 4 (Top): Amber, Orange, Red, Red */}
                <rect x="8" y="7" width="3.5" height="3.5" rx="0.5" fill="#FBBF24" />
                <rect x="12.5" y="7" width="3.5" height="3.5" rx="0.5" fill="#F97316" />
                <rect x="17" y="7" width="3.5" height="3.5" rx="0.5" fill="#EF4444" />
                <rect x="21.5" y="7" width="3.5" height="3.5" rx="0.5" fill="#EF4444" />

                {/* Row 3: Amber, Orange, Orange, Red */}
                <rect x="8" y="11.5" width="3.5" height="3.5" rx="0.5" fill="#FBBF24" />
                <rect x="12.5" y="11.5" width="3.5" height="3.5" rx="0.5" fill="#F97316" />
                <rect x="17" y="11.5" width="3.5" height="3.5" rx="0.5" fill="#F97316" />
                <rect x="21.5" y="11.5" width="3.5" height="3.5" rx="0.5" fill="#EF4444" />

                {/* Row 2: Emerald, Amber, Orange, Orange */}
                <rect x="8" y="16" width="3.5" height="3.5" rx="0.5" fill="#10B981" />
                <rect x="12.5" y="16" width="3.5" height="3.5" rx="0.5" fill="#FBBF24" />
                <rect x="17" y="16" width="3.5" height="3.5" rx="0.5" fill="#F97316" />
                <rect x="21.5" y="16" width="3.5" height="3.5" rx="0.5" fill="#F97316" />

                {/* Row 1 (Bottom): Emerald, Emerald, Amber, Amber */}
                <rect x="8" y="20.5" width="3.5" height="3.5" rx="0.5" fill="#10B981" />
                <rect x="12.5" y="20.5" width="3.5" height="3.5" rx="0.5" fill="#10B981" />
                <rect x="17" y="20.5" width="3.5" height="3.5" rx="0.5" fill="#FBBF24" />
                <rect x="21.5" y="20.5" width="3.5" height="3.5" rx="0.5" fill="#FBBF24" />
              </svg>
            </div>
            <div>
              <h1 className="font-display tracking-tight uppercase leading-tight">
                <span className="block font-bold tracking-wider" style={{ fontSize: "16px", color: "#010307" }}>
                  SUPERVISIÓN DE ENTIDADES FINANCIERAS
                </span>
                <span className="block text-[11px] md:text-xs font-semibold mt-0.5 tracking-wide" style={{ color: "#4d6194" }}>
                  DETERMINACIÓN DE LA MATRIZ DE RIESGO
                </span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-end md:self-auto">
            {/* Dynamic Period Selector Widget - Shifted further left with mr-1 md:mr-3 */}
            <div className="bg-slate-100 p-1.5 rounded-lg border border-slate-200 flex items-center gap-2 mr-1 md:mr-3.5">
              <span className="text-[10px] font-bold text-slate-500 px-1 uppercase tracking-tight">Periodo:</span>
              <select
                value={year}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
              >
                {Object.keys(datasets).sort((a, b) => parseInt(a) - parseInt(b)).map((pYear) => (
                  <option key={pYear} value={pYear}>
                    {pYear}
                  </option>
                ))}
              </select>
            </div>

            {/* Supabase Connection Status Widget - Positioned between Period and Carga de Datos */}
            <button
              onClick={() => {
                if (isSupabaseConfigured) {
                  setIsSupabaseOk(!isSupabaseOk);
                  showNotification(
                    `Conexión con Supabase ${!isSupabaseOk ? "forzada a OK" : "interrumpida (ERROR)"}.`
                  );
                } else {
                  setIsSupabaseOk(!isSupabaseOk);
                  showNotification(
                    `Simulación de conexión Supabase ${!isSupabaseOk ? "activada (OK)" : "desactivada (ERROR)"}.`
                  );
                }
              }}
              title={isSupabaseConfigured ? "Click para alternar estado de conexión real a Supabase" : "Supabase no configurado en env. Click para simular alternancia de estados."}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] md:text-xs font-bold transition-all cursor-pointer ${
                !isSupabaseConfigured
                  ? isSupabaseOk
                    ? "bg-amber-50/50 border-amber-200/60 hover:bg-amber-100/50"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  : isSupabaseOk 
                    ? "bg-emerald-50/50 border-emerald-200/60 hover:bg-emerald-100/50" 
                    : "bg-rose-50/50 border-rose-200/60 hover:bg-rose-100/50 animate-pulse"
              }`}
            >
              <span className="relative flex h-2 w-2">
                {!isSupabaseConfigured ? (
                  isSupabaseOk ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
                  )
                ) : isSupabaseOk ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                ) : (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </>
                )}
              </span>
              <span className="text-slate-500 font-mono text-[9px] uppercase tracking-wider">SUPABASE</span>
              <span className={
                !isSupabaseConfigured 
                  ? isSupabaseOk ? "text-amber-600" : "text-slate-500"
                  : isSupabaseOk ? "text-emerald-600" : "text-rose-600"
              }>
                {!isSupabaseConfigured 
                  ? isSupabaseOk ? "SIMULADO" : "LOCAL"
                  : isSupabaseOk ? "CONECTADO" : "ERROR"
                }
              </span>
            </button>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Database className="w-4 h-4 text-slate-400" />
              <span>Carga de Datos</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 flex flex-col gap-6">
        
        {/* Navigation Tabs Bar */}
        <div className="border-b border-slate-200 flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab("matriz")}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "matriz"
                ? "border-red-600 text-red-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-950 hover:bg-slate-100/50"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Matriz Consolidada</span>
          </button>
          <button
            onClick={() => setActiveTab("depositos")}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "depositos"
                ? "border-red-600 text-red-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-950 hover:bg-slate-100/50"
            }`}
          >
            <span className="font-mono text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">1</span>
            <span>Coeficiente Depósitos</span>
          </button>
          <button
            onClick={() => setActiveTab("clientes")}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "clientes"
                ? "border-red-600 text-red-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-950 hover:bg-slate-100/50"
            }`}
          >
            <span className="font-mono text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">2</span>
            <span>Coeficiente Clientes</span>
          </button>
          <button
            onClick={() => setActiveTab("auditoria")}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "auditoria"
                ? "border-red-600 text-red-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-950 hover:bg-slate-100/50"
            }`}
          >
            <span className="font-mono text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">3</span>
            <span>Coeficiente Auditoría Interna</span>
          </button>
        </div>

        {/* Dynamic Tab Panel Content */}
        <div className="flex-1">
          
          {/* TAB 1: Matriz Consolidada */}
          {activeTab === "matriz" && (
            <div className="grid grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Primary Grid Matrix and Executive Report (7-8 Columns) */}
              <div className="col-span-12 lg:col-span-7 xl:col-span-8 space-y-6">
                
                {/* 1. Matrix Table */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                  <div className="border-b border-slate-150 px-6 py-4 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-display font-bold text-slate-900 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-red-600" />
                        Matriz de Riesgo Consolidada
                      </h2>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-200/50 border border-slate-200 rounded-md px-2.5 py-1">
                      Periodo {year}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-3.5 px-4 text-center w-16">ID</th>
                          <th className="py-3.5 px-4 text-left">Entidad Financiera</th>
                          <th className="py-3.5 px-4 text-center">
                            <span className="text-slate-700 inline-block w-full text-center">Coeficiente Depósitos</span>
                          </th>
                          <th className="py-3.5 px-4 text-center">
                            <span className="text-slate-700 inline-block w-full text-center">Coeficiente Clientes</span>
                          </th>
                          <th className="py-3.5 px-4 text-center">
                            <span className="text-slate-700 inline-block w-full text-center">Coeficiente Auditoría Interna</span>
                          </th>
                          <th className="py-3.5 px-4 text-center">
                            <span className="text-slate-900 inline-block w-full text-center">Coeficiente Total</span>
                          </th>
                          <th className="py-3.5 px-6 text-center">Clasificación de Riesgo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 text-slate-800">
                        {banks.map((bank) => {
                          const isHighRisk = bank.riskLevel === "Alto";
                          const isLowRisk = bank.riskLevel === "Bajo";

                          let riskBadgeStyle = "bg-amber-50 text-amber-800 border-amber-200";
                          if (isHighRisk) riskBadgeStyle = "bg-red-50 text-red-700 border-red-200 font-extrabold";
                          if (isLowRisk) riskBadgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold";

                          return (
                            <tr key={bank.id} className="hover:bg-slate-50/50 transition">
                              <td className="py-4 px-4 text-center font-mono font-bold text-slate-400 text-xs">
                                {bank.code}
                              </td>
                              <td className="py-4 px-4 text-left min-w-[200px]">
                                <span className="text-xs sm:text-sm md:text-base font-bold text-slate-900 block tracking-tight">
                                  {bank.name}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center bg-slate-50/30">
                                <span className="text-base font-black text-slate-800 font-mono inline-block w-full text-center">
                                  {bank.deposits}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className="text-base font-black text-slate-800 font-mono inline-block w-full text-center">
                                  {bank.clients}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center bg-slate-50/30">
                                <span className="text-base font-black text-slate-800 font-mono inline-block w-full text-center">
                                  {bank.audit}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className="text-base font-black text-slate-950 font-mono bg-red-50 border border-red-200 px-2.5 py-1 rounded inline-block text-center">
                                  {bank.total}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${riskBadgeStyle}`}>
                                  {bank.riskLevel.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-slate-50 border-t border-slate-150 px-6 py-4 flex flex-wrap gap-3 items-center justify-end">
                    <div className="flex gap-2">
                      <button
                        onClick={handleExportExcel}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-md shadow-emerald-100 flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                        <span>Exportar a Excel (.xlsx)</span>
                      </button>

                      <button
                        onClick={handleDownloadReportHTML}
                        className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs px-3.5 py-2 rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-slate-500" />
                        <span>Imprimir Reporte</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Executive Report Section */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                  <div className="border-b border-slate-200 px-6 py-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-red-500 text-white text-[9px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded">
                          SISTEMA DE ANÁLISIS COGNITIVO
                        </span>
                        <span className="text-xs text-slate-400 font-semibold font-mono">Periodo de Supervisión: {year}</span>
                      </div>
                      <h2 className="text-base font-display font-bold text-white mt-1 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-red-500" />
                        Reporte de Supervisión de Riesgo Consolidado
                      </h2>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyClipboard}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer"
                        title="Copiar reporte completo"
                      >
                        <span>{copiedReport ? "Copiado!" : "Copiar Texto"}</span>
                      </button>

                      <button
                        onClick={handleRegenerateReport}
                        disabled={isGenerating}
                        className="bg-red-600 hover:bg-red-500 disabled:bg-red-850 text-white text-xs px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                        <span>{isGenerating ? "Procesando..." : "Regenerar con Calibración"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-8 bg-white">
                    {isGenerating ? (
                      <div className="space-y-4 py-8">
                        <div className="h-4 bg-slate-100 rounded w-1/3 animate-pulse"></div>
                        <div className="h-3 bg-slate-100 rounded w-full animate-pulse"></div>
                        <div className="h-3 bg-slate-100 rounded w-5/6 animate-pulse"></div>
                        <div className="h-4 bg-slate-100 rounded w-1/4 animate-pulse pt-4"></div>
                        <div className="h-3 bg-slate-100 rounded w-full animate-pulse"></div>
                        <div className="h-3 bg-slate-100 rounded w-4/5 animate-pulse"></div>
                      </div>
                    ) : (
                      <div className="markdown-body prose max-w-none text-slate-800">
                        {renderFormattedReport(report)}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: Parameters configuration & summary stats (5 Columns in lg, 4 in xl) */}
              <div className="col-span-12 lg:col-span-5 xl:col-span-4 space-y-6">
                
                {/* Calibration configuration summary */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-display font-bold text-slate-900 flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-slate-600" />
                        Calibración y Umbrales Activos
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Reglas de ponderación y límites de riesgo</p>
                    </div>
                    <span className="text-[10px] bg-red-50 text-red-600 border border-red-200 rounded-md px-2 py-0.5 font-bold font-mono">
                      Personalizado
                    </span>
                  </div>

                  <div className="p-4 space-y-4 text-xs">
                    
                    {/* 2x2 Responsive Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      
                      {/* CARD 4: Umbrales de Clasificación de Riesgo (Placed first / left side of row 1) */}
                      <div className="bg-slate-900 text-white rounded-lg p-3 space-y-2 flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest text-center border-b border-slate-800 pb-1 mb-1.5">Riesgo Consolidado</p>
                          <div className="space-y-1 text-[10px] font-mono leading-tight">
                            <div className="bg-red-950/80 border border-red-800/60 p-1 rounded flex items-center justify-between">
                              <span className="text-red-400 font-bold text-[9px]">ALTO RIESGO</span>
                              <span className="bg-red-900/50 text-red-200 px-1 py-0.2 rounded text-[9px] font-black">&gt;= 130 pts</span>
                            </div>
                            <div className="bg-amber-950/80 border border-amber-800/60 p-1 rounded flex items-center justify-between">
                              <span className="text-amber-400 font-bold text-[9px]">MEDIO RIESGO</span>
                              <span className="bg-amber-900/50 text-amber-200 px-1 py-0.2 rounded text-[9px] font-black">90 a 129 pts</span>
                            </div>
                            <div className="bg-emerald-950/80 border border-emerald-800/60 p-1 rounded flex items-center justify-between">
                              <span className="text-emerald-400 font-bold text-[9px]">BAJO RIESGO</span>
                              <span className="bg-emerald-900/50 text-emerald-200 px-1 py-0.2 rounded text-[9px] font-black">&lt; 90 pts</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-500 text-center leading-none mt-1">
                          Suma de Coeficientes 1, 2 y 3.
                        </p>
                      </div>

                      {/* CARD 1: Coef. Volumen de Depósitos (Placed second / right side of row 1) */}
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-150 space-y-2 flex flex-col justify-between">
                        <div>
                          <p className="font-bold text-slate-950 flex items-center justify-between text-[11px] mb-1.5 border-b border-slate-200 pb-1">
                            <span>1. Coeficiente Depósitos</span>
                            <span className="text-[9px] text-slate-500 font-mono bg-white px-1 rounded border border-slate-150">Máx {thresholds.dep1Score} pts</span>
                          </p>
                          <table className="w-full text-[10px] font-mono leading-none border-collapse">
                            <thead>
                              <tr className="text-[9px] text-slate-400 font-bold uppercase border-b border-slate-200">
                                <th className="py-1 text-left font-sans font-medium">Rango (M)</th>
                                <th className="py-1 text-center font-sans font-medium">Índ</th>
                                <th className="py-1 text-right font-sans font-medium">Coef</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-600">
                              <tr>
                                <td className="py-1 text-left text-slate-800">&gt; ${thresholds.dep1Val.toLocaleString()}</td>
                                <td className="py-1 text-center font-bold text-blue-600">{thresholds.dep1Idx.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</td>
                                <td className="py-1 text-right font-bold text-slate-950">{thresholds.dep1Score}</td>
                              </tr>
                              <tr>
                                <td className="py-1 text-left text-slate-800">${thresholds.dep2Val.toLocaleString()} - ${thresholds.dep1Val.toLocaleString()}</td>
                                <td className="py-1 text-center font-bold text-blue-600">{thresholds.dep2Idx.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</td>
                                <td className="py-1 text-right font-bold text-slate-950">{thresholds.dep2Score}</td>
                              </tr>
                              <tr>
                                <td className="py-1 text-left text-slate-800">${thresholds.dep3Val.toLocaleString()} - ${thresholds.dep2Val.toLocaleString()}</td>
                                <td className="py-1 text-center font-bold text-blue-600">{thresholds.dep3Idx.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</td>
                                <td className="py-1 text-right font-bold text-slate-950">{thresholds.dep3Score}</td>
                              </tr>
                              <tr>
                                <td className="py-1 text-left text-slate-800">&lt; ${thresholds.dep3Val.toLocaleString()}</td>
                                <td className="py-1 text-center font-bold text-blue-600">{thresholds.dep4Idx.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</td>
                                <td className="py-1 text-right font-bold text-slate-950">{thresholds.dep4Score}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* CARD 2: Coef. Cantidad de Clientes (Below Card 1) */}
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-150 space-y-2 flex flex-col justify-between">
                        <div>
                          <p className="font-bold text-slate-950 flex items-center justify-between text-[11px] mb-1.5 border-b border-slate-200 pb-1">
                            <span>2. Coeficiente Clientes</span>
                            <span className="text-[9px] text-slate-500 font-mono bg-white px-1 rounded border border-slate-150">Máx {thresholds.cli1Score} pts</span>
                          </p>
                          <table className="w-full text-[10px] font-mono leading-none border-collapse">
                            <thead>
                              <tr className="text-[9px] text-slate-400 font-bold uppercase border-b border-slate-200">
                                <th className="py-1 text-left font-sans font-medium">Rango (Clientes)</th>
                                <th className="py-1 text-center font-sans font-medium">Índ</th>
                                <th className="py-1 text-right font-sans font-medium">Coef</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-600">
                              <tr>
                                <td className="py-1 text-left text-slate-800">&gt;= {thresholds.cli1Val.toLocaleString()}</td>
                                <td className="py-1 text-center font-bold text-blue-600">{thresholds.cli1Idx.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</td>
                                <td className="py-1 text-right font-bold text-slate-950">{thresholds.cli1Score}</td>
                              </tr>
                              <tr>
                                <td className="py-1 text-left text-slate-800">{thresholds.cli2Val.toLocaleString()} - {(thresholds.cli1Val - 1).toLocaleString()}</td>
                                <td className="py-1 text-center font-bold text-blue-600">{thresholds.cli2Idx.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</td>
                                <td className="py-1 text-right font-bold text-slate-950">{thresholds.cli2Score}</td>
                              </tr>
                              <tr>
                                <td className="py-1 text-left text-slate-800">{thresholds.cli3Val.toLocaleString()} - {(thresholds.cli2Val - 1).toLocaleString()}</td>
                                <td className="py-1 text-center font-bold text-blue-600">{thresholds.cli3Idx.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</td>
                                <td className="py-1 text-right font-bold text-slate-950">{thresholds.cli3Score}</td>
                              </tr>
                              <tr>
                                <td className="py-1 text-left text-slate-800">&lt; {thresholds.cli3Val.toLocaleString()}</td>
                                <td className="py-1 text-center font-bold text-blue-600">{thresholds.cli4Idx.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</td>
                                <td className="py-1 text-right font-bold text-slate-950">{thresholds.cli4Score}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* CARD 3: Coef. Auditoría Interna (Below Card 4) */}
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-150 space-y-2 flex flex-col justify-between">
                        <div>
                          <p className="font-bold text-slate-950 flex items-center justify-between text-[11px] mb-1.5 border-b border-slate-200 pb-1">
                            <span>3. Coeficiente Auditoría Interna</span>
                            <span className="text-[9px] text-slate-500 font-mono bg-white px-1 rounded border border-slate-205">Máx {thresholds.aud1Score} pts</span>
                          </p>
                          <table className="w-full text-[10px] font-mono leading-none border-collapse">
                            <thead>
                              <tr className="text-[9px] text-slate-400 font-bold uppercase border-b border-slate-200">
                                <th className="py-1 text-left font-sans font-medium">Rango (Obs)</th>
                                <th className="py-1 text-center font-sans font-medium">Índ</th>
                                <th className="py-1 text-right font-sans font-medium">Coef</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-600">
                              <tr>
                                <td className="py-1 text-left text-slate-800">&gt; {thresholds.aud1Val}</td>
                                <td className="py-1 text-center font-bold text-blue-600">{thresholds.aud1Idx.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</td>
                                <td className="py-1 text-right font-bold text-slate-950">{thresholds.aud1Score}</td>
                              </tr>
                              <tr>
                                <td className="py-1 text-left text-slate-800">{thresholds.aud2Val} a {thresholds.aud1Val}</td>
                                <td className="py-1 text-center font-bold text-blue-600">{thresholds.aud2Idx.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</td>
                                <td className="py-1 text-right font-bold text-slate-950">{thresholds.aud2Score}</td>
                              </tr>
                              <tr>
                                <td className="py-1 text-left text-slate-800">{thresholds.aud3Val} a {thresholds.aud2Val - 1}</td>
                                <td className="py-1 text-center font-bold text-blue-600">{thresholds.aud3Idx.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</td>
                                <td className="py-1 text-right font-bold text-slate-950">{thresholds.aud3Score}</td>
                              </tr>
                              <tr>
                                <td className="py-1 text-left text-slate-800">Hasta {thresholds.aud3Val}</td>
                                <td className="py-1 text-center font-bold text-blue-600">{thresholds.aud4Idx.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</td>
                                <td className="py-1 text-right font-bold text-slate-950">{thresholds.aud4Score}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>

                    <button
                      onClick={resetThresholdsToDefaults}
                      className="w-full bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold py-2 rounded-lg text-center cursor-pointer transition text-xs"
                    >
                      Restablecer Configuración Base
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: Coeficiente Depósitos */}
          {activeTab === "depositos" && (
            <div className="grid grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Bank details */}
              <div className="col-span-12 lg:col-span-7 space-y-6">
                
                {/* Detailed Calculation Table (EL CUADRO PRIMERO) */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-display font-bold text-slate-900">
                        Cálculo Detallado del Coeficiente de Volumen de Depósitos
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Conversión de depósitos reportados a la puntuación de riesgo (Orden descendente por volumen).
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-200/50 border border-slate-200 rounded-md px-2.5 py-1 self-start sm:self-auto shrink-0">
                      Periodo {year}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-4 text-center w-20">RANKING</th>
                          <th className="py-3 px-4 text-center w-24">ID.<br/>ENTIDAD</th>
                          <th className="py-3 px-4">DENOMINACIÓN<br/>ENTIDAD</th>
                          <th className="py-3 px-4 text-right">SALDO PROM.<br/>DEPÓSITOS</th>
                          <th className="py-3 px-4 text-center">ÍNDICE</th>
                          <th className="py-3 px-4 text-center">COEFICIENTE<br/>DEPÓSITO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 text-slate-800 text-xs font-mono">
                        {[...rawListForActiveYear]
                          .sort((a, b) => b.rawDeposits - a.rawDeposits)
                          .map((raw, index) => {
                            const bankComputed = computeBankScores(raw, thresholds);
                            return (
                              <tr key={raw.id} className="hover:bg-slate-50/50 transition">
                                <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                                  {index + 1}
                                </td>
                                <td className="py-3.5 px-4 text-center text-slate-400 font-bold">
                                  {raw.code}
                                </td>
                                <td className="py-3.5 px-4 font-sans font-bold text-slate-900 text-sm">
                                  {raw.name}
                                </td>
                                <td className="py-3.5 px-4 text-right text-slate-900 font-bold font-mono">
                                  ${(raw.rawDeposits * 1000000).toLocaleString('es-ES')}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className="bg-blue-50 text-blue-700 border border-blue-150 px-2 py-0.5 rounded font-black text-xs">
                                    {bankComputed.depositIndex.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 4 })}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded font-black text-xs">
                                    {bankComputed.deposits}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Reference Table (LUEGO LA ESCALA DE PONDERACIÓN) */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                  <div className="bg-slate-900 text-white px-6 py-3.5">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider">
                      Escala de Ponderación según Volumen de Depósitos
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase font-mono text-[10px]">
                          <th className="py-2.5 px-4">Detalle (Límites de Captación)</th>
                          <th className="py-2.5 px-4 text-center w-24">Índice</th>
                          <th className="py-2.5 px-4 text-center w-28">Ponderador</th>
                          <th className="py-2.5 px-4 text-center w-28">Coeficiente</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 font-mono text-slate-700">
                        <tr>
                          <td className="py-2 px-4 font-sans font-medium">a) entidades con depósitos superiores a ${thresholds.dep1Val.toLocaleString('es-ES')} M</td>
                          <td className="py-2 px-4 text-center font-bold text-blue-600">{thresholds.dep1Idx.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 4 })}</td>
                          <td className="py-2 px-4 text-center text-slate-400" rowSpan={4}>40</td>
                          <td className="py-2 px-4 text-center font-bold text-slate-900">{thresholds.dep1Score}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 font-sans font-medium">b) entidades con depósitos de ${thresholds.dep2Val.toLocaleString('es-ES')} M a ${(thresholds.dep1Val - 1).toLocaleString('es-ES')} M</td>
                          <td className="py-2 px-4 text-center font-bold text-blue-600">{thresholds.dep2Idx.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 4 })}</td>
                          <td className="py-2 px-4 text-center font-bold text-slate-900">{thresholds.dep2Score}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 font-sans font-medium">c) entidades con depósitos de ${thresholds.dep3Val.toLocaleString('es-ES')} M a ${(thresholds.dep2Val - 1).toLocaleString('es-ES')} M</td>
                          <td className="py-2 px-4 text-center font-bold text-blue-600">{thresholds.dep3Idx.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 4 })}</td>
                          <td className="py-2 px-4 text-center font-bold text-slate-900">{thresholds.dep3Score}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 font-sans font-medium">d) entidades con depósitos hasta ${thresholds.dep3Val.toLocaleString('es-ES')} M</td>
                          <td className="py-2 px-4 text-center font-bold text-blue-600">{thresholds.dep4Idx.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 4 })}</td>
                          <td className="py-2 px-4 text-center font-bold text-slate-900">{thresholds.dep4Score}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Right Column: Calibration form */}
              <div className="col-span-12 lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-display font-bold text-slate-900">
                      🔧 Calibrar Coeficiente Depósitos
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Modificar límites, índices y puntuaciones asociadas</p>
                  </div>
                </div>

                <div className="p-6 space-y-5 text-xs">
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <p className="font-bold text-slate-800 mb-2 font-mono">LÍMITE SUPERIOR (Nivel 1)</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-500 mb-1">Si supera $ (Millones):</label>
                          <input
                            type="number"
                            value={localThresholds.dep1Val}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, dep1Val: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Asigna índice:</label>
                          <input
                            type="number"
                            step="0.01"
                            value={localThresholds.dep1Idx}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, dep1Idx: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Puntuación:</label>
                          <input
                            type="number"
                            value={localThresholds.dep1Score}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, dep1Score: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-b border-slate-100 pb-3">
                      <p className="font-bold text-slate-800 mb-2 font-mono">NIVEL MEDIO-ALTO (Nivel 2)</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-500 mb-1">Si supera $ (Millones):</label>
                          <input
                            type="number"
                            value={localThresholds.dep2Val}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, dep2Val: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Asigna índice:</label>
                          <input
                            type="number"
                            step="0.01"
                            value={localThresholds.dep2Idx}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, dep2Idx: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Puntuación:</label>
                          <input
                            type="number"
                            value={localThresholds.dep2Score}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, dep2Score: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-b border-slate-100 pb-3">
                      <p className="font-bold text-slate-800 mb-2 font-mono">NIVEL INICIAL (Nivel 3)</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-500 mb-1">Si supera $ (Millones):</label>
                          <input
                            type="number"
                            value={localThresholds.dep3Val}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, dep3Val: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Asigna índice:</label>
                          <input
                            type="number"
                            step="0.01"
                            value={localThresholds.dep3Idx}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, dep3Idx: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Puntuación:</label>
                          <input
                            type="number"
                            value={localThresholds.dep3Score}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, dep3Score: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pb-2">
                      <p className="font-bold text-slate-800 mb-2 font-mono">NIVEL MÍNIMO (De lo contrario)</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-500 mb-1">Si es menor a:</label>
                          <div className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded px-3 py-1.5 font-bold font-mono">
                            {localThresholds.dep3Val}
                          </div>
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Asigna índice:</label>
                          <input
                            type="number"
                            step="0.01"
                            value={localThresholds.dep4Idx}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, dep4Idx: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Puntuación:</label>
                          <input
                            type="number"
                            value={localThresholds.dep4Score}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, dep4Score: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-150 flex gap-2">
                    <button
                      onClick={applyCalibrationChanges}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-3 rounded-lg text-center cursor-pointer transition text-xs"
                    >
                      Aplicar y Recalcular Matriz
                    </button>
                    <button
                      onClick={resetThresholdsToDefaults}
                      className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold py-2 px-3 rounded-lg text-center cursor-pointer transition text-xs"
                    >
                      Restablecer
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: Coeficiente Clientes */}
          {activeTab === "clientes" && (
            <div className="grid grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Bank details */}
              <div className="col-span-12 lg:col-span-7 space-y-6">
                
                {/* Detailed Calculation Table (EL CUADRO PRIMERO) */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-display font-bold text-slate-900">
                        Cálculo Detallado del Coeficiente de Cantidad de Clientes
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Conversión de cantidad de clientes reportados a la puntuación de riesgo (Orden descendente).
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-200/50 border border-slate-200 rounded-md px-2.5 py-1 self-start sm:self-auto shrink-0">
                      Periodo {year}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-4 text-center w-20">RANKING</th>
                          <th className="py-3 px-4 text-center w-24">ID.<br/>ENTIDAD</th>
                          <th className="py-3 px-4">DENOMINACIÓN<br/>ENTIDAD</th>
                          <th className="py-3 px-4 text-right">CANTIDAD<br/>CLIENTES</th>
                          <th className="py-3 px-4 text-center">ÍNDICE</th>
                          <th className="py-3 px-4 text-center">COEFICIENTE<br/>CLIENTES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 text-slate-800 text-xs font-mono">
                        {[...rawListForActiveYear]
                          .sort((a, b) => b.rawClients - a.rawClients)
                          .map((raw, index) => {
                            const bankComputed = computeBankScores(raw, thresholds);
                            return (
                              <tr key={raw.id} className="hover:bg-slate-50/50 transition">
                                <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                                  {index + 1}
                                </td>
                                <td className="py-3.5 px-4 text-center text-slate-400 font-bold">
                                  {raw.code}
                                </td>
                                <td className="py-3.5 px-4 font-sans font-bold text-slate-900 text-sm">
                                  {raw.name}
                                </td>
                                <td className="py-3.5 px-4 text-right text-slate-900 font-bold font-mono">
                                  {raw.rawClients.toLocaleString('es-ES')}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className="bg-blue-50 text-blue-700 border border-blue-150 px-2 py-0.5 rounded font-black text-xs">
                                    {bankComputed.clientIndex.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 4 })}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded font-black text-xs">
                                    {bankComputed.clients}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Reference Table (LUEGO LA ESCALA DE PONDERACIÓN) */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                  <div className="bg-slate-900 text-white px-6 py-3.5">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider">
                      Escala de Ponderación según Cantidad de Clientes
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase font-mono text-[10px]">
                          <th className="py-2.5 px-4">Detalle (Límites de Clientes)</th>
                          <th className="py-2.5 px-4 text-center w-24">Índice</th>
                          <th className="py-2.5 px-4 text-center w-28">Ponderador</th>
                          <th className="py-2.5 px-4 text-center w-28">Coeficiente</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 font-mono text-slate-700">
                        <tr>
                          <td className="py-2 px-4 font-sans font-medium">a) entidades con clientes de {thresholds.cli1Val.toLocaleString('es-ES')} o más</td>
                          <td className="py-2 px-4 text-center font-bold text-blue-600">{thresholds.cli1Idx.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 4 })}</td>
                          <td className="py-2 px-4 text-center text-slate-400" rowSpan={4}>120</td>
                          <td className="py-2 px-4 text-center font-bold text-slate-900">{thresholds.cli1Score}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 font-sans font-medium">b) entidades con clientes de {thresholds.cli2Val.toLocaleString('es-ES')} a {(thresholds.cli1Val - 1).toLocaleString('es-ES')}</td>
                          <td className="py-2 px-4 text-center font-bold text-blue-600">{thresholds.cli2Idx.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 4 })}</td>
                          <td className="py-2 px-4 text-center font-bold text-slate-900">{thresholds.cli2Score}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 font-sans font-medium">c) entidades con clientes de {thresholds.cli3Val.toLocaleString('es-ES')} a {(thresholds.cli2Val - 1).toLocaleString('es-ES')}</td>
                          <td className="py-2 px-4 text-center font-bold text-blue-600">{thresholds.cli3Idx.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 4 })}</td>
                          <td className="py-2 px-4 text-center font-bold text-slate-900">{thresholds.cli3Score}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 font-sans font-medium">d) entidades con clientes menores a {thresholds.cli3Val.toLocaleString('es-ES')}</td>
                          <td className="py-2 px-4 text-center font-bold text-blue-600">{thresholds.cli4Idx.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 4 })}</td>
                          <td className="py-2 px-4 text-center font-bold text-slate-900">{thresholds.cli4Score}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Right Column: Calibration form */}
              <div className="col-span-12 lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-display font-bold text-slate-900">
                      🔧 Calibrar Coeficiente Clientes
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Modificar límites, índices y puntuaciones asociadas</p>
                  </div>
                </div>

                <div className="p-6 space-y-5 text-xs">
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <p className="font-bold text-slate-800 mb-2 font-mono">LÍMITE SUPERIOR (Nivel 1)</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-500 mb-1">Si supera (clientes):</label>
                          <input
                            type="number"
                            value={localThresholds.cli1Val}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, cli1Val: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Asigna índice:</label>
                          <input
                            type="number"
                            step="0.01"
                            value={localThresholds.cli1Idx}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, cli1Idx: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Puntuación:</label>
                          <input
                            type="number"
                            value={localThresholds.cli1Score}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, cli1Score: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-b border-slate-100 pb-3">
                      <p className="font-bold text-slate-800 mb-2 font-mono">NIVEL MEDIO-ALTO (Nivel 2)</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-500 mb-1">Si supera (clientes):</label>
                          <input
                            type="number"
                            value={localThresholds.cli2Val}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, cli2Val: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Asigna índice:</label>
                          <input
                            type="number"
                            step="0.01"
                            value={localThresholds.cli2Idx}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, cli2Idx: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Puntuación:</label>
                          <input
                            type="number"
                            value={localThresholds.cli2Score}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, cli2Score: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-b border-slate-100 pb-3">
                      <p className="font-bold text-slate-800 mb-2 font-mono">NIVEL INICIAL (Nivel 3)</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-500 mb-1">Si supera (clientes):</label>
                          <input
                            type="number"
                            value={localThresholds.cli3Val}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, cli3Val: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Asigna índice:</label>
                          <input
                            type="number"
                            step="0.01"
                            value={localThresholds.cli3Idx}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, cli3Idx: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Puntuación:</label>
                          <input
                            type="number"
                            value={localThresholds.cli3Score}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, cli3Score: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pb-2">
                      <p className="font-bold text-slate-800 mb-2 font-mono">NIVEL MÍNIMO (De lo contrario)</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-500 mb-1">Si es menor a:</label>
                          <div className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded px-3 py-1.5 font-bold font-mono">
                            {localThresholds.cli3Val.toLocaleString('es-ES')}
                          </div>
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Asigna índice:</label>
                          <input
                            type="number"
                            step="0.01"
                            value={localThresholds.cli4Idx}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, cli4Idx: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Puntuación:</label>
                          <input
                            type="number"
                            value={localThresholds.cli4Score}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, cli4Score: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-150 flex gap-2">
                    <button
                      onClick={applyCalibrationChanges}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-3 rounded-lg text-center cursor-pointer transition text-xs"
                    >
                      Aplicar y Recalcular Matriz
                    </button>
                    <button
                      onClick={resetThresholdsToDefaults}
                      className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold py-2 px-3 rounded-lg text-center cursor-pointer transition text-xs"
                    >
                      Restablecer
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: Coeficiente Auditoría Interna */}
          {activeTab === "auditoria" && (
            <div className="grid grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Bank details */}
              <div className="col-span-12 lg:col-span-7 space-y-6">
                
                {/* Detailed Calculation Table (EL CUADRO PRIMERO) */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-display font-bold text-slate-900">
                        Cálculo Detallado del Coeficiente de Observaciones de Auditoría Interna
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Conversión de observaciones de auditoría reportadas a la puntuación de riesgo (Orden descendente).
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-200/50 border border-slate-200 rounded-md px-2.5 py-1 self-start sm:self-auto shrink-0">
                      Periodo {year}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-4 text-center w-20">RANKING</th>
                          <th className="py-3 px-4 text-center w-24">ID.<br/>ENTIDAD</th>
                          <th className="py-3 px-4">DENOMINACIÓN<br/>ENTIDAD</th>
                          <th className="py-3 px-4 text-right">OBSERVACIONES<br/>AUDITORÍA</th>
                          <th className="py-3 px-4 text-center">ÍNDICE</th>
                          <th className="py-3 px-4 text-center">COEFICIENTE<br/>AUDITORÍA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 text-slate-800 text-xs font-mono">
                        {[...rawListForActiveYear]
                          .sort((a, b) => b.rawAudit - a.rawAudit)
                          .map((raw, index) => {
                            const bankComputed = computeBankScores(raw, thresholds);
                            return (
                              <tr key={raw.id} className="hover:bg-slate-50/50 transition">
                                <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                                  {index + 1}
                                </td>
                                <td className="py-3.5 px-4 text-center text-slate-400 font-bold">
                                  {raw.code}
                                </td>
                                <td className="py-3.5 px-4 font-sans font-bold text-slate-900 text-sm">
                                  {raw.name}
                                </td>
                                <td className="py-3.5 px-4 text-right text-slate-900 font-bold font-mono">
                                  {raw.rawAudit}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className="bg-blue-50 text-blue-700 border border-blue-150 px-2 py-0.5 rounded font-black text-xs">
                                    {bankComputed.auditIndex.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 4 })}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded font-black text-xs">
                                    {bankComputed.audit}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Reference Table (LUEGO LA ESCALA DE PONDERACIÓN) */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                  <div className="bg-slate-900 text-white px-6 py-3.5">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider">
                      Escala de Ponderación según Observaciones de Auditoría Interna
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase font-mono text-[10px]">
                          <th className="py-2.5 px-4">Detalle (Límites de Observaciones)</th>
                          <th className="py-2.5 px-4 text-center w-24">Índice</th>
                          <th className="py-2.5 px-4 text-center w-28">Ponderador</th>
                          <th className="py-2.5 px-4 text-center w-28">Coeficiente</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 font-mono text-slate-700">
                        <tr>
                          <td className="py-2 px-4 font-sans font-medium">a) entidades con observaciones superiores a {thresholds.aud1Val}</td>
                          <td className="py-2 px-4 text-center font-bold text-blue-600">{thresholds.aud1Idx.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 4 })}</td>
                          <td className="py-2 px-4 text-center text-slate-400" rowSpan={4}>30</td>
                          <td className="py-2 px-4 text-center font-bold text-slate-900">{thresholds.aud1Score}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 font-sans font-medium">b) entidades con observaciones de {thresholds.aud2Val} a {thresholds.aud1Val}</td>
                          <td className="py-2 px-4 text-center font-bold text-blue-600">{thresholds.aud2Idx.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 4 })}</td>
                          <td className="py-2 px-4 text-center font-bold text-slate-900">{thresholds.aud2Score}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 font-sans font-medium">c) entidades con observaciones de {thresholds.aud3Val} a {(thresholds.aud2Val - 1)}</td>
                          <td className="py-2 px-4 text-center font-bold text-blue-600">{thresholds.aud3Idx.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 4 })}</td>
                          <td className="py-2 px-4 text-center font-bold text-slate-900">{thresholds.aud3Score}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 font-sans font-medium">d) entidades con observaciones hasta {(thresholds.aud3Val - 1)}</td>
                          <td className="py-2 px-4 text-center font-bold text-blue-600">{thresholds.aud4Idx.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 4 })}</td>
                          <td className="py-2 px-4 text-center font-bold text-slate-900">{thresholds.aud4Score}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Right Column: Calibration form */}
              <div className="col-span-12 lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-display font-bold text-slate-900">
                      🔧 Calibrar Coeficiente Auditoría Interna
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Modificar límites, índices y observaciones ponderadas</p>
                  </div>
                </div>

                <div className="p-6 space-y-5 text-xs">
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <p className="font-bold text-slate-800 mb-2 font-mono">LÍMITE SUPERIOR (Nivel 1)</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-500 mb-1">Si supera:</label>
                          <input
                            type="number"
                            value={localThresholds.aud1Val}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, aud1Val: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Asigna índice:</label>
                          <input
                            type="number"
                            step="0.01"
                            value={localThresholds.aud1Idx}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, aud1Idx: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Puntuación:</label>
                          <input
                            type="number"
                            value={localThresholds.aud1Score}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, aud1Score: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-b border-slate-100 pb-3">
                      <p className="font-bold text-slate-800 mb-2 font-mono">NIVEL MEDIO-ALTO (Nivel 2)</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-500 mb-1">Si supera:</label>
                          <input
                            type="number"
                            value={localThresholds.aud2Val}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, aud2Val: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Asigna índice:</label>
                          <input
                            type="number"
                            step="0.01"
                            value={localThresholds.aud2Idx}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, aud2Idx: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Puntuación:</label>
                          <input
                            type="number"
                            value={localThresholds.aud2Score}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, aud2Score: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-b border-slate-100 pb-3">
                      <p className="font-bold text-slate-800 mb-2 font-mono">NIVEL INICIAL (Nivel 3)</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-500 mb-1">Si supera:</label>
                          <input
                            type="number"
                            value={localThresholds.aud3Val}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, aud3Val: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Asigna índice:</label>
                          <input
                            type="number"
                            step="0.01"
                            value={localThresholds.aud3Idx}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, aud3Idx: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Puntuación:</label>
                          <input
                            type="number"
                            value={localThresholds.aud3Score}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, aud3Score: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pb-2">
                      <p className="font-bold text-slate-800 mb-2 font-mono">NIVEL MÍNIMO (De lo contrario)</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-500 mb-1">Si es menor a:</label>
                          <div className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded px-3 py-1.5 font-bold font-mono">
                            {localThresholds.aud3Val}
                          </div>
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Asigna índice:</label>
                          <input
                            type="number"
                            step="0.01"
                            value={localThresholds.aud4Idx}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, aud4Idx: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Puntuación:</label>
                          <input
                            type="number"
                            value={localThresholds.aud4Score}
                            onChange={(e) => setLocalThresholds({ ...localThresholds, aud4Score: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 font-bold font-mono text-slate-800 focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-150 flex gap-2">
                    <button
                      onClick={applyCalibrationChanges}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-3 rounded-lg text-center cursor-pointer transition text-xs"
                    >
                      Aplicar y Recalcular Matriz
                    </button>
                    <button
                      onClick={resetThresholdsToDefaults}
                      className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold py-2 px-3 rounded-lg text-center cursor-pointer transition text-xs"
                    >
                      Restablecer
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </main>

      {/* Dynamic Slide-up Modal Drawer for Excel Upload Simulating */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden animate-zoom-in">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-red-500" />
                <span className="font-bold font-display text-sm">Centro de Carga e Integración de Archivos Excel / CSV</span>
              </div>
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* Educational Section explaining function, matching and formats */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div>
                  <h4 className="font-bold text-xs text-slate-800 uppercase font-mono tracking-wider">¿Qué función cumple este cargador?</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Este panel permite consolidar los datos brutos provenientes de tres sectores operativos independientes para construir la <strong>Matriz de Riesgo Consolidada</strong>. 
                    El sistema procesa los archivos correspondientes a cada área, unificándolos bajo un <strong>ID Entidad</strong> único para recalcular dinámicamente sus ponderadores de riesgo.
                  </p>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <h4 className="font-bold text-xs text-slate-800 uppercase font-mono tracking-wider mb-2">Formato Esperado de las Hojas de Cálculo (Excel o CSV)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                    <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
                      <span className="font-bold text-red-600 block">Sector 1: Depósitos</span>
                      <p className="text-slate-500 text-[10px]">Columnas en SALDOS.xlsx (o .csv):</p>
                      <div className="bg-slate-50 p-1.5 rounded font-mono text-[9px] text-slate-600">
                        ID Entidad | Denominación | Volumen Depósitos<br/>
                        13 | BANCO COOP | 15000 M<br/>
                        5 | BANCO SUR | 13500 M
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
                      <span className="font-bold text-red-600 block">Sector 2: Clientes</span>
                      <p className="text-slate-500 text-[10px]">Columnas en CLIENTES.xlsx (o .csv):</p>
                      <div className="bg-slate-50 p-1.5 rounded font-mono text-[9px] text-slate-600">
                        ID Entidad | Denominación | Cantidad Clientes<br/>
                        13 | BANCO COOP | 4200000<br/>
                        5 | BANCO SUR | 2500000
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
                      <span className="font-bold text-red-600 block">Sector 3: Auditoría Interna</span>
                      <p className="text-slate-500 text-[10px]">Columnas en AI.xlsx (o .csv):</p>
                      <div className="bg-slate-50 p-1.5 rounded font-mono text-[9px] text-slate-600">
                        ID Entidad | Denominación | Observaciones AI<br/>
                        13 | BANCO COOP | 5<br/>
                        5 | BANCO SUR | 6
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload controls row */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-xs text-slate-800 uppercase font-mono tracking-wider mb-2">Cargar Archivos por Área de Origen</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Sector 1 file loader */}
                    <div className="border border-slate-200 rounded-lg p-3.5 space-y-2 bg-white flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-900 whitespace-nowrap font-display">1. Depósitos</span>
                        </div>
                        
                        <label className="block bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition text-left select-none space-y-1">
                          <div className="flex items-center font-mono">
                            <span className="text-slate-400 w-[100px] shrink-0">Archivo:</span>
                            <span className="text-slate-800 font-bold truncate" title={uploadedSaldosName}>{uploadedSaldosName}</span>
                          </div>
                          <div className="flex items-center font-mono">
                            <span className="text-slate-400 w-[100px] shrink-0">Identificador:</span>
                            <span className="text-slate-800 font-bold">ID Entidad</span>
                          </div>
                          <input 
                            type="file" 
                            accept=".xlsx,.csv,.xls"
                            className="hidden" 
                            onChange={(e) => handleFileChange(e, 1)}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Sector 2 file loader */}
                    <div className="border border-slate-200 rounded-lg p-3.5 space-y-2 bg-white flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-900 whitespace-nowrap font-display">2. Clientes</span>
                        </div>
                        
                        <label className="block bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition text-left select-none space-y-1">
                          <div className="flex items-center font-mono">
                            <span className="text-slate-400 w-[100px] shrink-0">Archivo:</span>
                            <span className="text-slate-800 font-bold truncate" title={uploadedClientsName}>{uploadedClientsName}</span>
                          </div>
                          <div className="flex items-center font-mono">
                            <span className="text-slate-400 w-[100px] shrink-0">Identificador:</span>
                            <span className="text-slate-800 font-bold">ID Entidad</span>
                          </div>
                          <input 
                            type="file" 
                            accept=".xlsx,.csv,.xls"
                            className="hidden" 
                            onChange={(e) => handleFileChange(e, 2)}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Sector 3 file loader */}
                    <div className="border border-slate-200 rounded-lg p-3.5 space-y-2 bg-white flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-900 whitespace-nowrap font-display">3. Auditoría Interna</span>
                        </div>
                        
                        <label className="block bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition text-left select-none space-y-1">
                          <div className="flex items-center font-mono">
                            <span className="text-slate-400 w-[100px] shrink-0">Archivo:</span>
                            <span className="text-slate-800 font-bold truncate" title={uploadedAuditName}>{uploadedAuditName}</span>
                          </div>
                          <div className="flex items-center font-mono">
                            <span className="text-slate-400 w-[100px] shrink-0">Identificador:</span>
                            <span className="text-slate-800 font-bold">ID Entidad</span>
                          </div>
                          <input 
                            type="file" 
                            accept=".xlsx,.csv,.xls"
                            className="hidden" 
                            onChange={(e) => handleFileChange(e, 3)}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Configuration of Data Period and Fixing Coeffs (Years 2020 to 2045) */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-xs text-slate-800 uppercase font-mono tracking-wider flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-red-600" />
                        <span>Definir Período de los Datos Cargados</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Asocia los archivos de origen de este periodo a un año específico de supervisión consolidada.
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
                      <label className="text-xs font-bold text-slate-600 font-mono">AÑO DE SUPERVISIÓN:</label>
                      <select
                        value={uploadYear}
                        onChange={(e) => setUploadYear(e.target.value)}
                        className="bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded px-2.5 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
                      >
                        {Array.from({ length: 26 }, (_, i) => (2020 + i).toString()).map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Warning / Notice block depending on whether dataset for selected year already exists */}
                  <div className="border-t border-slate-200 pt-4 space-y-4">
                    {/* Alertas / Estado de los datos de este año */}
                    {datasets[uploadYear] ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex gap-3 text-xs text-amber-800">
                        <span className="text-base select-none leading-none">⚠️</span>
                        <div className="space-y-1">
                          <p className="font-bold">Datos Existentes para el Año {uploadYear}</p>
                          <p className="text-slate-600 leading-normal">
                            Ya se registran datos consolidados de supervisión para el periodo <strong className="text-amber-950 font-bold">{uploadYear}</strong>. Si continúas y fijas la información, los datos anteriores se <strong>sobreescribirán por completo</strong> con la información procesada de los archivos Excel actuales.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-3.5 flex gap-3 text-xs text-blue-800">
                        <span className="text-base select-none leading-none">ℹ️</span>
                        <div className="space-y-1">
                          <p className="font-bold text-blue-900">Nuevo Periodo de Supervisión Detectado</p>
                          <p className="text-slate-600 leading-normal">
                            No se registran datos consolidados previos para el periodo de supervisión <strong className="text-blue-950 font-bold">{uploadYear}</strong>. Al fijar los datos se inicializará un nuevo registro con la información y las entidades de los archivos de origen.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Resumen de consolidación en lugar de la tabla de inputs de 300 filas */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <span className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">Detalle del Proceso de Consolidación</span>
                        <span className="bg-slate-100 text-slate-700 font-mono font-bold text-[10px] px-2.5 py-0.5 rounded border border-slate-200">
                          Periodo {uploadYear}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* File details list */}
                        <div className="space-y-2">
                          <p className="font-bold text-slate-700">Archivos Cargados:</p>
                          <div className="space-y-1.5 text-slate-600 font-mono text-[11px]">
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-500 font-bold">✓</span>
                              <span className="text-slate-400">Depósitos:</span>
                              <span className="text-slate-800 font-semibold truncate max-w-[160px]" title={uploadedSaldosName}>{uploadedSaldosName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-500 font-bold">✓</span>
                              <span className="text-slate-400">Clientes:</span>
                              <span className="text-slate-800 font-semibold truncate max-w-[160px]" title={uploadedClientsName}>{uploadedClientsName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-500 font-bold">✓</span>
                              <span className="text-slate-400">Auditoría:</span>
                              <span className="text-slate-800 font-semibold truncate max-w-[160px]" title={uploadedAuditName}>{uploadedAuditName}</span>
                            </div>
                          </div>
                        </div>

                        {/* Integration metrics */}
                        <div className="space-y-2 border-l border-slate-100 pl-4">
                          <p className="font-bold text-slate-700">Mapeo de Integridad:</p>
                          <div className="space-y-1 text-slate-600 text-[11px] leading-relaxed">
                            <p>• Clave Única de Cruzamiento: <strong className="font-mono text-slate-900 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">ID Entidad</strong></p>
                            <p>• Entidades Procesadas: <strong className="text-slate-900">Hasta 300 entidades</strong> en cola.</p>
                            <p>• Tipo de Integridad: <strong className="text-red-700">Fusión Absoluta (Escenario A)</strong></p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleFixDataForYear}
                      className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-5 py-2.5 rounded-lg cursor-pointer transition shadow-sm flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Fijar y Consolidar Datos de {uploadYear}</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>

            <div className="bg-white border-t border-slate-200 px-6 py-4 flex justify-end">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2 rounded-lg cursor-pointer transition shadow-sm"
              >
                Cerrar Panel de Carga
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Corporate Clean Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 shrink-0">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 SUPERVISIÓN DE ENTIDADES FINANCIERAS.</p>
        </div>
      </footer>

    </div>
  );
}
