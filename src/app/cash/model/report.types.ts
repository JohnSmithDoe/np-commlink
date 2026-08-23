/* ─── why ─────────────────────────────────────────────────────────
 * The scope labels are named here, beside the scopes themselves, so a fifth
 * window cannot be offered without a word for it or worded without being
 * offered — the same reason `OP_LABEL_KEYS` sits beside its operators.
 * ───────────────────────────────────────────────────────────────── */
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Marker } from '../../@shared/model/app.types';

export const REPORT_SCOPES = ['month', 'quarter', 'year', 'all'] as const;
export type ReportScope = (typeof REPORT_SCOPES)[number];

export const SCOPE_LABEL_KEYS: Record<ReportScope, Marker> = {
  month: marker('cash.report.scope.month'),
  quarter: marker('cash.report.scope.quarter'),
  year: marker('cash.report.scope.year'),
  all: marker('cash.report.scope.all'),
};

interface ReportTotals {
  incomeCents: number;
  spendCents: number;
  netCents: number;
}

export interface MonthTotals {
  month: string;
  incomeCents: number;
  spendCents: number;
}

interface CategorySpend {
  categoryId: string;
  category: string;
  cents: number;
}

interface ExpenseRow {
  id: string;
  name: string;
  dateISO: string;
  cents: number;
  category: string;
}

export interface CounterpartySpend {
  iban: string;
  name: string;
  cents: number;
}

interface UncategorizedShare {
  totalCents: number;
  uncategorizedCents: number;
  percent: number;
}

export interface CashReport {
  totals: ReportTotals;
  monthly: MonthTotals[];
  byCategory: CategorySpend[];
  biggest: ExpenseRow[];
  byCounterparty: CounterpartySpend[];
  uncategorized: UncategorizedShare;
}
