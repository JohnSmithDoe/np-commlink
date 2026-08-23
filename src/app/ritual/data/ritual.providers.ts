import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { providePersistedContext } from '../../@shared/data/persisted-states/persisted-context.provider';
import { createMetric } from '../../@shared/data/persisted-states/persisted-slice.effects.factory';
import { createDailyReminderEffects } from '../../@shared/data/services/daily-reminder.effects.factory';
import { RitualActions } from './ritual.actions';
import { ritualReducer } from './ritual.reducer';
import { RitualToastEffects } from './ritual-toast.effects';
import {
  RITUAL_STATE_KEY,
  selectRitualCount,
  selectRitualReminder,
  selectRitualState,
} from './ritual.selector';

const ritualReminderEffects = createDailyReminderEffects({
  armOn: [RitualActions.loaded],
  changeOn: [RitualActions.setReminder],
  select: selectRitualReminder,
  source: 'ritualReminder',
  titleKey: marker('ritual.reminder.title'),
  bodyKey: marker('ritual.reminder.body'),
  refusedKey: marker('ritual.reminder.refused'),
});

export const ritualContext = providePersistedContext({
  key: RITUAL_STATE_KEY,
  reducer: ritualReducer,
  lifecycle: RitualActions,
  select: selectRitualState,
  save: {
    on: [
      RitualActions.completed,
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
  effects: [ritualReminderEffects, RitualToastEffects],
});
