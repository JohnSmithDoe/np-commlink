import {
  mockProfile,
  mockProfilesState,
  mockReading,
  mockReadingsState,
  mockVitalsState,
} from '../testing/vitals.test-data';
import { ProfilesActions } from './profiles/profiles.actions';
import { ReadingsActions } from './readings/readings.actions';
import { VitalsActions } from './vitals.actions';
import { vitalsReducer } from './vitals.reducer';

const martin = mockProfile();
const cat = mockProfile({ id: 'cat', name: 'Katze', type: 'pet' });
const mine = mockReading({ id: 'mine' });
const cats = mockReading({ id: 'cats', profileId: 'cat', grams: 4300 });

const stateWithBoth = mockVitalsState({
  profiles: mockProfilesState([martin, cat]),
  readings: mockReadingsState([mine, cats]),
});

describe('vitalsReducer — deleting a profile', () => {
  it('takes that profile’s readings with it and leaves the others', () => {
    const next = vitalsReducer(stateWithBoth, ProfilesActions.removeItem(cat));

    expect(next.profiles.items).toEqual([martin]);
    expect(next.readings.items).toEqual([mine]);
  });

  it('puts the profile and its history back on restore', () => {
    const deleted = vitalsReducer(
      stateWithBoth,
      ProfilesActions.removeItem(cat)
    );

    const restored = vitalsReducer(
      deleted,
      VitalsActions.restoreProfile(cat, [cats])
    );

    expect(restored.profiles.items).toContainEqual(cat);
    expect(restored.readings.items).toContainEqual(cats);
  });
});

describe('vitalsReducer — readings', () => {
  it('adds and removes a reading without touching the roster', () => {
    const added = vitalsReducer(
      mockVitalsState({ profiles: mockProfilesState([martin]) }),
      ReadingsActions.addItem(mine)
    );
    expect(added.readings.items).toEqual([mine]);

    const removed = vitalsReducer(added, ReadingsActions.removeItem(mine));
    expect(removed.readings.items).toEqual([]);
    expect(removed.profiles.items).toEqual([martin]);
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
      VitalsActions.loaded({
        profiles: mockProfilesState([martin], { searchQuery: 'mar' }),
        readings: mockReadingsState([mine], { searchQuery: '2026' }),
      })
    );

    expect(next.profiles.items).toEqual([martin]);
    expect(next.profiles.searchQuery).toBeUndefined();
    expect(next.readings.searchQuery).toBeUndefined();
  });

  it('keeps the empty roster a cold install ships', () => {
    const next = vitalsReducer(undefined, VitalsActions.loaded(null));

    expect(next.profiles.items).toEqual([]);
    expect(next.readings.items).toEqual([]);
  });
});
