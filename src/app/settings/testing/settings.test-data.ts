import { ISettingsState } from '../model/settings.types';

export function mockSettings(
  overrides: Partial<ISettingsState> = {}
): ISettingsState {
  return { theme: 'cyberpunk', ...overrides };
}
