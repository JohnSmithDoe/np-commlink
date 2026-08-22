import { mockReading, mockReadingsState } from '../../testing/vitals.test-data';
import {
  selectReadingsListItems,
  selectRouteProfileReadings,
  selectRouteProfileSeries,
} from './readings.selector';

const mine = mockReading({ id: 'mine', name: '2026-08-20' });
const older = mockReading({ id: 'older', name: '2026-08-01', grams: 78_900 });
const cats = mockReading({ id: 'cats', name: '2026-08-20', profileId: 'cat' });

const readings = [mine, older, cats];

describe('selectRouteProfileReadings', () => {
  it('narrows the flat list to the profile in the route', () => {
    expect(
      selectRouteProfileReadings.projector(readings, 'cat').map(({ id }) => id)
    ).toEqual(['cats']);
  });

  it('shows nothing while no profile is routed', () => {
    expect(selectRouteProfileReadings.projector(readings, undefined)).toEqual(
      []
    );
  });
});

describe('selectReadingsListItems', () => {
  it('orders a profile’s readings newest first', () => {
    const items = selectReadingsListItems.projector(
      mockReadingsState([mine, older]),
      undefined
    );

    expect(items.map(({ id }) => id)).toEqual(['mine', 'older']);
  });
});

describe('selectRouteProfileSeries', () => {
  it('hands the chart the same readings oldest first', () => {
    expect(
      selectRouteProfileSeries.projector([mine, older]).map(({ id }) => id)
    ).toEqual(['older', 'mine']);
  });
});
