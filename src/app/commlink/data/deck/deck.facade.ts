import { computed, inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ThemeService } from '../../../@shared/util/theme/theme.service';
import { DECK_CATALOG, DECK_SLOT_COUNT } from '../../model/deck.catalog';
import { DECK_MODULE_LABELS } from '../../model/deck.labels';
import {
  DeckModuleConfig,
  DeckProgramConfig,
  AppModule,
  DeckEntryId,
} from '../../model/deck.types';
import {
  orderEntries,
  resolveLabels,
  visibleEntries,
} from '../../util/deck.utils';
import { DeckActions } from './deck.actions';
import { selectDeckState } from './deck.selector';

@Injectable({ providedIn: 'root' })
export class DeckFacade {
  readonly #store = inject(Store);
  readonly #theme = inject(ThemeService).theme;
  readonly #config = this.#store.selectSignal(selectDeckState);

  readonly #labelled = computed(() => resolveLabels(this.#theme()));

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

  readonly configuredEntries = computed<DeckProgramConfig[]>(() => {
    const config = this.#config();
    return orderEntries(DECK_CATALOG, config.order)
      .map(this.#labelled())
      .map((entry) => ({
        ...entry,
        hidden: config.hiddenEntries.includes(entry.id),
        moduleHidden: config.hiddenModules.includes(entry.module),
      }));
  });

  readonly configuredModules = computed<DeckModuleConfig[]>(() => {
    const hidden = this.#config().hiddenModules;
    return [...new Set(DECK_CATALOG.map((entry) => entry.module))].map(
      (module) => ({
        module,
        labelKey: DECK_MODULE_LABELS[module],
        hidden: hidden.includes(module),
      })
    );
  });

  readonly hasCustomConfig = computed(() => {
    const { order, hiddenEntries, hiddenModules } = this.#config();
    return (
      order.length > 0 || hiddenEntries.length > 0 || hiddenModules.length > 0
    );
  });

  reorder(order: DeckEntryId[]): void {
    this.#store.dispatch(DeckActions.reorder(order));
  }

  toggleEntry(id: DeckEntryId): void {
    this.#store.dispatch(DeckActions.toggleEntry(id));
  }

  toggleModule(module: AppModule): void {
    this.#store.dispatch(DeckActions.toggleModule(module));
  }

  reset(): void {
    this.#store.dispatch(DeckActions.reset());
  }
}
