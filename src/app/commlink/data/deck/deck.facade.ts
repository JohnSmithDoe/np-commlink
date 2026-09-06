import { computed, inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ThemeService } from '../theme.service';
import {
  DECK_CATALOG,
  DECK_PINNED_ENTRY,
  DECK_SLOT_COUNT,
} from '../../model/deck.catalog';
import { DECK_MODULE_LABELS } from '../../model/deck.labels';
import {
  AppModule,
  DeckProgram,
  DeckProgramConfig,
  DeckEntryId,
} from '../../model/deck.types';
import {
  entriesOnDeck,
  groupByModule,
  groupingModules,
  isFactoryDeck,
  orderEntries,
  reorderWithin,
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

  readonly programs = computed(() => {
    const { hiddenTiles } = this.#config();
    return this.menuEntries().filter(
      (entry) => entry.onDeck && !hiddenTiles.includes(entry.id)
    );
  });

  readonly allPrograms = computed(() =>
    DECK_CATALOG.filter((entry) => entry.onDeck).map(this.#labelled())
  );
  readonly slotCount = DECK_SLOT_COUNT;

  readonly #grouping = groupingModules(DECK_CATALOG);

  readonly #configure = computed(() => {
    const config = this.#config();
    return (entry: DeckProgram): DeckProgramConfig => ({
      ...entry,
      hidden: !config.visibleEntries.includes(entry.id),
      hiddenOnDeck: config.hiddenTiles.includes(entry.id),
      moduleKey: this.#grouping.has(entry.module)
        ? DECK_MODULE_LABELS[entry.module]
        : undefined,
    });
  });

  readonly configuredEntries = computed(() =>
    orderEntries(DECK_CATALOG, this.#config().order)
      .map(this.#labelled())
      .map(this.#configure())
  );

  readonly orderedPrograms = computed(() =>
    this.configuredEntries().filter(
      (entry) => entry.onDeck && !entry.hidden && entry.id !== DECK_PINNED_ENTRY
    )
  );

  readonly configuredModules = computed(() =>
    groupByModule(DECK_CATALOG.map(this.#labelled()).map(this.#configure()))
  );

  readonly hasCustomConfig = computed(
    () => !isFactoryDeck(this.#config(), initialDeck)
  );

  reorder(order: DeckEntryId[]): void {
    this.#store.dispatch(DeckActions.reorder(order));
  }

  reorderShown(visibleOrder: DeckEntryId[]): void {
    const order = orderEntries(DECK_CATALOG, this.#config().order).map(
      (entry) => entry.id
    );
    this.reorder(reorderWithin(order, visibleOrder));
  }

  toggleEntry(id: DeckEntryId): void {
    this.#store.dispatch(DeckActions.toggleEntry(id));
  }

  toggleTile(id: DeckEntryId): void {
    this.#store.dispatch(DeckActions.toggleTile(id));
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
