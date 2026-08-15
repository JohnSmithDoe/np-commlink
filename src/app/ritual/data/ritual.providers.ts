import { providePersistedContext } from '../../@shared/data/persisted-states/persisted-context.provider';
import { createMetric } from '../../@shared/data/persisted-states/persisted-slice.effects.factory';
import { RitualActions } from './ritual.actions';
import { ritualReducer } from './ritual.reducer';
import { RitualToastEffects } from './ritual-toast.effects';
import { RitualReminderEffects } from './ritual-reminder.effects';
import {
  RITUAL_STATE_KEY,
  selectRitualCount,
  selectRitualState,
} from './ritual.selector';

export const ritualContext = providePersistedContext({
  key: RITUAL_STATE_KEY,
  reducer: ritualReducer,
  lifecycle: RitualActions,
  select: selectRitualState,
  save: {
    on: [
      RitualActions.completed,
      RitualActions.uncompleted,
      RitualActions.setReminder,
      RitualActions.dismissed,
      RitualActions.restored,
      RitualActions.restoredAll,
    ],
  },
  telemetry: [
    {
      source: 'ritual',
      select: selectRitualCount,
      metrics: createMetric('done'),
    },
  ],
  effects: [RitualReminderEffects, RitualToastEffects],
});
