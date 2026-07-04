import * as XLSX from "xlsx-js-style";
import { BankRawData } from "../utils";

export interface SectorRow {
  code: string;
  name: string;
  value: number;
}

/**
 * Parses a raw sector worksheet (Depósitos, Clientes or Auditoría) into
 * { code, name, value } rows.
 *
 * The real files provided by el supervisor tienen layouts levemente distintos
 * (título + fuente + fila de año antes del encabezado, columnas C/D variables),
 * por eso el parser:
 *  1. Detecta la fila de encabezado buscando una celda de la primera columna
 *     que contenga "Cod", "N°", "Nro" o "ID" (case-insensitive).
 *  2. A partir de esa fila, toma como código de entidad la primera celda
 *     numérica de cada fila.
 *  3. Toma como nombre la primera celda de texto de la fila (usualmente la
 *     columna B).
 *  4. Toma como valor la última celda numérica de la fila (evita depender de
 *     un índice de columna fijo, porque el archivo de depósitos tiene el
 *     total en la columna C, mientras auditoría lo tiene en la C también
 *     pero con una columna D vacía de por medio en algunos años).
 */
export function parseSectorSheet(worksheet: XLSX.WorkSheet): SectorRow[] {
  const aoa: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: null,
    blankrows: false,
  });

  let headerIdx = -1;
  for (let i = 0; i < aoa.length; i++) {
    const row = aoa[i] || [];
    const first = row[0];
    if (typeof first === "string" && /cod|n[°º]|nro|^id/i.test(first.trim())) {
      headerIdx = i;
      break;
    }
  }

  const dataRows = headerIdx >= 0 ? aoa.slice(headerIdx + 1) : aoa;
  const result: SectorRow[] = [];

  for (const row of dataRows) {
    if (!row || row.length === 0) continue;

    const codeRaw = row[0];
    if (codeRaw === null || codeRaw === undefined || codeRaw === "") continue;
    const code = String(codeRaw).trim();
    if (!/^\d+$/.test(code)) continue; // descarta filas de título/pie que no sean un ID numérico

    // Nombre: primera celda de texto no vacía (usualmente columna B)
    let name = "";
    for (let c = 1; c < row.length; c++) {
      if (typeof row[c] === "string" && row[c].trim() !== "") {
        name = row[c].trim();
        break;
      }
    }

    // Valor: última celda numérica de la fila (evita depender de un índice fijo)
    let value: number | null = null;
    for (let c = row.length - 1; c >= 1; c--) {
      if (typeof row[c] === "number") {
        value = row[c];
        break;
      }
    }

    if (value === null) continue;
    if (!name) name = `ENTIDAD ${code}`;

    result.push({ code, name, value });
  }

  return result;
}

/**
 * Reads a File (xlsx/xls/csv) in the browser and returns the parsed sector rows
 * of its first sheet.
 */
export function readSectorFile(file: File): Promise<SectorRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: "array" });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        resolve(parseSectorSheet(ws));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error || new Error("Error leyendo el archivo"));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Consolida los tres sectores (Depósitos, Clientes, Auditoría Interna) en una
 * lista de BankRawData, cruzando por el ID Único de Entidad (código).
 *
 * El nombre/código "canónico" de cada entidad sale siempre del maestro fijo
 * `banks` (banksMaster), no del Excel: así, si un archivo trae una
 * denominación levemente distinta a la oficial (mayúsculas, razón social
 * abreviada, etc.), igual se unifica correctamente porque el cruce es por ID,
 * no por nombre. Si un ID del Excel no existe en el maestro, se usa el
 * nombre del Excel como respaldo (y conviene darlo de alta en `banks`).
 */
export function mergeSectorsToBankRawData(
  deposits: SectorRow[],
  clients: SectorRow[],
  audit: SectorRow[],
  banksMaster?: Record<string, { code: string; name: string }>
): BankRawData[] {
  const byCode = (rows: SectorRow[]) => {
    const map = new Map<string, SectorRow>();
    for (const r of rows) map.set(r.code, r);
    return map;
  };

  const dep = byCode(deposits);
  const cli = byCode(clients);
  const aud = byCode(audit);

  const allCodes = new Set<string>([...dep.keys(), ...cli.keys(), ...aud.keys()]);

  return Array.from(allCodes)
    .sort((a, b) => Number(a) - Number(b))
    .map((code) => {
      const master = banksMaster?.[code];
      const name =
        master?.name ||
        dep.get(code)?.name ||
        cli.get(code)?.name ||
        aud.get(code)?.name ||
        `ENTIDAD ${code}`;
      return {
        id: `banco-${code}`,
        code: master?.code ?? code,
        name,
        rawDeposits: dep.get(code)?.value ?? 0,
        rawClients: cli.get(code)?.value ?? 0,
        rawAudit: aud.get(code)?.value ?? 0,
      };
    });
}

/**
 * Devuelve los códigos de entidad que aparecieron en los archivos subidos
 * pero no existen en el maestro `banks`. Útil para avisarle al usuario que
 * conviene darlos de alta antes de fijar el período.
 */
export function findUnknownCodes(
  rows: BankRawData[],
  banksMaster: Record<string, { code: string; name: string }>
): string[] {
  return rows.filter((r) => !banksMaster[r.code]).map((r) => r.code);
}
