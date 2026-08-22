import { computed, inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ThemeService } from '../theme.service';
import { DECK_CATALOG, DECK_SLOT_COUNT } from '../../model/deck.catalog';
import { DECK_MODULE_LABELS } from '../../model/deck.labels';
import { DeckProgramConfig, DeckEntryId } from '../../model/deck.types';
import {
  groupingModules,
  isFactoryDeck,
  orderEntries,
  resolveLabels,
  visibleEntries,
} from '../../util/deck.utils';
import { DeckActions } from './deck.actions';
import { initialDeck } from './deck.reducer';
import { selectDeckState } from './deck.selector';

@Injectable({ providedIn: 'root' })
export class DeckFacade {
  readonly #store = inject(Store);
  readonly #skin = inject(ThemeService).skin;
  readonly #config = this.#store.selectSignal(selectDeckState);

  readonly #labelled = computed(() => resolveLabels(this.#skin()));

  readonly menuEntries = computed(() =>
    visibleEntries(DECK_CATALOG, this.#config()).map(this.#labelled())
  );

  readonly programs = computed(() =>
    this.menuEntries().filter((entry) => entry.onDeck)
  );

  readonly allPrograms = computed(() =>
    DECK_CATALOG.filter((entry) => entry.onDeck).map(this.#labelled())
  );
  readonly slotCount = DECK_SLOT_COUNT;

  readonly #grouping = groupingModules(DECK_CATALOG);

  readonly configuredEntries = computed<DeckProgramConfig[]>(() => {
    const config = this.#config();
    return orderEntries(DECK_CATALOG, config.order)
      .map(this.#labelled())
      .map((entry) => ({
        ...entry,
        hidden: config.hiddenEntries.includes(entry.id),
        moduleKey: this.#grouping.has(entry.module)
          ? DECK_MODULE_LABELS[entry.module]
          : undefined,
      }));
  });

  readonly hasCustomConfig = computed(
    () => !isFactoryDeck(this.#config(), initialDeck)
  );

  reorder(order: DeckEntryId[]): void {
    this.#store.dispatch(DeckActions.reorder(order));
  }

  toggleEntry(id: DeckEntryId): void {
    this.#store.dispatch(DeckActions.toggleEntry(id));
  }

  reset(): void {
    this.#store.dispatch(DeckActions.reset());
  }
}
