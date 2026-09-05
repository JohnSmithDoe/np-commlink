import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';

import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { DiceActions } from '../../data';
import {
  mockDiceGroup,
  mockDicePool,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import { TrackplayDicePage } from './dice.page';

const withPool = () =>
  mockTrackplayState({
    dice: mockDicePool({ groups: [mockDiceGroup({ count: 3 })] }),
  });

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

  it('throws one die per counted die', () => {
    setup(withPool());

    component.throwDice();

    expect(component.roll()?.dice).toHaveLength(3);
    expect(component.throwId()).toBe(1);
  });

  it('throws nothing while the pool is empty', () => {
    setup();

    component.throwDice();

    expect(component.roll()).toBeNull();
  });

  it('drops the last throw when the pool is cleared', () => {
    setup(withPool());
    component.throwDice();

    component.clearPool();

    expect(component.roll()).toBeNull();
    expect(dispatch).toHaveBeenCalledWith(DiceActions.clearPool());
  });

  it('dispatches the count a row reports', () => {
    setup(withPool());

    component.setCount({ id: 'dice-1', count: 5 });

    expect(dispatch).toHaveBeenCalledWith(
      DiceActions.setGroupCount('dice-1', 5)
    );
  });
});
