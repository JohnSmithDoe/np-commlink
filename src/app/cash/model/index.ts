import { ICategory, TCategoryId, TTimestamp } from '../../@shared/model/types';

// The `cash` bounded context owns its model (DDD review #1 — the god
// `@shared/types` file is being split so each context holds its own types).
// An offline, EUR, multi-account personal-finance ledger. Purpose-built (NOT the
// grocery IItemList engine): each account holds signed transactions denominated
// in INTEGER CENTS (never floats). Ordered, email-style filter rules assign a
// category to each transaction; a manual category override wins and is shielded
// from rule re-runs. See docs/cash-plan.md.

export type TAccountKind = 'giro' | 'creditcard' | 'savings' | 'cash';
// Banks with a dedicated CSV import parser (cash/util/import). An account's
// `bank` implicitly selects its parser — see docs/cash-plan.md P4.
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

export type TCashTxnSource = 'imported' | 'manual';
export type TCashTxnStatus = 'pending' | 'confirmed';

export interface ICashTransaction {
  id: string;
  accountId: string;
  dateISO: TTimestamp;
  // Signed integer cents: < 0 = outflow (spending), > 0 = inflow (income).
  amountCents: number;
  description: string;
  // Original bank text (kept verbatim from import for rule matching + audit).
  rawDescription?: string;
  // Category reference by id into ICashState.categories ({id,name} objects).
  categoryId?: TCategoryId;
  // Manual overrides win: rule re-runs skip transactions flagged here.
  categoryManual?: boolean;
  source: TCashTxnSource;
  // A manual card spend is `pending` until a later import reconciles it.
  status: TCashTxnStatus;
  // Reconciliation: the imported txn a pending manual entry merged into.
  matchedTxnId?: string;
  // Transfer legs are excluded from spend/income totals.
  isTransfer?: boolean;
  // The two legs of one transfer share this id (distinct from matchedTxnId,
  // which is reconciliation). Deleting either leg deletes the whole group.
  transferGroupId?: string;
  importBatchId?: string;
}

// Email-style categorization filter. A rule fires when its conditions match
// (`all` = AND, `any` = OR), assigning `category`. Rules are ordered and the
// first matching rule wins. Ops are split by field: string ops apply to
// `description`, numeric ops to `amount` (matched against signed cents — see
// cash/util/categorize.ts and docs/cash-plan.md).
export type TFilterField = 'description' | 'amount';
export type TDescriptionOp =
  'contains' | 'startsWith' | 'endsWith' | 'equals' | 'regex';
export type TAmountOp = 'eq' | 'lt' | 'lte' | 'gt' | 'gte';
export type TFilterOp = TDescriptionOp | TAmountOp;

export interface ICashFilterCondition {
  field: TFilterField;
  op: TFilterOp;
  value: string;
  caseSensitive?: boolean;
}

export interface ICashRule {
  id: string;
  order: number;
  name?: string;
  match: 'all' | 'any';
  conditions: ICashFilterCondition[];
  // The category id this rule assigns (references ICashState.categories).
  categoryId: TCategoryId;
}

export interface ICashState {
  accounts: ICashAccount[];
  transactions: ICashTransaction[];
  rules: ICashRule[];
  // First-class {id,name} catalog; txns/rules reference entries by id.
  categories: ICategory[];
}
