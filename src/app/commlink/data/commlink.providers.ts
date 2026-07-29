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
 * State + effects for the commlink-owned dashboard read-model.
 *
 * THE one place the "why eager" argument lives — every other file in this domain
 * points here. `provideAppKernel()` composes this bundle into the root injector
 * instead of handing it to a route, because the dashboard is a capability SINK:
 * its writers live outside its own route (every program reports while you are
 * inside that program), so it cannot be scoped to any one producer's lifecycle,
 * and its readers — the `**` fallback deck plus the always-on notification badge
 * — must render a cold launch. Hence `bootHydrationProvider` and an empty
 * `resolve` in place of a `moduleHydrationResolver`. Ownership (which domain
 * holds the reducer) and lifecycle (when it registers) are independent axes; the
 * bundle shape is the same either way.
 *
 * It is also the one slice that does NOT ride `providePersistedContext`, and the
 * bundle shape keeps that invisible to the composition site: it reads a key
 * *family* (`loadPrefixed('summary-')`) rather than a single doc — a shape the
 * generic load effect has no business carrying for one caller.
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
