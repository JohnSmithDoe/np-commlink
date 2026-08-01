import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TMarker, TTimestamp } from '../../@shared/model/app.types';

// An offline, EUR, multi-account personal-finance ledger. Purpose-built (NOT the
// grocery IItemList engine): each account holds signed transactions denominated
// in INTEGER CENTS (never floats). See docs/cash.md §7.3.

export type TAccountKind = 'giro' | 'creditcard' | 'savings' | 'cash';
// Banks with a dedicated CSV import parser (cash/util/import). An account's
// `bank` implicitly selects its parser — see docs/cash.md §7.3 (Import).
export type TBank = 'volksbank' | 'dkb';

// Keyed by their unions so a new kind or bank cannot ship without a label. They
// live beside the unions rather than in a component because TWO surfaces render
// the kind label (the edit modal's picker and the accounts list), and the keys are
// spelled out because a composed `'cash.account.kind.' + k` is invisible to
// `i18n:extract --clean`.
export const ACCOUNT_KIND_LABEL_KEYS: Record<TAccountKind, TMarker> = {
  giro: marker('cash.account.kind.giro'),
  creditcard: marker('cash.account.kind.creditcard'),
  savings: marker('cash.account.kind.savings'),
  cash: marker('cash.account.kind.cash'),
};

export const BANK_LABEL_KEYS: Record<TBank, TMarker> = {
  volksbank: marker('cash.bank.volksbank'),
  dkb: marker('cash.bank.dkb'),
};

export interface ICashAccount {
  id: string;
  name: string;
  kind: TAccountKind;
  // Optional: selects the CSV import parser. A manual-only account has none.
  bank?: TBank;
  // Opening balance in integer cents as of `openingDateISO`; the running
  // balance is `openingBalanceCents + Σ signed transaction amounts`.
  openingBalanceCents: number;
  openingDateISO: TTimestamp;
  createdAt: TTimestamp;
}
