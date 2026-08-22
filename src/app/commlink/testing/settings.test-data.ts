import { SettingsState } from '../model/settings.types';

export function mockSettingsState(
  overrides: Partial<SettingsState> = {}
): SettingsState {
  return {
    skin: 'cyberpunk',
    mode: 'dark',
    language: 'de',
    ...overrides,
  };
}
