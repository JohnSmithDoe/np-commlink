import { Timestamp } from '../../@shared/model/app.types';
import { CategoryId } from '../../@shared/model/category.types';

type CashTransactionSource = 'imported' | 'manual';
export type CashTransactionStatus = 'pending' | 'confirmed';

export interface CashTransaction {
  id: string;
  accountId: string;
  dateISO: Timestamp;
  amountCents: number;
  description: string;
  categoryId?: CategoryId;
  categoryManual?: boolean;
  source: CashTransactionSource;
  status: CashTransactionStatus;
  matchedTxnId?: string;
  isTransfer?: boolean;
  transferGroupId?: string;
  importBatchId?: string;
}
