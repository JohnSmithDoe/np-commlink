import dayjs from 'dayjs';
import { TBank } from '../../model';

/**
 * Per-bank CSV import (see docs/cash-plan.md P4). An account's `bank` selects one
 * of these parsers; each owns its bank's column layout and quirks. Parsers are
 * pure `text -> rows` so they are trivially spec'd against the real example
 * exports (docs/example*.csv). Turning rows into `ICashTransaction`s (ids,
 * dedup, categorization) is `plan-import.ts`, kept separate so the parsers stay
 * format-only.
 */

export interface IParsedRow {
  dateISO: string;
  amountCents: number;
  description: string;
  rawDescription: string;
}

export interface IBankParser {
  readonly bank: TBank;
  readonly label: string;
  parse(text: string): IParsedRow[];
}

/** Non-empty, trimmed lines — tolerant of CRLF and a trailing newline. */
export function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** A `;`-delimited row split into trimmed fields. */
export function splitRow(line: string): string[] {
  return line.split(';').map((field) => field.trim());
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
