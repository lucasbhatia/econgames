/**
 * CSV reader for large GPS data files.
 * Uses Node.js readline for streaming — constant memory regardless of file size.
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

const PROCESSED_DIR = path.resolve(__dirname, "../../../src/lib/data/processed");

/** Parse a single CSV line handling quoted fields */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

/** Stream-read a CSV file, calling onRow for each row after the header */
export async function streamCSV(
  filename: string,
  onRow: (row: Record<string, string>) => void,
): Promise<{ rowCount: number; headers: string[] }> {
  const fp = path.join(PROCESSED_DIR, filename);
  console.log(`  Reading CSV: ${filename}...`);

  const stream = fs.createReadStream(fp, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let headers: string[] = [];
  let rowCount = 0;
  let isFirst = true;

  for await (const line of rl) {
    if (!line.trim()) continue;

    const fields = parseCSVLine(line);

    if (isFirst) {
      headers = fields.map((h) => h.trim());
      isFirst = false;
      continue;
    }

    const row: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = fields[i] ?? "";
    }
    onRow(row);
    rowCount++;
  }

  console.log(`  Rows: ${rowCount.toLocaleString()}`);
  return { rowCount, headers };
}
