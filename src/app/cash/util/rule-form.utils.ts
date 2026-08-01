import { applyEach, SchemaFn, validate } from '@angular/forms/signals';
import { TLanguage } from '../../@shared/model/app.types';
import { requireText } from '../../@shared/util/forms/form-rules';
import {
  ICashFilterCondition,
  TAmountOp,
  TConditionForm,
  TDescriptionOp,
  TFilterOp,
  TRuleForm,
} from '../model/rule.types';
import { centsToInput, eurToCents } from './money.utils';

/**
 * The rule editor's op tables, validation schema and entity↔form mappers.
 *
 * Extracted from the modal component so `toStoredThreshold` — which carries the
 * non-obvious "a stored threshold is always German" invariant below — is
 * testable by a plain call rather than through `TestBed`.
 */

export const DESCRIPTION_OPS: readonly TDescriptionOp[] = [
  'contains',
  'startsWith',
  'endsWith',
  'equals',
  'regex',
];
export const AMOUNT_OPS: readonly TAmountOp[] = [
  'eq',
  'lt',
  'lte',
  'gt',
  'gte',
];

/** The ops a field admits — the select's options, and what a field switch resets to. */
export const opsFor = (
  field: 'description' | 'amount'
): readonly TFilterOp[] => (field === 'amount' ? AMOUNT_OPS : DESCRIPTION_OPS);

// Typed per field rather than as a `Record<TFilterField, TFilterOp>`: `TFilterOp`
// is the union of both op sets, so the looser type would happily file a numeric
// op under `description` — the exact swap this table exists to prevent.
export const DEFAULT_OP_BY_FIELD: {
  description: TDescriptionOp;
  amount: TAmountOp;
} = {
  description: 'contains',
  amount: 'eq',
};

const NO_CONDITIONS = { kind: 'noConditions' } as const;
export const UNPARSEABLE_AMOUNT = { kind: 'unparseableAmount' } as const;

// An unparseable amount threshold is its own kind for two reasons: only it earns
// a visible note, and `matchesAmountCondition` reads one as "never matches", so a
// rule saved with `abc` would sit in the list looking armed and never fire.
// A factory rather than a const because the amount threshold is validated in the
// language the user is typing: `12.34` is an amount under `en` and junk under
// `de`.
//
// The language arrives as a **thunk**, for the reason `requireUniqueName` takes
// its siblings as one: the base builds the field tree during its own field
// initialization, so this schema is applied before a subclass field like
// `#language` exists. Reading it inside the validator instead defers it to
// validation time, when it does.
export const ruleRulesFor =
  (language: () => TLanguage): SchemaFn<TRuleForm> =>
  (path) => {
    requireText(path.categoryId);
    validate(path.conditions, ({ value }) =>
      value().length === 0 ? NO_CONDITIONS : null
    );
    applyEach(path.conditions, (condition) => {
      requireText(condition.value);
      validate(condition.value, ({ value, valueOf }) => {
        const threshold = valueOf(condition.field) === 'amount';
        return threshold && eurToCents(value(), language()) === null
          ? UNPARSEABLE_AMOUNT
          : null;
      });
    });
  };

export const blankCondition = (): TConditionForm => ({
  field: 'description',
  op: 'contains',
  value: '',
  caseSensitive: false,
});

export const toConditionForm = ({
  field,
  op,
  value,
  caseSensitive,
}: ICashFilterCondition): TConditionForm => ({
  field,
  op,
  value,
  caseSensitive: caseSensitive ?? false,
});

const toStoredThreshold = (value: string, language: TLanguage): string => {
  const cents = eurToCents(value, language);
  return cents === null ? value.trim() : centsToInput(cents, 'de');
};

// The amount matcher ignores case-sensitivity, so a numeric condition must not
// carry a flag that can never apply. An amount is also normalized onto the
// canonical German storage form here: the matcher reads a stored threshold as
// German by construction (see `categorize.utils`), because the two conventions
// are ambiguous and a language switch must not re-interpret an existing rule.
export const toCondition = (
  { field, op, value, caseSensitive }: TConditionForm,
  language: TLanguage
): ICashFilterCondition =>
  field === 'amount'
    ? { field, op, value: toStoredThreshold(value, language) }
    : { field, op, value: value.trim(), caseSensitive };
