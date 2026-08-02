import dayjs from 'dayjs';
import { createBaseItem } from './app.factory';

describe('app.factory', () => {
  describe('createBaseItem', () => {
    it('trims the name and stamps a valid createdAt', () => {
      const item = createBaseItem('  Household  ');
      expect(item.name).toBe('Household');
      expect(dayjs(item.createdAt).isValid()).toBe(true);
    });

    it('assigns a fresh id on every call', () => {
      expect(createBaseItem('a').id).not.toBe(createBaseItem('a').id);
      expect(createBaseItem('a').id).toBeTruthy();
    });

    it('wraps a single category id into an array', () => {
      expect(createBaseItem('Milk', 'c-dairy').categoryIds).toEqual([
        'c-dairy',
      ]);
    });

    it('passes an array of category ids through untouched', () => {
      expect(createBaseItem('Milk', ['c-a', 'c-b']).categoryIds).toEqual([
        'c-a',
        'c-b',
      ]);
    });

    it('leaves categoryIds undefined when no category is given', () => {
      expect(createBaseItem('Milk').categoryIds).toBeUndefined();
    });
  });
});
