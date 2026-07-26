import { TCategoryId } from '../../@shared/model/category.types';

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
