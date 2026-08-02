import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { bootHydrationProvider } from '../../@shared/data/persisted-states/boot-hydration.provider';
import {
  mergeContexts,
  providePersistedContext,
  ContextBundle,
} from '../../@shared/data/persisted-states/persisted-context.provider';
import { DashboardReadModelActions } from './dashboard/dashboard.actions';
import { DeckActions } from './deck/deck.actions';
import { DashboardEffects } from './dashboard/dashboard.effects';
import { dashboardReducer } from './dashboard/dashboard.reducer';
import { deckReducer } from './deck/deck.reducer';
import { DASHBOARD_STATE_KEY } from './dashboard/dashboard.selector';
import { DECK_STATE_KEY, selectDeckState } from './deck/deck.selector';

const dashboardContext: ContextBundle = {
  providers: [
    provideState(DASHBOARD_STATE_KEY, dashboardReducer),
    provideEffects(DashboardEffects),
    bootHydrationProvider(DashboardReadModelActions.load),
  ],
  resolve: {},
};

const deckContext = providePersistedContext({
  key: DECK_STATE_KEY,
  reducer: deckReducer,
  lifecycle: DeckActions,
  select: selectDeckState,
  save: { sources: ['[Deck]'] },
  hydrate: 'boot',
});

export const commlinkContext: ContextBundle = mergeContexts(
  dashboardContext,
  deckContext
);
