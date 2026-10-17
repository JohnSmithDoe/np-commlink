import {
  applyEach,
  SchemaFn,
  SchemaPathTree,
  validate,
} from '@angular/forms/signals';
import { Language } from '../../@shared/model/app.types';
import { requireText } from '../../@shared/util/forms/form-rules';
import {
  AmountOperation,
  CashFilterCondition,
  DescriptionOperation,
  FilterField,
  FilterOperation,
  isTextFilterField,
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

export const opsFor = (field: FilterField): readonly FilterOperation[] =>
  isTextFilterField(field) ? DESCRIPTION_OPS : AMOUNT_OPS;

export const defaultOpFor = (field: FilterField): FilterOperation =>
  isTextFilterField(field) ? 'contains' : 'eq';

const NO_CONDITIONS = { kind: 'noConditions' } as const;
export const UNPARSEABLE_AMOUNT = { kind: 'unparseableAmount' } as const;

export const conditionRulesFor = (language: () => Language) => {
  return (conditions: SchemaPathTree<RuleForm>['conditions']): void => {
    validate(conditions, ({ value }) =>
      value().length === 0 ? NO_CONDITIONS : null
    );
    applyEach(conditions, (condition) => {
      requireText(condition.value);
      validate(condition.value, ({ value, valueOf }) => {
        const isThreshold = valueOf(condition.field) === 'amount';
        return isThreshold && eurToCents(value(), language()) === null
          ? UNPARSEABLE_AMOUNT
          : null;
      });
    });
  };
};

export const ruleRulesFor = (language: () => Language): SchemaFn<RuleForm> => {
  return (path) => {
    requireText(path.categoryId);
    conditionRulesFor(language)(path.conditions);
  };
};

export const blankCondition = (): ConditionForm => {
  return {
    field: 'description',
    op: 'contains',
    value: '',
    caseSensitive: false,
  };
};

const toShownThreshold = (stored: string, language: Language): string => {
  const cents = eurToCents(stored);
  return cents === null ? stored : centsToInput(cents, language);
};

export const toConditionForm = (
  { field, op, value, caseSensitive = false }: CashFilterCondition,
  language: Language
): ConditionForm => {
  return {
    field,
    op,
    value: isTextFilterField(field) ? value : toShownThreshold(value, language),
    caseSensitive,
  };
};

const toStoredThreshold = (value: string, language: Language): string => {
  const cents = eurToCents(value, language);
  return cents === null ? value.trim() : centsToInput(cents);
};

export const toCondition = (
  { field, op, value, caseSensitive }: ConditionForm,
  language: Language
): CashFilterCondition => {
  return isTextFilterField(field)
    ? { field, op, value: value.trim(), caseSensitive }
    : { field, op, value: toStoredThreshold(value, language) };
};
