import { MigrationStep, runMigrations, wrapVersioned } from './versioned';

const addB: MigrationStep = (d) => ({ ...(d as object), b: 2 });
const addC: MigrationStep = (d) => ({ ...(d as object), c: 3 });
const boom: MigrationStep = () => {
  throw new Error('bad migration');
};

describe('versioned', () => {
  describe('wrapVersioned', () => {
    it('tags a value with its schema version', () => {
      expect(wrapVersioned(3, { a: 1 })).toEqual({ v: 3, data: { a: 1 } });
    });
  });

  describe('runMigrations', () => {
    it('returns null for an absent key so the reducer falls back to initialState', () => {
      expect(runMigrations(null, 1, [])).toBeNull();
      expect(runMigrations(undefined, 1, [])).toBeNull();
    });

    it('round-trips a wrapped doc at the current version untouched', () => {
      const wrapped = wrapVersioned(1, { a: 1 });
      expect(runMigrations(wrapped, 1, [])).toEqual({ a: 1 });
    });

    it('treats a legacy bare doc (no envelope) as version 1', () => {
      expect(runMigrations({ a: 1 }, 2, [addB])).toEqual({ a: 1, b: 2 });
    });

    it('migrates a wrapped doc forward across the ladder', () => {
      const v1 = wrapVersioned(1, { a: 1 });
      expect(runMigrations(v1, 3, [addB, addC])).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('applies only the steps above the stored version', () => {
      const v2 = wrapVersioned(2, { a: 1, b: 2 });
      expect(runMigrations(v2, 3, [addB, addC])).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('never downgrades a doc newer than the code expects', () => {
      const v3 = wrapVersioned(3, { a: 1 });
      expect(runMigrations(v3, 2, [addB])).toEqual({ a: 1 });
    });

    it('passes through a hop with no registered step', () => {
      expect(runMigrations(wrapVersioned(1, { a: 1 }), 3, [addB])).toEqual({
        a: 1,
        b: 2,
      });
    });

    it('propagates a throwing step (caller loads empty, non-destructive)', () => {
      expect(() =>
        runMigrations(wrapVersioned(1, { a: 1 }), 2, [boom])
      ).toThrow('bad migration');
    });
  });
});
