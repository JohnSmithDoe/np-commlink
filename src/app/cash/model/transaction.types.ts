/* ─── why ─────────────────────────────────────────────────────────
 * `name` carries what the bank called the booking — `description` before
 * this row joined `BaseItem`. It is the field every shared list utility
 * searches and sorts on, which is the whole reason for the rename.
 *
 * `dateISO` survives beside the inherited `createdAt` because they answer
 * different questions: when the money moved, versus when the row was
 * written down. An import backfills a year of the first in one afternoon
 * of the second, so collapsing them dates every statement the same day.
 * ───────────────────────────────────────────────────────────────── */
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Timestamp } from '../../@shared/model/app.types';
import { ItemListSortOption } from '../../@shared/model/item-list.types';
import { BaseItem } from '../../@shared/model/base-item.types';

type CashTransactionSource = 'imported' | 'manual';
export type CashTransactionStatus = 'pending' | 'confirmed';

export interface CashTransaction extends BaseItem {
  accountId: string;
  dateISO: Timestamp;
  amountCents: number;
  categoryManual?: boolean;
  source: CashTransactionSource;
  status: CashTransactionStatus;
  matchedTxnId?: string;
  isTransfer?: boolean;
  transferGroupId?: string;
  importBatchId?: string;
}

export const TRANSACTION_SORT_OPTIONS: readonly ItemListSortOption[] = [
  { type: 'dateISO', labelKey: marker('cash.list-toolbar.date') },
  { type: 'amountCents', labelKey: marker('cash.list-toolbar.amount') },
];
