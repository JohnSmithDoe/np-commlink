import { computed, inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ThemeService } from '../theme.service';
import { DECK_CATALOG, DECK_SLOT_COUNT } from '../../model/deck.catalog';
import { DECK_MODULE_LABELS } from '../../model/deck.labels';
import {
  AppModule,
  DeckProgramConfig,
  DeckEntryId,
} from '../../model/deck.types';
import {
  entriesOnDeck,
  groupByModule,
  groupingModules,
  isFactoryDeck,
  moveOnDeck,
  orderEntries,
  reorderVisible,
  resolveLabels,
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
    entriesOnDeck(DECK_CATALOG, this.#config()).map(this.#labelled())
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
        hidden: !config.visibleEntries.includes(entry.id),
        moduleKey: this.#grouping.has(entry.module)
          ? DECK_MODULE_LABELS[entry.module]
          : undefined,
      }));
  });

  readonly orderedPrograms = computed(() =>
    this.configuredEntries().filter((entry) => !entry.hidden)
  );

  readonly configuredModules = computed(() => {
    const config = this.#config();
    return groupByModule(
      DECK_CATALOG.map(this.#labelled()).map((entry) => ({
        ...entry,
        hidden: !config.visibleEntries.includes(entry.id),
      }))
    );
  });

  readonly hasCustomConfig = computed(
    () => !isFactoryDeck(this.#config(), initialDeck)
  );

  reorder(order: DeckEntryId[]): void {
    this.#store.dispatch(DeckActions.reorder(order));
  }

  reorderShown(visibleOrder: DeckEntryId[]): void {
    this.reorder(reorderVisible(this.#config().order, visibleOrder));
  }

  moveProgram(id: DeckEntryId, delta: -1 | 1): void {
    const config = this.#config();
    const order = orderEntries(DECK_CATALOG, config.order).map(
      (entry) => entry.id
    );
    this.reorder(moveOnDeck(order, config.visibleEntries, id, delta));
  }

  toggleEntry(id: DeckEntryId): void {
    this.#store.dispatch(DeckActions.toggleEntry(id));
  }

  toggleModule(module: AppModule): void {
    const group = this.configuredModules().find(
      (entry) => entry.module === module
    );
    if (!group) return;
    this.#store.dispatch(
      DeckActions.setEntries(
        group.programs.map((program) => program.id),
        !group.allVisible
      )
    );
  }

  reset(): void {
    this.#store.dispatch(DeckActions.reset());
  }
}
