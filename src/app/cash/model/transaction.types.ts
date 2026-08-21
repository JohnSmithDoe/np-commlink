/* ─── why ─────────────────────────────────────────────────────────
 * `name` carries what the bank called the booking — `description` before
 * this row joined `BaseItem`. It is the field every shared list utility
 * searches and sorts on, which is the whole reason for the rename.
 *
 * `dateISO` survives beside the inherited `createdAt` because they answer
 * different questions: when the money moved, versus when the row was
 * written down. An import backfills a year of the first in one afternoon
 * of the second, so collapsing them dates every statement the same day.
 *
 * `importKey` is what a second import recognises this row by — the
 * statement's own `AcctSvcrRef` where it carries one, a derived key where
 * it does not. Every IMPORTED row has one; it stays optional because a
 * manually typed row has no import identity to record, and expressing
 * "required only when source is imported" costs a split type that eleven
 * other call sites would have to narrow.
 * ───────────────────────────────────────────────────────────────── */
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Marker, Timestamp } from '../../@shared/model/app.types';
import { BaseItem } from '../../@shared/model/base-item.types';

export interface CamtDetails {
  counterpartyName?: string;
  counterpartyIban?: string;
  counterpartyBic?: string;
  remittanceInfo?: string;
  endToEndId?: string;
  mandateId?: string;
  purposeCode?: string;
  bankTxCode?: string;
  valueDateISO?: string;
}

type CashTransactionSource = 'imported' | 'manual';
export type CashTransactionStatus = 'pending' | 'confirmed';

export interface CashTransaction extends BaseItem, CamtDetails {
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
  importKey?: string;
}

export const CAMT_DETAIL_FIELDS: readonly (keyof CamtDetails)[] = [
  'counterpartyName',
  'counterpartyIban',
  'counterpartyBic',
  'remittanceInfo',
  'endToEndId',
  'mandateId',
  'purposeCode',
  'bankTxCode',
  'valueDateISO',
];

export const CAMT_DETAIL_LABEL_KEYS: Record<keyof CamtDetails, Marker> = {
  counterpartyName: marker('cash.camt.counterpartyName'),
  counterpartyIban: marker('cash.camt.counterpartyIban'),
  counterpartyBic: marker('cash.camt.counterpartyBic'),
  remittanceInfo: marker('cash.camt.remittanceInfo'),
  endToEndId: marker('cash.camt.endToEndId'),
  mandateId: marker('cash.camt.mandateId'),
  purposeCode: marker('cash.camt.purposeCode'),
  bankTxCode: marker('cash.camt.bankTxCode'),
  valueDateISO: marker('cash.camt.valueDateISO'),
};
