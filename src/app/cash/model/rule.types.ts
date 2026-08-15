/* ─── why ─────────────────────────────────────────────────────────
 * A rule keeps a singular `categoryId` and leaves the inherited
 * `categoryIds` unused, because the two mean opposite things: a
 * transaction IS TAGGED WITH its categories, a rule ASSIGNS one. On the
 * tag axis every rule would answer the filter bar and the "n items in this
 * category" count as though it were a row in that category.
 *
 * `FilterField` still says `'description'` because it names the BANK's
 * field, the one the user picks between, not our model's `name`. Renaming
 * would cost a migration to make the persisted rules read worse.
 * ───────────────────────────────────────────────────────────────── */
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Marker } from '../../@shared/model/app.types';
import { BaseItem } from '../../@shared/model/base-item.types';
import { CategoryId } from '../../@shared/model/category.types';

export type FilterField = 'description' | 'amount';
export type DescriptionOperation =
  'contains' | 'startsWith' | 'endsWith' | 'equals' | 'regex';
export type AmountOperation = 'eq' | 'lt' | 'lte' | 'gt' | 'gte';
export type FilterOperation = DescriptionOperation | AmountOperation;

export const OP_LABEL_KEYS: Record<FilterOperation, Marker> = {
  contains: marker('cash.op.contains'),
  startsWith: marker('cash.op.startsWith'),
  endsWith: marker('cash.op.endsWith'),
  equals: marker('cash.op.equals'),
  regex: marker('cash.op.regex'),
  eq: marker('cash.op.eq'),
  lt: marker('cash.op.lt'),
  lte: marker('cash.op.lte'),
  gt: marker('cash.op.gt'),
  gte: marker('cash.op.gte'),
};

export interface CashFilterCondition {
  field: FilterField;
  op: FilterOperation;
  value: string;
  caseSensitive?: boolean;
}

export interface CashRule extends BaseItem {
  order: number;
  match: 'all' | 'any';
  conditions: CashFilterCondition[];
  categoryId: CategoryId;
}

export type ConditionForm = {
  field: FilterField;
  op: FilterOperation;
  value: string;
  caseSensitive: boolean;
};

export type RuleForm = {
  name: string;
  match: 'all' | 'any';
  categoryId: CategoryId;
  conditions: ConditionForm[];
};
