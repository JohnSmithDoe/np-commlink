import dayjs from 'dayjs';
import { createBaseItem, createTrackingItem } from './app.factory';

describe('app.factory', () => {
  describe('createBaseItem', () => {
    it('trims the name and stamps a valid createdAt', () => {
      const item = createBaseItem('  Groceries  ');
      expect(item.name).toBe('Groceries');
      expect(dayjs(item.createdAt).isValid()).toBe(true);
    });

    it('assigns a fresh id on every call', () => {
      expect(createBaseItem('a').id).not.toBe(createBaseItem('a').id);
      expect(createBaseItem('a').id).toBeTruthy();
    });

    it('wraps a single (trimmed) category string into an array', () => {
      expect(createBaseItem('Milk', ' Dairy ').category).toEqual(['Dairy']);
    });

    it('passes an array category through untouched', () => {
      expect(createBaseItem('Milk', ['A', 'B']).category).toEqual(['A', 'B']);
    });
  });

  describe('createTrackingItem', () => {
    it('starts in the stopped state with a base item', () => {
      const item = createTrackingItem('Deep work');
      expect(item.name).toBe('Deep work');
      expect(item.state).toBe('stopped');
      expect(item.id).toBeTruthy();
    });
  });
});
