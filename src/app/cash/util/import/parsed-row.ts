/* ─── why ─────────────────────────────────────────────────────────
 * `description` survives beside the structured parts it was built from, but
 * no longer as the row's name — `plan-import.ts` names a booking after the
 * counterparty. What is left is one job: it is the string a DERIVED key is
 * built from, the whole statement line, so two rows the bank did not
 * reference are told apart by everything it wrote about them rather than by
 * whichever part happens to be displayed.
 * ───────────────────────────────────────────────────────────────── */
import {
  CamtDetails,
  CashTransactionStatus,
} from '../../model/transaction.types';

export interface ParsedEntry extends CamtDetails {
  dateISO: string;
  amountCents: number;
  description: string;
  status: CashTransactionStatus;
  bankRef?: string;
}

export interface ParsedRow extends ParsedEntry {
  derivedKey: string;
}

export const importKeyOf = (row: ParsedRow): string =>
  row.bankRef ?? row.derivedKey;

export interface EntryResult {
  entries: ParsedEntry[];
  rejected: number;
}

export interface ParseResult {
  rows: ParsedRow[];
  rejected: number;
  closingBalanceCents?: number;
}

export function joinDescription(counterparty: string, purpose: string): string {
  return [counterparty, purpose].filter((part) => part.length > 0).join(' — ');
}
