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

export interface CashAccount extends BaseItem {
  kind: AccountKind;
  iban?: string;
  openingBalanceCents: number;
  openingDateISO: Timestamp;
  createdAt: Timestamp;
}
