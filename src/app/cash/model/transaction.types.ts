import { TTimestamp } from '../../@shared/model/app.types';
import { TCategoryId } from '../../@shared/model/category.types';

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
