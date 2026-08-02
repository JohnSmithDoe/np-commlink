import dayjs from 'dayjs';

export interface ParsedRow {
  dateISO: string;
  amountCents: number;
  description: string;
}

export interface ParseResult {
  rows: ParsedRow[];
  rejected: number;
}

export interface BankParser {
  parse(text: string): ParseResult;
}

export function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function splitRow(line: string): string[] {
  const fields: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (inQuotes && char === '"' && line[index + 1] === '"') {
      field += '"';
      index++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ';' && !inQuotes) {
      fields.push(field.trim());
      field = '';
    } else {
      field += char;
    }
  }
  fields.push(field.trim());
  return fields;
}

export function findHeaderIndex(lines: string[], firstColumn: string): number {
  return lines.findIndex((line) => splitRow(line)[0] === firstColumn);
}

export function germanDateToISO(value: string): string | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const date = dayjs(`${yyyy}-${mm}-${dd}`);
  return date.isValid() ? date.format() : null;
}

export function joinDescription(counterparty: string, purpose: string): string {
  return [counterparty, purpose].filter((part) => part.length > 0).join(' — ');
}
