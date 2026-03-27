import * as XLSX from "xlsx";
import * as path from "path";

const DATA_DIR = path.resolve(__dirname, "../../../../DATA");

/** Read an Excel file and return rows as objects for the first (or named) sheet */
export function readExcel(
  fileName: string,
  options?: { sheet?: string | number; columns?: string[] }
): Record<string, unknown>[] {
  const filePath = path.join(DATA_DIR, fileName);
  console.log(`  Reading: ${fileName}...`);

  const workbook = XLSX.readFile(filePath, {
    cellDates: true,
    cellNF: false,
    cellHTML: false,
    dense: false,
  });

  // Pick sheet
  let sheetName: string;
  if (typeof options?.sheet === "number") {
    sheetName = workbook.SheetNames[options.sheet];
  } else if (typeof options?.sheet === "string") {
    // Fuzzy match — sheet names get truncated in Excel
    sheetName = workbook.SheetNames.find(
      (s) => s.toLowerCase().includes(options!.sheet!.toString().toLowerCase())
    ) ?? workbook.SheetNames[0];
  } else {
    sheetName = workbook.SheetNames[0];
  }

  if (!sheetName) throw new Error(`No sheet found in ${fileName}`);
  console.log(`  Sheet: "${sheetName}"`);

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

  // Trim whitespace from all column names (GPS PPs has "track_id " with trailing space)
  const rows = rawRows.map((row) => {
    const clean: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(row)) {
      clean[key.trim()] = val;
    }
    return clean;
  });

  console.log(`  Rows: ${rows.length.toLocaleString()}`);

  // Column pruning: if specific columns requested, drop everything else
  if (options?.columns && options.columns.length > 0) {
    const keep = new Set(options.columns);
    return rows.map((row) => {
      const pruned: Record<string, unknown> = {};
      for (const col of keep) {
        if (col in row) pruned[col] = row[col];
      }
      return pruned;
    });
  }

  return rows;
}

/** List all sheet names in an Excel file */
export function listSheets(fileName: string): string[] {
  const filePath = path.join(DATA_DIR, fileName);
  const wb = XLSX.readFile(filePath, { bookSheets: true });
  return wb.SheetNames;
}

/** Format a date value (might be a Date object or string) to YYYY-MM-DD */
export function formatDate(val: unknown): string {
  if (!val) return "";
  if (val instanceof Date) {
    return val.toISOString().slice(0, 10);
  }
  const s = String(val).trim();
  // Already YYYY-MM-DD?
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // Try parsing
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return s;
}

/** Safe number extraction */
export function num(val: unknown): number {
  if (val === null || val === undefined || val === "") return NaN;
  const n = Number(val);
  return n;
}

/** Safe string extraction */
export function str(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

export { DATA_DIR };
