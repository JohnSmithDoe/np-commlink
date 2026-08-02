import { Marker, Theme } from '../../@shared/model/app.types';
import { DeckIcon } from './deck.icons';

export type ProgramStatus = 'online' | 'standby' | 'offline';

export type AppModule =
  | 'commlink'
  | 'tracking'
  | 'office-time'
  | 'notifications'
  | 'barcode'
  | 'household'
  | 'tasks'
  | 'cash'
  | 'trackplay'
  | 'geist'
  | 'settings';

export type DeckEntryId = string;

export type DeckEntry = {
  id: DeckEntryId;
  module: AppModule;
  icon: DeckIcon;
  route: string;
  titleKey: Marker;
  labels: Record<Theme, { nameKey: Marker; descKey: Marker }>;
  onDeck: boolean;
  source?: string;
  metric?: string;
  metricKey?: Marker;
  status?: ProgramStatus;
  needsLanguageModel?: boolean;
  currency?: true;
};

export type DeckProgram = DeckEntry & {
  nameKey: Marker;
  descKey: Marker;
};

export type DeckProgramConfig = DeckProgram & {
  hidden: boolean;
  moduleHidden: boolean;
};

export type DeckModuleConfig = {
  module: AppModule;
  labelKey: Marker;
  hidden: boolean;
};

export type DeckState = {
  order: DeckEntryId[];
  hiddenEntries: DeckEntryId[];
  hiddenModules: AppModule[];
};
