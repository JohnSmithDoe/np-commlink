import { applyEach, SchemaFn, validate } from '@angular/forms/signals';
import { Language } from '../../@shared/model/app.types';
import { requireText } from '../../@shared/util/forms/form-rules';
import {
  AmountOperation,
  CashFilterCondition,
  DescriptionOperation,
  FilterOperation,
  ConditionForm,
  RuleForm,
} from '../model/rule.types';
import { centsToInput, eurToCents } from './money.utils';

export const DESCRIPTION_OPS: readonly DescriptionOperation[] = [
  'contains',
  'startsWith',
  'endsWith',
  'equals',
  'regex',
];
export const AMOUNT_OPS: readonly AmountOperation[] = [
  'eq',
  'lt',
  'lte',
  'gt',
  'gte',
];

export const opsFor = (
  field: 'description' | 'amount'
): readonly FilterOperation[] =>
  field === 'amount' ? AMOUNT_OPS : DESCRIPTION_OPS;

export const DEFAULT_OP_BY_FIELD: {
  description: DescriptionOperation;
  amount: AmountOperation;
} = {
  description: 'contains',
  amount: 'eq',
};

const NO_CONDITIONS = { kind: 'noConditions' } as const;
export const UNPARSEABLE_AMOUNT = { kind: 'unparseableAmount' } as const;

export const ruleRulesFor =
  (language: () => Language): SchemaFn<RuleForm> =>
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

export const blankCondition = (): ConditionForm => ({
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
}: CashFilterCondition): ConditionForm => ({
  field,
  op,
  value,
  caseSensitive: caseSensitive ?? false,
});

const toStoredThreshold = (value: string, language: Language): string => {
  const cents = eurToCents(value, language);
  return cents === null ? value.trim() : centsToInput(cents, 'de');
};

export const toCondition = (
  { field, op, value, caseSensitive }: ConditionForm,
  language: Language
): CashFilterCondition =>
  field === 'amount'
    ? { field, op, value: toStoredThreshold(value, language) }
    : { field, op, value: value.trim(), caseSensitive };
