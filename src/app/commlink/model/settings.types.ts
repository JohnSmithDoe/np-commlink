import {
  AccentColors,
  Language,
  Mode,
  Skin,
} from '../../@shared/model/app.types';

export interface SettingsState {
  skin: Skin;
  mode: Mode;
  language: Language;
  customAccents?: Partial<Record<Skin, AccentColors>>;
  recentEmojis?: string[];
}
