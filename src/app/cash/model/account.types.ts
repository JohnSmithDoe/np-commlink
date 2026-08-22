import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Marker, Timestamp } from '../../@shared/model/app.types';
import { BaseItem } from '../../@shared/model/base-item.types';

export type AccountKind = 'giro' | 'creditcard' | 'savings' | 'cash';

export const ACCOUNT_KIND_LABEL_KEYS: Record<AccountKind, Marker> = {
  giro: marker('cash.account.kind.giro'),
  creditcard: marker('cash.account.kind.creditcard'),
  savings: marker('cash.account.kind.savings'),
  cash: marker('cash.account.kind.cash'),
};

export type PaymentMethod = 'cash' | 'card';

export const PAYMENT_METHOD_LABEL_KEYS: Record<PaymentMethod, Marker> = {
  cash: marker('cash.spend.method.cash'),
  card: marker('cash.spend.method.card'),
};

export const PAYMENT_METHOD_EMPTY_KEYS: Record<PaymentMethod, Marker> = {
  cash: marker('cash.spend.no-account.cash'),
  card: marker('cash.spend.no-account.card'),
};

export const ACCOUNT_KINDS_BY_METHOD: Record<
  PaymentMethod,
  readonly AccountKind[]
> = {
  cash: ['cash'],
  card: ['giro', 'creditcard'],
};

export interface CashAccount extends BaseItem {
  kind: AccountKind;
  iban?: string;
  openingBalanceCents: number;
  openingDateISO: Timestamp;
  createdAt: Timestamp;
  excludedFromAllowance?: boolean;
}
