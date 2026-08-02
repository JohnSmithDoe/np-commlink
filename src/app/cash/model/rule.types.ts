import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Marker } from '../../@shared/model/app.types';
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

export interface CashRule {
  id: string;
  order: number;
  name?: string;
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
