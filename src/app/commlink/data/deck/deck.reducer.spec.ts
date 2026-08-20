import { DECK_CATALOG } from '../../model/deck.catalog';
import { DeckState } from '../../model/deck.types';
import { DeckActions } from './deck.actions';
import { deckReducer, initialDeck } from './deck.reducer';

const stored: DeckState = {
  order: ['cash', 'shopping'],
  hiddenEntries: ['storage'],
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

  describe('the factory default', () => {
    it('ships an empty deck, so the first choice belongs to the user', () => {
      expect(initialDeck.hiddenEntries).toEqual(
        DECK_CATALOG.map((entry) => entry.id)
      );
    });
  });

  describe('toggleEntry', () => {
    it('hides a visible entry', () => {
      expect(
        deckReducer(stored, DeckActions.toggleEntry('shopping')).hiddenEntries
      ).toEqual(['storage', 'shopping']);
    });

    it('shows one the factory default starts hidden', () => {
      expect(
        deckReducer(initialDeck, DeckActions.toggleEntry('ritual'))
          .hiddenEntries
      ).not.toContain('ritual');
    });

    it('shows a hidden one again', () => {
      expect(
        deckReducer(stored, DeckActions.toggleEntry('storage')).hiddenEntries
      ).toEqual([]);
    });
  });

  it('resets to the factory deck', () => {
    expect(deckReducer(stored, DeckActions.reset())).toEqual(initialDeck);
  });
});
