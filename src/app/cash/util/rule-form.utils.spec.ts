import {
  AMOUNT_OPS,
  blankCondition,
  DEFAULT_OP_BY_FIELD,
  DESCRIPTION_OPS,
  opsFor,
  toCondition,
  toConditionForm,
} from './rule-form.utils';

const amount = (value: string) => ({
  field: 'amount' as const,
  op: 'gt' as const,
  value,
  caseSensitive: true,
});

describe('rule-form.utils', () => {
  describe('opsFor', () => {
    it('offers numeric ops for an amount and string ops for a description', () => {
      expect(opsFor('amount')).toBe(AMOUNT_OPS);
      expect(opsFor('description')).toBe(DESCRIPTION_OPS);
    });

    // A field switch resets the op, so the default has to be in the set the
    // field admits — otherwise the rule sits armed and can never match.
    it('defaults each field to an op that field admits', () => {
      expect(opsFor('description')).toContain(DEFAULT_OP_BY_FIELD.description);
      expect(opsFor('amount')).toContain(DEFAULT_OP_BY_FIELD.amount);
    });
  });

  describe('toConditionForm', () => {
    it('fills the optional case flag so the toggle has a boolean to bind', () => {
      expect(
        toConditionForm({ field: 'description', op: 'contains', value: 'Rewe' })
          .caseSensitive
      ).toBe(false);
      expect(
        toConditionForm({
          field: 'description',
          op: 'contains',
          value: 'Rewe',
          caseSensitive: true,
        }).caseSensitive
      ).toBe(true);
    });
  });

  describe('toCondition', () => {
    it('trims a description and keeps its case flag', () => {
      expect(
        toCondition(
          {
            field: 'description',
            op: 'contains',
            value: '  Rewe  ',
            caseSensitive: true,
          },
          'de'
        )
      ).toEqual({
        field: 'description',
        op: 'contains',
        value: 'Rewe',
        caseSensitive: true,
      });
    });

    // The amount matcher ignores case, so a numeric condition must not carry a
    // flag that can never apply.
    it('drops the case flag from an amount condition', () => {
      expect(toCondition(amount('12,34'), 'de')).not.toHaveProperty(
        'caseSensitive'
      );
    });

    // The invariant this extraction exists to make testable: a threshold is
    // stored in German whatever the user typed it in, because the matcher reads
    // it as German by construction and the two conventions are ambiguous — so a
    // language switch must not re-interpret a rule that already exists.
    it('normalizes the threshold onto German, whichever language it was typed in', () => {
      expect(toCondition(amount('12,34'), 'de').value).toBe('12,34');
      expect(toCondition(amount('12.34'), 'en').value).toBe('12,34');
      expect(toCondition(amount('1234.56'), 'en').value).toBe('1234,56');
    });

    // An unparseable threshold is kept verbatim rather than coerced: the schema
    // refuses to save it, so this path only matters if one ever slips past.
    it('keeps an unparseable threshold as typed', () => {
      expect(toCondition(amount('  abc '), 'de').value).toBe('abc');
    });
  });

  describe('blankCondition', () => {
    it('starts on a description with that field’s default op', () => {
      const blank = blankCondition();

      expect(blank.field).toBe('description');
      expect(blank.op).toBe(DEFAULT_OP_BY_FIELD.description);
      expect(blank.value).toBe('');
      expect(blank.caseSensitive).toBe(false);
    });
  });
});
