import { mockKernelState } from '../../../@shared/testing/test-data';
import {
  mockGameType,
  mockGameTypesState,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import {
  selectGameTypeById,
  selectGameTypesListItems,
} from './game-types.selector';

const stateWith = (
  items: ReturnType<typeof mockGameType>[],
  searchQuery?: string
) =>
  mockKernelState({
    trackplay: mockTrackplayState({
      gameTypes: { ...mockGameTypesState(items), searchQuery },
    }),
  });

describe('game-types.selector', () => {
  it('pins the default type first, then sorts the rest by name', () => {
    const state = stateWith([
      mockGameType({ id: 'zeta', name: 'Zeta' }),
      mockGameType({ id: 'default', name: 'Standard' }),
      mockGameType({ id: 'alpha', name: 'Alpha' }),
    ]);

    expect(selectGameTypesListItems(state).map((type) => type.id)).toEqual([
      'default',
      'alpha',
      'zeta',
    ]);
  });

  it('narrows by the search term and keeps the pin', () => {
    const state = stateWith(
      [
        mockGameType({ id: 'default', name: 'Standard' }),
        mockGameType({ id: 'skat', name: 'Skat' }),
      ],
      'sk'
    );

    expect(selectGameTypesListItems(state).map((type) => type.id)).toEqual([
      'skat',
    ]);
  });

  it('resolves a type, or nothing for an unknown id', () => {
    const state = stateWith([mockGameType({ id: 'skat', name: 'Skat' })]);

    expect(selectGameTypeById('skat')(state)?.name).toBe('Skat');
    expect(selectGameTypeById('nope')(state)).toBeUndefined();
  });
});
