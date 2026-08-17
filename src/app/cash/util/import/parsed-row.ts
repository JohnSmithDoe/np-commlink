import { CashTransactionStatus } from '../../model/transaction.types';

export interface ParsedEntry {
  dateISO: string;
  amountCents: number;
  description: string;
  status: CashTransactionStatus;
  bankRef?: string;
}

export interface ParsedRow extends ParsedEntry {
  key: string;
}

export interface EntryResult {
  entries: ParsedEntry[];
  rejected: number;
}

export interface ParseResult {
  rows: ParsedRow[];
  rejected: number;
}

export function joinDescription(counterparty: string, purpose: string): string {
  return [counterparty, purpose].filter((part) => part.length > 0).join(' — ');
}
