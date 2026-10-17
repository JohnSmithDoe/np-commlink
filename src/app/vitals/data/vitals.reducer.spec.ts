import {
  mockPill,
  mockPillsState,
  mockProfilesState,
  mockReading,
  mockReadingsState,
  mockVitalsState,
} from '../testing/vitals.test-data';
import { VitalsState } from '../model/vitals.types';
import { ProfilesActions } from './profiles/profiles.actions';
import { ReadingsActions } from './readings/readings.actions';
import { VitalsActions } from './vitals.actions';
import { vitalsReducer } from './vitals.reducer';

const mine = mockReading({ id: 'mine' });

describe('vitalsReducer — profiles', () => {
  it('keeps one astro override per person, replacing the last', () => {
    const first = vitalsReducer(
      mockVitalsState(),
      ProfilesActions.setAstro('martin', { sun: 'leo' })
    );
    const second = vitalsReducer(
      first,
      ProfilesActions.setAstro('martin', { ascendant: 'aries' })
    );

    expect(second.profiles.astro).toEqual({
      martin: { ascendant: 'aries' },
    });
  });

  it('stars exactly one person', () => {
    const first = vitalsReducer(
      mockVitalsState(),
      ProfilesActions.setFavorite('ann')
    );
    const second = vitalsReducer(first, ProfilesActions.setFavorite('bo'));

    expect(second.profiles.favoriteId).toBe('bo');
  });
});

describe('vitalsReducer — readings', () => {
  it('adds and removes a reading', () => {
    const added = vitalsReducer(
      mockVitalsState(),
      ReadingsActions.addItem(mine)
    );
    expect(added.readings.items).toEqual([mine]);

    const removed = vitalsReducer(added, ReadingsActions.removeItem(mine));
    expect(removed.readings.items).toEqual([]);
  });

  it('updates the reading carrying a known id', () => {
    const added = vitalsReducer(
      mockVitalsState(),
      ReadingsActions.addItem(mine)
    );

    const next = vitalsReducer(
      added,
      ReadingsActions.updateItem({ ...mine, grams: 77_000 })
    );

    expect(next.readings.items).toEqual([{ ...mine, grams: 77_000 }]);
  });
});

describe('vitalsReducer — hydration', () => {
  it('drops a restored search query, so a list opens unfiltered', () => {
    const next = vitalsReducer(
      undefined,
      VitalsActions.loaded(
        mockVitalsState({
          profiles: mockProfilesState({
            searchQuery: 'mar',
            astro: { martin: { sun: 'leo' } },
          }),
          readings: mockReadingsState([mine], { searchQuery: '2026' }),
        })
      )
    );

    expect(next.profiles.astro).toEqual({ martin: { sun: 'leo' } });
    expect(next.profiles.searchQuery).toBeUndefined();
    expect(next.readings.searchQuery).toBeUndefined();
  });

  it('starts empty on a cold install', () => {
    const next = vitalsReducer(undefined, VitalsActions.loaded(null));

    expect(next.profiles.astro).toEqual({});
    expect(next.readings.items).toEqual([]);
  });
});

describe('vitalsReducer — the roster BIOMON used to own', () => {
  it('resets a stored profile list instead of carrying it forward', () => {
    const legacy = {
      ...mockVitalsState({ readings: mockReadingsState([mine]) }),
      profiles: {
        id: '_vitals-profiles',
        items: [{ id: 'martin', name: 'Martin', type: 'person' }],
        sort: { sortBy: 'name', sortDirection: 'asc' },
      },
    } as unknown as VitalsState;

    const next = vitalsReducer(undefined, VitalsActions.loaded(legacy));

    expect(next.profiles).toEqual(mockProfilesState());
    expect(next.readings.items).toEqual([mine]);
  });
});

describe('vitalsReducer — sweeping orphans', () => {
  it("drops a removed person's readings, pills, intakes, signs and star", () => {
    const keptPill = mockPill({ id: 'kept', profileId: 'ann' });
    const lostPill = mockPill({ id: 'lost', profileId: 'carl' });
    const state = mockVitalsState({
      profiles: mockProfilesState({
        astro: { ann: { sun: 'leo' }, carl: { sun: 'aries' } },
        favoriteId: 'carl',
      }),
      readings: mockReadingsState([
        mockReading({ id: 'a', profileId: 'ann' }),
        mockReading({ id: 'c', profileId: 'carl' }),
      ]),
      pills: mockPillsState([keptPill, lostPill], { nextSlot: 2 }),
      intakes: [
        { pillId: 'kept', takenOn: '2026-10-01' },
        { pillId: 'lost', takenOn: '2026-10-01' },
      ],
    });

    const swept = vitalsReducer(state, VitalsActions.sweepOrphans(['ann']));

    expect(swept.readings.items.map(({ id }) => id)).toEqual(['a']);
    expect(swept.pills.items).toEqual([keptPill]);
    expect(swept.pills.nextSlot).toBe(2);
    expect(swept.intakes).toEqual([{ pillId: 'kept', takenOn: '2026-10-01' }]);
    expect(swept.profiles.astro).toEqual({ ann: { sun: 'leo' } });
    expect(swept.profiles.favoriteId).toBeUndefined();
  });
});
