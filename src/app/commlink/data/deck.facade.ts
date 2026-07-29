import { computed, inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ThemeService } from '../../@shared/util/theme.service';
import { DECK_CATALOG, DECK_SLOT_COUNT } from '../model/deck.catalog';
import { DECK_MODULE_LABELS } from '../model/deck.labels';
import {
  IDeckModuleConfig,
  IDeckProgramConfig,
  TAppModule,
  TDeckEntryId,
} from '../model/deck.types';
import {
  orderEntries,
  resolveLabels,
  visibleEntries,
} from '../util/deck.utils';
import { DeckActions } from './actions/deck.actions';
import { selectDeckState } from './selectors/deck.selector';

/**
 * Facade over the eager `deck` slice — the user's navigation configuration,
 * resolved against the catalog and the active theme.
 *
 * The theme comes from `ThemeService`, not `SettingsFacade`: `commlink` may not
 * import another domain, and the applied theme is published in `@shared/util`
 * for exactly this kind of reader. Reading it as a signal is also what makes a
 * live theme switch re-label the deck.
 */
@Injectable({ providedIn: 'root' })
export class DeckFacade {
  readonly #store = inject(Store);
  readonly #theme = inject(ThemeService).theme;
  readonly #config = this.#store.selectSignal(selectDeckState);

  readonly #labelled = computed(() => resolveLabels(this.#theme()));

  /** What the side menu lists: everything the user shows, in their order. */
  readonly menuEntries = computed(() =>
    visibleEntries(DECK_CATALOG, this.#config()).map(this.#labelled())
  );

  /** What the deck grid renders — the menu's entries minus the menu-only ones. */
  readonly programs = computed(() =>
    this.menuEntries().filter((entry) => entry.onDeck)
  );

  /**
   * Every program the grid has, hidden ones included. The status strip reports
   * the grid rather than this user's view, so a hidden-but-online program still
   * counts toward `N / 13`.
   */
  readonly allPrograms = computed(() =>
    DECK_CATALOG.filter((entry) => entry.onDeck).map(this.#labelled())
  );
  readonly slotCount = DECK_SLOT_COUNT;

  /** The config page's list: every entry in order, whatever its flags. */
  readonly configuredEntries = computed<IDeckProgramConfig[]>(() => {
    const config = this.#config();
    return orderEntries(DECK_CATALOG, config.order)
      .map(this.#labelled())
      .map((entry) => ({
        ...entry,
        hidden: config.hiddenEntries.includes(entry.id),
        moduleHidden: config.hiddenModules.includes(entry.module),
      }));
  });

  readonly configuredModules = computed<IDeckModuleConfig[]>(() => {
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

  reorder(order: TDeckEntryId[]): void {
    this.#store.dispatch(DeckActions.reorder(order));
  }

  toggleEntry(id: TDeckEntryId): void {
    this.#store.dispatch(DeckActions.toggleEntry(id));
  }

  toggleModule(module: TAppModule): void {
    this.#store.dispatch(DeckActions.toggleModule(module));
  }

  reset(): void {
    this.#store.dispatch(DeckActions.reset());
  }
}
