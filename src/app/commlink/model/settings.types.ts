import { AccentColors, Language, Theme } from '../../@shared/model/app.types';

export interface SettingsState {
  theme: Theme;
  language: Language;
  customAccents?: Partial<Record<Theme, AccentColors>>;
  recentEmojis?: string[];
}
