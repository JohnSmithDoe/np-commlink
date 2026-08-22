import { mockProfile, mockReading } from '../../testing/vitals.test-data';
import {
  selectPersonProfiles,
  selectProfileSummaries,
  selectRouteProfile,
} from './profiles.selector';

const martin = mockProfile();
const cat = mockProfile({ id: 'cat', name: 'Katze', type: 'pet' });

describe('selectPersonProfiles', () => {
  it('offers only people as the holder of a co-weighed pet', () => {
    expect(
      selectPersonProfiles.projector([martin, cat]).map(({ id }) => id)
    ).toEqual(['profile-1']);
  });
});

describe('selectRouteProfile', () => {
  it('resolves the id in the route', () => {
    expect(selectRouteProfile.projector([martin, cat], 'cat')).toBe(cat);
  });
});

describe('selectProfileSummaries', () => {
  it('summarises every profile, weighed or not', () => {
    const summaries = selectProfileSummaries.projector(
      [martin, cat],
      [
        mockReading({ id: 'a', name: '2026-08-01', grams: 78_000 }),
        mockReading({ id: 'b', name: '2026-08-02', grams: 77_800 }),
      ]
    );

    expect(summaries['profile-1']).toEqual({
      count: 2,
      latestGrams: 77_800,
      deltaGrams: -200,
    });
    expect(summaries['cat']).toEqual({ count: 0 });
  });
});
