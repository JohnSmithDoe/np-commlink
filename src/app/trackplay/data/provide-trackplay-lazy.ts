import { EnvironmentProviders, Provider } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { moduleHydrationResolver } from '../../@shared/data/module-hydration.resolver';
import { TrackplayActions } from './trackplay.actions';
import { trackplayReducer } from './trackplay.reducer';
import { TrackplayEffects } from './effects/trackplay.effects';
import { TrackplayLoadEffects } from './effects/trackplay-load.effects';
import { TrackplaySaveEffects } from './effects/trackplay-save.effects';
import { TrackplayTelemetryEffects } from './effects/trackplay-telemetry.effects';

/**
 * Lazy state + effects for the `trackplay` bounded context, registered on ALL
 * trackplay routes (`/trackplay`, `/trackplay/players`, `/trackplay/player/:id`,
 * `/trackplay/game-types`, `/trackplay/game/:id`) — the same array on each, so
 * navigating between sub-pages keeps the one slice present (lazy-modules §4).
 * Trackplay is fully self-contained — no other route reads or dispatches
 * `[Trackplay]`.
 *
 * Hydration is handled by `moduleHydrationResolver(TrackplayActions.load,
 * .loaded)` on the same routes: TrackplayLoadEffects reads the `trackplay` key
 * and emits `loaded` (seeding default game types when empty). The telemetry
 * reporter and the save effect ride with the slice (lazy) so they never touch
 * an unregistered slice; the cold-launch games count comes from the persisted
 * summary, and the on-entry report flips the ARENA tile standby→online.
 */
export const trackplayLazyProviders: Array<Provider | EnvironmentProviders> = [
  provideState('trackplay', trackplayReducer),
  provideEffects(
    TrackplayLoadEffects,
    TrackplaySaveEffects,
    TrackplayEffects,
    TrackplayTelemetryEffects
  ),
];

/** Route hydration for the trackplay slice (dispatched by the route resolver). */
export const trackplayHydrationResolver = moduleHydrationResolver(
  TrackplayActions.load,
  TrackplayActions.loaded
);
