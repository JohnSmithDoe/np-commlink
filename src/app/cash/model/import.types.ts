import { ScheduleAmountChange } from './schedule.types';
import { CashTransaction } from './transaction.types';

export interface ImportConfirmation {
  id: string;
  importKey: string;
  dateISO: string;
}

export interface ImportPlan {
  toImport: CashTransaction[];
  toConfirm: ImportConfirmation[];
  duplicates: number;
  rejected: number;
}

interface ImportPreviewRow {
  transaction: CashTransaction;
  categoryName: string;
}

interface AmountChangeRow {
  scheduleId: string;
  scheduleName: string;
  fromCents: number;
  toCents: number;
}

export interface CashImportPreview {
  accountId: string;
  plan: ImportPlan;
  rows: ImportPreviewRow[];
  sightings: ScheduleAmountChange[];
  amountChanges: AmountChangeRow[];
  hasWork: boolean;
  closingBalanceCents?: number;
  asOfISO?: string;
}
