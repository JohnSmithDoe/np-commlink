import dayjs from 'dayjs';
import { TBank } from '../../model/account.types';

/**
 * Per-bank CSV import (see docs/project-summary.md §7.3 (Import)). An account's `bank` selects one
 * of these parsers; each owns its bank's column layout and quirks. Parsers are
 * pure `text -> rows` so they are trivially spec'd against the real example
 * exports (docs/cash/example*.csv). Turning rows into `ICashTransaction`s (ids,
 * dedup, categorization) is `plan-import.ts`, kept separate so the parsers stay
 * format-only.
 */

export interface IParsedRow {
  dateISO: string;
  amountCents: number;
  description: string;
}

export interface IParseResult {
  rows: IParsedRow[];
  /**
   * Data rows below the header that could not be read — an unparseable date or
   * amount. Counted rather than silently dropped: a partial import that reports
   * success leaves the balance wrong with nothing to notice it by.
   */
  rejected: number;
}

export interface IBankParser {
  readonly bank: TBank;
  readonly label: string;
  parse(text: string): IParseResult;
}

/** Non-empty, trimmed lines — tolerant of CRLF and a trailing newline. */
export function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * A `;`-delimited row split into trimmed fields, RFC4180-style: a quoted field
 * may contain the delimiter, and `""` inside one is a literal quote.
 *
 * Both banks export quoted CSV when a field needs it, and a naive `split(';')`
 * turns one such row into a column shift — which surfaces as a *dropped* row
 * (unparseable amount), not as an error.
 */
export function splitRow(line: string): string[] {
  const fields: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes && char === '"' && line[i + 1] === '"') {
      field += '"';
      i++;
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

/**
 * Index of the header row — the first whose first field equals `firstColumn` —
 * so a bank preamble above the table is skipped. -1 if not found.
 */
export function findHeaderIndex(lines: string[], firstColumn: string): number {
  return lines.findIndex((line) => splitRow(line)[0] === firstColumn);
}

/** `DD.MM.YYYY` -> full local-midnight ISO, or null if malformed. */
export function germanDateToISO(value: string): string | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const date = dayjs(`${yyyy}-${mm}-${dd}`);
  return date.isValid() ? date.format() : null;
}

/** `[counterparty, purpose]` joined for display / rule matching. */
export function joinDescription(counterparty: string, purpose: string): string {
  return [counterparty, purpose].filter((part) => part.length > 0).join(' — ');
}
