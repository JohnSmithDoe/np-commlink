import {
  AMOUNT_OPS,
  blankCondition,
  defaultOpFor,
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

    it('defaults each field to an op that field admits', () => {
      expect(opsFor('description')).toContain(defaultOpFor('description'));
      expect(opsFor('amount')).toContain(defaultOpFor('amount'));
    });
  });

  describe('toConditionForm', () => {
    it('fills the optional case flag so the toggle has a boolean to bind', () => {
      expect(
        toConditionForm({
          field: 'description',
          op: 'contains',
          value: 'Nordkauf',
        }).caseSensitive
      ).toBe(false);
      expect(
        toConditionForm({
          field: 'description',
          op: 'contains',
          value: 'Nordkauf',
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
            value: '  Nordkauf  ',
            caseSensitive: true,
          },
          'de'
        )
      ).toEqual({
        field: 'description',
        op: 'contains',
        value: 'Nordkauf',
        caseSensitive: true,
      });
    });

    it('drops the case flag from an amount condition', () => {
      expect(toCondition(amount('12,34'), 'de')).not.toHaveProperty(
        'caseSensitive'
      );
    });

    it('normalizes the threshold onto German, whichever language it was typed in', () => {
      expect(toCondition(amount('12,34'), 'de').value).toBe('12,34');
      expect(toCondition(amount('12.34'), 'en').value).toBe('12,34');
      expect(toCondition(amount('1234.56'), 'en').value).toBe('1234,56');
    });

    it('keeps an unparseable threshold as typed', () => {
      expect(toCondition(amount('  abc '), 'de').value).toBe('abc');
    });
  });

  describe('blankCondition', () => {
    it('starts on a description with that field’s default op', () => {
      const blank = blankCondition();

      expect(blank.field).toBe('description');
      expect(blank.op).toBe(defaultOpFor('description'));
      expect(blank.value).toBe('');
      expect(blank.caseSensitive).toBe(false);
    });
  });
});
