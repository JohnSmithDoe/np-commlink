import { ISettingsState } from '../model/settings.types';

/**
 * Deterministic settings fixtures. Owned by the settings context, like every
 * other domain's kit: the shared `@shared/testing` kit is `domain:shared` and
 * may not reference a `domain:settings` type.
 *
 * It restates the reducer's defaults rather than importing `initialSettings`,
 * which is what keeps that const private to the reducer and its own spec. The
 * two are free to differ — a fixture answers "a plausible state", the reducer's
 * initial answers "what a fresh install boots into", and a spec that conflates
 * them asserts the second while claiming the first.
 */
export function mockSettingsState(
  overrides: Partial<ISettingsState> = {}
): ISettingsState {
  return {
    theme: 'cyberpunk',
    language: 'de',
    ...overrides,
  };
}
