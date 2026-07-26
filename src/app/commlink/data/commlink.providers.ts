import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { bootHydrationProvider } from '../../@shared/data/boot-hydration.provider';
import {
  mergeContexts,
  providePersistedContext,
  TContextBundle,
} from '../../@shared/data/persisted-context.provider';
import { DashboardReadModelActions } from './actions/dashboard.actions';
import { DeckActions } from './actions/deck.actions';
import { DashboardEffects } from './effects/dashboard.effects';
import { dashboardReducer } from './reducer/dashboard.reducer';
import { deckReducer } from './reducer/deck.reducer';
import { selectDeckState } from './selectors/deck.selector';

/**
 * State + effects for the commlink-owned dashboard read-model. `provideAppKernel()`
 * composes it into the root injector, which is what makes it eager: the deck is
 * the `**` fallback and the shell's notification badge is always on, and a sink
 * every module writes to cannot be scoped to one producer's route lifecycle.
 * Hence `bootHydrationProvider` and an empty `resolve` in place of a
 * `moduleHydrationResolver`.
 *
 * The one slice that does NOT ride `providePersistedContext`, and the bundle
 * shape is what keeps that invisible to the composition site: it reads a key
 * *family* (`loadPrefixed('summary-')`) and gates persistence on `hydrate` so the
 * reporters' pre-hydration `report` cannot overwrite the previous session — an
 * ordering rule the generic save effect has no business carrying for one caller.
 */
const dashboardContext: TContextBundle = {
  providers: [
    provideState('dashboard', dashboardReducer),
    provideEffects(DashboardEffects),
    bootHydrationProvider(DashboardReadModelActions.load),
  ],
  resolve: {},
};

/**
 * The user's deck configuration — which programs the grid and the side menu
 * show, and in what order. Eager for the same reason the read-model is: the
 * menu is always-on shell chrome, so the config cannot be scoped to a route,
 * and a cold launch must render the user's deck rather than the factory one.
 *
 * The save trigger is the whole `[Deck]` source (the factory drops `load`/
 * `loaded` itself), so a new command persists without being listed twice.
 */
const deckContext = providePersistedContext({
  key: 'deck',
  reducer: deckReducer,
  lifecycle: DeckActions,
  select: selectDeckState,
  save: { sources: ['[Deck]'] },
  hydrate: 'boot',
});

export const commlinkContext: TContextBundle = mergeContexts(
  dashboardContext,
  deckContext
);
