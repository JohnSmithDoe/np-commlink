import { DeckState } from '../../model/deck.types';
import { DeckActions } from './deck.actions';
import { deckReducer, initialDeck } from './deck.reducer';

const stored: DeckState = {
  order: ['cash', 'shopping'],
  hiddenEntries: ['storage'],
  hiddenModules: ['trackplay'],
};

describe('deckReducer', () => {
  describe('loaded', () => {
    it('takes the persisted configuration', () => {
      expect(deckReducer(initialDeck, DeckActions.loaded(stored))).toEqual(
        stored
      );
    });

    it('keeps the factory deck when there is nothing on disk', () => {
      expect(deckReducer(initialDeck, DeckActions.loaded(null))).toBe(
        initialDeck
      );
    });
  });

  it('replaces the order wholesale, so a drag also normalizes a stale config', () => {
    const next = deckReducer(
      stored,
      DeckActions.reorder(['shopping', 'cash', 'storage'])
    );
    expect(next.order).toEqual(['shopping', 'cash', 'storage']);
    expect(next.hiddenEntries).toEqual(stored.hiddenEntries);
  });

  describe('toggleEntry', () => {
    it('hides a visible entry', () => {
      expect(
        deckReducer(initialDeck, DeckActions.toggleEntry('cash')).hiddenEntries
      ).toEqual(['cash']);
    });

    it('shows a hidden one again', () => {
      expect(
        deckReducer(stored, DeckActions.toggleEntry('storage')).hiddenEntries
      ).toEqual([]);
    });
  });

  describe('toggleModule', () => {
    it('hides a module without touching its entries', () => {
      const next = deckReducer(stored, DeckActions.toggleModule('household'));
      expect(next.hiddenModules).toEqual(['trackplay', 'household']);
      expect(next.hiddenEntries).toEqual(stored.hiddenEntries);
    });

    it('restores the per-entry choices when it is switched back on', () => {
      const off = deckReducer(stored, DeckActions.toggleModule('household'));
      const on = deckReducer(off, DeckActions.toggleModule('household'));
      expect(on).toEqual(stored);
    });
  });

  it('resets to the factory deck', () => {
    expect(deckReducer(stored, DeckActions.reset())).toEqual(initialDeck);
  });
});
