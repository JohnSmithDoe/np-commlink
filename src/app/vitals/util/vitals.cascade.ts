import {
  addListItem,
  removeListItem,
} from '../../@shared/util/item-lists/list.utils';
import {
  IntakesState,
  Pill,
  PillsState,
  VitalsState,
} from '../model/vitals.types';

export const deletePillCascade = (
  state: VitalsState,
  pill: Pill
): VitalsState => ({
  ...state,
  pills: removeListItem<PillsState, Pill>(state.pills, pill),
  intakes: state.intakes.filter((intake) => intake.pillId !== pill.id),
});

export const restorePillCascade = (
  state: VitalsState,
  pill: Pill,
  intakes: IntakesState
): VitalsState => ({
  ...state,
  pills: addListItem<PillsState, Pill>(state.pills, pill),
  intakes: [...state.intakes, ...intakes],
});
