import { DeckState } from '../../model/deck.types';
import { DeckActions } from './deck.actions';
import { deckReducer, initialDeck } from './deck.reducer';

const stored: DeckState = {
  order: ['cash', 'shopping'],
  visibleEntries: ['cash', 'shopping'],
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

    it('discards a document from before the shape was inverted', () => {
      const legacy = {
        order: ['cash'],
        hiddenEntries: ['storage'],
      } as unknown as DeckState;

      expect(deckReducer(initialDeck, DeckActions.loaded(legacy))).toBe(
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
    expect(next.visibleEntries).toEqual(stored.visibleEntries);
  });

  describe('the factory default', () => {
    it('ships an empty deck, so the first choice belongs to the user', () => {
      expect(initialDeck.visibleEntries).toEqual([]);
    });
  });

  describe('toggleEntry', () => {
    it('hides a visible entry', () => {
      expect(
        deckReducer(stored, DeckActions.toggleEntry('shopping')).visibleEntries
      ).toEqual(['cash']);
    });

    it('shows one the factory default starts hidden', () => {
      expect(
        deckReducer(initialDeck, DeckActions.toggleEntry('ritual'))
          .visibleEntries
      ).toEqual(['ritual']);
    });

    it('hides a shown one again', () => {
      expect(
        deckReducer(stored, DeckActions.toggleEntry('cash')).visibleEntries
      ).toEqual(['shopping']);
    });
  });

  it('resets to the factory deck', () => {
    expect(deckReducer(stored, DeckActions.reset())).toEqual(initialDeck);
  });
});
