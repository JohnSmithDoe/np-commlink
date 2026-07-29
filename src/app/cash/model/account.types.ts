import { TTimestamp } from '../../@shared/model/app.types';

// An offline, EUR, multi-account personal-finance ledger. Purpose-built (NOT the
// grocery IItemList engine): each account holds signed transactions denominated
// in INTEGER CENTS (never floats). See docs/project-summary.md §7.3.

export type TAccountKind = 'giro' | 'creditcard' | 'savings' | 'cash';
// Banks with a dedicated CSV import parser (cash/util/import). An account's
// `bank` implicitly selects its parser — see docs/project-summary.md §7.3 (Import).
export type TBank = 'volksbank' | 'dkb';

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
