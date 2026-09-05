import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';

import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { DiceActions } from '../../data';
import {
  mockDicePool,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import { TrackplayDicePage } from './dice.page';

const withTable = () =>
  mockTrackplayState({ dice: mockDicePool({ dice: [6, 6, 20] }) });

describe('TrackplayDicePage', () => {
  let component: TrackplayDicePage;
  let dispatch: ReturnType<typeof vi.spyOn>;

  const setup = (state = mockTrackplayState()) => {
    TestBed.configureTestingModule({
      imports: [TrackplayDicePage],
      providers: [provideTestingProviders({ trackplay: state })],
    });
    dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    component = TestBed.createComponent(TrackplayDicePage).componentInstance;
  };

  it('throws one die per die on the table', () => {
    setup(withTable());

    component.throwDice();

    expect(component.roll()?.dice).toHaveLength(3);
    expect(component.throwId()).toBe(1);
  });

  it('throws nothing off an empty table', () => {
    setup();

    component.throwDice();

    expect(component.roll()).toBeNull();
  });

  it('drops the last throw when the table is cleared', () => {
    setup(withTable());
    component.throwDice();

    component.clearPool();

    expect(component.roll()).toBeNull();
    expect(dispatch).toHaveBeenCalledWith(DiceActions.clearPool());
  });

  it('tallies equal dice into one term', () => {
    setup(withTable());

    expect(component.tally()).toEqual([
      { faces: 6, count: 2 },
      { faces: 20, count: 1 },
    ]);
  });

  it('takes back the die at the index tapped', () => {
    setup(withTable());

    component.removeDie(1);

    expect(dispatch).toHaveBeenCalledWith(DiceActions.removeDieAt(1));
  });
});
