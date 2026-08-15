import { createActionGroup, emptyProps } from '@ngrx/store';
import dayjs from 'dayjs';
import {
  RitualPromptId,
  RitualReminder,
  RitualState,
} from '../model/ritual.types';

export const RitualActions = createActionGroup({
  source: 'Ritual',
  events: {
    load: emptyProps(),
    loaded: (ritual: RitualState | null) => ({ ritual }),
    completed: (promptId: RitualPromptId, at?: string | Date) => ({
      promptId,
      at: dayjs(at).format(),
    }),
    uncompleted: (promptId: RitualPromptId, at: string) => ({ promptId, at }),
    setReminder: (reminder: RitualReminder) => ({ reminder }),
    dismissed: (promptId: RitualPromptId) => ({ promptId }),
    restored: (promptId: RitualPromptId) => ({ promptId }),
    restoredAll: emptyProps(),
  },
});
