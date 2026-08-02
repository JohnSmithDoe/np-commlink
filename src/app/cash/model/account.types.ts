import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Marker, Timestamp } from '../../@shared/model/app.types';

export type AccountKind = 'giro' | 'creditcard' | 'savings' | 'cash';
export type Bank = 'volksbank' | 'dkb';

export const ACCOUNT_KIND_LABEL_KEYS: Record<AccountKind, Marker> = {
  giro: marker('cash.account.kind.giro'),
  creditcard: marker('cash.account.kind.creditcard'),
  savings: marker('cash.account.kind.savings'),
  cash: marker('cash.account.kind.cash'),
};

export const BANK_LABEL_KEYS: Record<Bank, Marker> = {
  volksbank: marker('cash.bank.volksbank'),
  dkb: marker('cash.bank.dkb'),
};

export interface CashAccount {
  id: string;
  name: string;
  kind: AccountKind;
  bank?: Bank;
  openingBalanceCents: number;
  openingDateISO: Timestamp;
  createdAt: Timestamp;
}
