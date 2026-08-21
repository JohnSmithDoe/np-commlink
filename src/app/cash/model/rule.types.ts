/* ─── why ─────────────────────────────────────────────────────────
 * A rule keeps a singular `categoryId` and leaves the inherited
 * `categoryIds` unused, because the two mean opposite things: a
 * transaction IS TAGGED WITH its categories, a rule ASSIGNS one. On the
 * tag axis every rule would answer the filter bar and the "n items in this
 * category" count as though it were a row in that category.
 *
 * Every `FilterField` names the BANK's field, not our model's — `'description'`
 * rather than `name`, and the camt spelling for the rest. That is the
 * vocabulary the user picks from, and renaming would cost a migration to
 * make the persisted rules read worse.
 *
 * `TEXT_FILTER_FIELDS` is the source both the operator list and the matcher
 * read, so a field added to it cannot be matchable without being offered or
 * offered without being matchable.
 *
 * Only `description` and `amount` are named here. The camt fields are named
 * once, by `CAMT_DETAIL_LABEL_KEYS`, where the reader of a booking and the
 * writer of a rule pick the SAME word for the same field — two maps would be
 * two wordings for `MndtId` waiting to disagree.
 * ───────────────────────────────────────────────────────────────── */
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Marker } from '../../@shared/model/app.types';
import { BaseItem } from '../../@shared/model/base-item.types';
import { CategoryId } from '../../@shared/model/category.types';
import { CAMT_DETAIL_LABEL_KEYS, CamtDetails } from './transaction.types';

export const TEXT_FILTER_FIELDS = [
  'description',
  'counterpartyName',
  'counterpartyIban',
  'counterpartyBic',
  'remittanceInfo',
  'endToEndId',
  'mandateId',
  'purposeCode',
  'bankTxCode',
] as const satisfies readonly ('description' | keyof CamtDetails)[];

export type TextFilterField = (typeof TEXT_FILTER_FIELDS)[number];
export type FilterField = TextFilterField | 'amount';

export const isTextFilterField = (
  field: FilterField
): field is TextFilterField => field !== 'amount';

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

export const FIELD_LABEL_KEYS: Record<FilterField, Marker> = {
  ...CAMT_DETAIL_LABEL_KEYS,
  description: marker('cash.field.description'),
  amount: marker('cash.field.amount'),
};

export interface CashFilterCondition {
  field: FilterField;
  op: FilterOperation;
  value: string;
  caseSensitive?: boolean;
}

export interface ConditionSet {
  match: 'all' | 'any';
  conditions: readonly CashFilterCondition[];
}

export interface CashRule extends BaseItem, ConditionSet {
  order: number;
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
