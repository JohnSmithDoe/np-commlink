import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TMarker } from '../../@shared/model/app.types';
import { TCategoryId } from '../../@shared/model/category.types';

// Email-style categorization filter. A rule fires when its conditions match
// (`all` = AND, `any` = OR), assigning `categoryId`. Rules are ordered and the
// first matching rule wins. Ops are split by field: string ops apply to
// `description`, numeric ops to `amount` (matched against signed cents — see
// cash/util/categorize.utils.ts and docs/cash.md §7.3).
export type TFilterField = 'description' | 'amount';
export type TDescriptionOp =
  'contains' | 'startsWith' | 'endsWith' | 'equals' | 'regex';
export type TAmountOp = 'eq' | 'lt' | 'lte' | 'gt' | 'gte';
export type TFilterOp = TDescriptionOp | TAmountOp;

// Keyed by the union so a new op cannot ship without a label, and spelled out as
// `marker(...)` literals because the template reads them through a lookup: the
// composed `'cash.op.' + op` this replaces was invisible to the extractor, which
// is why it needed a hand-maintained list of bare `marker()` calls that nothing
// tied to the union — add an op, forget the marker, and `--clean` prunes the key.
export const OP_LABEL_KEYS: Record<TFilterOp, TMarker> = {
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

// ── the editor's view-models ─────────────────────────────────────────────────
// Not copies of the two above, which is the whole reason they exist: the form
// needs a field for every control to bind to, and the entity has two it does not
// offer. `caseSensitive` is optional on the condition but always a boolean here,
// so the toggle has something to write; `name` is optional on the rule but always
// a string. The conditions are copied besides, so a cancel discards the edits.
// Mapping between the two pairs is `cash/util/rule-form.utils.ts`.
export type TConditionForm = {
  field: TFilterField;
  op: TFilterOp;
  value: string;
  caseSensitive: boolean;
};

export type TRuleForm = {
  name: string;
  match: 'all' | 'any';
  // '' = none.
  categoryId: TCategoryId;
  conditions: TConditionForm[];
};
