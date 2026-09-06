import { DeckState } from '../../model/deck.types';
import { DeckActions } from './deck.actions';
import { deckReducer, initialDeck } from './deck.reducer';

const stored: DeckState = {
  order: ['cash', 'shopping'],
  visibleEntries: ['cash', 'shopping'],
  hiddenTiles: ['cash'],
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

    it('reads a document written before tiles could be hidden', () => {
      const before = {
        order: ['cash'],
        visibleEntries: ['cash'],
      } as unknown as DeckState;

      expect(deckReducer(initialDeck, DeckActions.loaded(before))).toEqual({
        order: ['cash'],
        visibleEntries: ['cash'],
        hiddenTiles: [],
      });
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

    it('forgets a tile preference, so switching a program back on shows it', () => {
      const off = deckReducer(stored, DeckActions.toggleEntry('cash'));
      expect(off.hiddenTiles).toEqual([]);
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

  describe('setEntries', () => {
    it('adds a whole module without disturbing what is already shown', () => {
      expect(
        deckReducer(
          stored,
          DeckActions.setEntries(['cash', 'spending', 'burndown'], true)
        ).visibleEntries
      ).toEqual(['cash', 'shopping', 'spending', 'burndown']);
    });

    it('removes a whole module, ignoring the ids it never held', () => {
      expect(
        deckReducer(stored, DeckActions.setEntries(['cash', 'spending'], false))
          .visibleEntries
      ).toEqual(['shopping']);
    });

    it('forgets the tile preferences of every id it touches', () => {
      expect(
        deckReducer(stored, DeckActions.setEntries(['cash', 'spending'], true))
          .hiddenTiles
      ).toEqual([]);
    });
  });

  describe('toggleTile', () => {
    it('hides a tile without touching what the drawer shows', () => {
      const next = deckReducer(stored, DeckActions.toggleTile('shopping'));
      expect(next.hiddenTiles).toEqual(['cash', 'shopping']);
      expect(next.visibleEntries).toEqual(stored.visibleEntries);
    });

    it('shows a hidden one again', () => {
      expect(
        deckReducer(stored, DeckActions.toggleTile('cash')).hiddenTiles
      ).toEqual([]);
    });
  });

  it('resets to the factory deck', () => {
    expect(deckReducer(stored, DeckActions.reset())).toEqual(initialDeck);
  });
});
