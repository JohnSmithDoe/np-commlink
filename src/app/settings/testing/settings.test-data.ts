import { SettingsState } from '../model/settings.types';

export function mockSettingsState(
  overrides: Partial<SettingsState> = {}
): SettingsState {
  return {
    theme: 'cyberpunk',
    language: 'de',
    ...overrides,
  };
}
