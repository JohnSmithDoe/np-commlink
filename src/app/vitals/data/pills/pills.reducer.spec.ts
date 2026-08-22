import {
  mockPill,
  mockPillsState,
  mockProfile,
  mockProfilesState,
  mockVitalsState,
} from '../../testing/vitals.test-data';
import { ProfilesActions } from '../profiles/profiles.actions';
import { VitalsActions } from '../vitals.actions';
import { vitalsReducer } from '../vitals.reducer';
import { PillsActions } from './pills.actions';

const martin = mockProfile();
const ibu = mockPill({ id: 'ibu', name: 'Ibuprofen 400' });
const vitaminD = mockPill({ id: 'vit-d', name: 'Vitamin D' });

const withMartin = mockVitalsState({
  profiles: mockProfilesState([martin]),
});

describe('pillsReducer — slots', () => {
  it('hands each new pill the next slot', () => {
    const first = vitalsReducer(withMartin, PillsActions.addItem(ibu));
    const second = vitalsReducer(first, PillsActions.addItem(vitaminD));

    expect(second.pills.items.map((pill) => pill.slot)).toEqual([1, 0]);
    expect(second.pills.nextSlot).toBe(2);
  });

  it('never reissues the slot a deleted pill freed', () => {
    const both = vitalsReducer(
      vitalsReducer(withMartin, PillsActions.addItem(ibu)),
      PillsActions.addItem(vitaminD)
    );

    const deleted = vitalsReducer(both, PillsActions.removeItem(ibu));
    const replacement = vitalsReducer(
      deleted,
      PillsActions.addItem(mockPill({ id: 'asa', name: 'ASS 100' }))
    );

    expect(replacement.pills.items.map((pill) => pill.slot)).toEqual([2, 1]);
  });

  it('keeps the slot across an edit', () => {
    const added = vitalsReducer(withMartin, PillsActions.addItem(ibu));

    const renamed = vitalsReducer(
      added,
      PillsActions.updateItem({ ...ibu, name: 'Ibuprofen 600' })
    );

    expect(renamed.pills.items[0]?.slot).toBe(0);
    expect(renamed.pills.items[0]?.name).toBe('Ibuprofen 600');
  });
});

describe('pillsReducer — intakes', () => {
  const takenIbu = { ...ibu, slot: 0 };

  it('records and clears today’s tick', () => {
    const added = vitalsReducer(withMartin, PillsActions.addItem(ibu));

    const taken = vitalsReducer(
      added,
      PillsActions.setTaken(ibu.id, '2026-08-22', true)
    );
    expect(taken.intakes).toEqual([{ pillId: ibu.id, takenOn: '2026-08-22' }]);

    const untaken = vitalsReducer(
      taken,
      PillsActions.setTaken(ibu.id, '2026-08-22', false)
    );
    expect(untaken.intakes).toEqual([]);
  });

  it('does not record the same day twice', () => {
    const taken = vitalsReducer(
      withMartin,
      PillsActions.setTaken(ibu.id, '2026-08-22', true)
    );

    const again = vitalsReducer(
      taken,
      PillsActions.setTaken(ibu.id, '2026-08-22', true)
    );

    expect(again.intakes).toHaveLength(1);
  });

  it('takes a deleted pill’s intakes with it', () => {
    const state = mockVitalsState({
      profiles: mockProfilesState([martin]),
      pills: mockPillsState([takenIbu, vitaminD], { nextSlot: 2 }),
      intakes: [
        { pillId: ibu.id, takenOn: '2026-08-22' },
        { pillId: vitaminD.id, takenOn: '2026-08-22' },
      ],
    });

    const next = vitalsReducer(state, PillsActions.removeItem(takenIbu));

    expect(next.pills.items).toEqual([vitaminD]);
    expect(next.intakes).toEqual([
      { pillId: vitaminD.id, takenOn: '2026-08-22' },
    ]);
  });

  it('puts a pill and its intakes back on undo', () => {
    const state = mockVitalsState({
      profiles: mockProfilesState([martin]),
      pills: mockPillsState([takenIbu], { nextSlot: 1 }),
      intakes: [{ pillId: ibu.id, takenOn: '2026-08-22' }],
    });

    const deleted = vitalsReducer(state, PillsActions.removeItem(takenIbu));
    const restored = vitalsReducer(
      deleted,
      VitalsActions.restorePill(takenIbu, [
        { pillId: ibu.id, takenOn: '2026-08-22' },
      ])
    );

    expect(restored.pills.items).toEqual([takenIbu]);
    expect(restored.intakes).toEqual([
      { pillId: ibu.id, takenOn: '2026-08-22' },
    ]);
  });
});

describe('vitalsReducer — deleting a profile', () => {
  it('takes its pills and their intakes with it', () => {
    const cat = mockProfile({ id: 'cat', name: 'Katze', type: 'pet' });
    const catsPill = mockPill({
      id: 'worm',
      name: 'Wurmkur',
      profileId: 'cat',
      slot: 1,
    });

    const state = mockVitalsState({
      profiles: mockProfilesState([martin, cat]),
      pills: mockPillsState([{ ...ibu, slot: 0 }, catsPill], { nextSlot: 2 }),
      intakes: [
        { pillId: ibu.id, takenOn: '2026-08-22' },
        { pillId: catsPill.id, takenOn: '2026-08-22' },
      ],
    });

    const next = vitalsReducer(state, ProfilesActions.removeItem(cat));

    expect(next.pills.items.map((pill) => pill.id)).toEqual([ibu.id]);
    expect(next.intakes).toEqual([{ pillId: ibu.id, takenOn: '2026-08-22' }]);
  });
});
