/* ─── why ─────────────────────────────────────────────────────────
 * The drawn prompt hangs off the DAY, not the draw: this facade is
 * root-scoped and an Android process outlives many midnights, so a signal
 * set once would hand back the finished task every day until the app was
 * killed. `linkedSignal` keeps `draw()` writable — a reroll overrides the
 * day's draw rather than becoming a second source — and carrying
 * yesterday's id into the exclusion means a new day never opens on the
 * card the last one closed with.
 * ───────────────────────────────────────────────────────────────── */
import {
  computed,
  inject,
  Injectable,
  linkedSignal,
  untracked,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { TodayService } from '../../@shared/data/services/today.service';
import { RITUAL_PROMPTS } from '../model/ritual.catalog';
import {
  RitualPrompt,
  RitualPromptId,
  RitualReminder,
} from '../model/ritual.types';
import { drawPrompt, promptById } from '../util/ritual.draw';
import {
  completionOn,
  recentDayFlags,
  recentPromptIds,
} from '../util/ritual.stats';
import { RitualActions } from './ritual.actions';
import {
  selectDismissedPrompts,
  selectRitualCompletions,
  selectRitualCount,
  selectRitualReminder,
} from './ritual.selector';

const RITUAL_RECENT_DAYS = 7;
const RITUAL_RECENT_DRAWS = 20;

@Injectable({ providedIn: 'root' })
export class RitualPageFacade {
  readonly #store = inject(Store);
  readonly #completions = this.#store.selectSignal(selectRitualCompletions);
  readonly #dismissed = this.#store.selectSignal(selectDismissedPrompts);
  readonly #today = inject(TodayService).today;
  readonly #prompt = linkedSignal<string, RitualPrompt>({
    source: this.#today,
    computation: (_day, previous) =>
      drawPrompt(RITUAL_PROMPTS, this.#stale(previous?.value.id)),
  });

  readonly count = this.#store.selectSignal(selectRitualCount);
  readonly reminder = this.#store.selectSignal(selectRitualReminder);
  readonly prompt = this.#prompt.asReadonly();
  readonly dismissedCount = computed(() => this.#dismissed().length);

  readonly #todaysCompletion = computed(() =>
    completionOn(this.#completions(), this.#today())
  );
  readonly dayClosed = computed(() => !!this.#todaysCompletion());
  readonly todaysPrompt = computed(() =>
    promptById(RITUAL_PROMPTS, this.#todaysCompletion()?.promptId)
  );
  readonly recentDays = computed(() =>
    recentDayFlags(this.#completions(), this.#today(), RITUAL_RECENT_DAYS)
  );

  draw(): void {
    this.#prompt.set(
      drawPrompt(RITUAL_PROMPTS, this.#stale(this.#prompt().id))
    );
  }

  #stale(current?: RitualPromptId): ReadonlySet<RitualPromptId> {
    return untracked(() => {
      const recent = recentPromptIds(this.#completions(), RITUAL_RECENT_DRAWS);
      const stale = new Set(recent);
      for (const id of this.#dismissed()) stale.add(id);
      if (current) stale.add(current);
      return stale;
    });
  }

  complete(promptId: RitualPromptId): void {
    this.#store.dispatch(RitualActions.completed(promptId));
  }

  dismiss(promptId: RitualPromptId): void {
    this.#store.dispatch(RitualActions.dismissed(promptId));
    this.draw();
  }

  restoreAll(): void {
    this.#store.dispatch(RitualActions.restoredAll());
  }

  setReminder(reminder: RitualReminder): void {
    this.#store.dispatch(RitualActions.setReminder(reminder));
  }
}
