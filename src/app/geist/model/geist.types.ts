import { Language, Marker } from '../../@shared/model/app.types';

export type GeistLink =
  | 'probing'
  | 'unsupported'
  | 'dormant'
  | 'priming'
  | 'reforging'
  | 'jacked-in'
  | 'flatlined';

type GeistPersonaId = 'fixer' | 'archivist' | 'mentor';

export type GeistPersona = {
  id: GeistPersonaId;
  codename: string;
  taglineKey: Marker;
  systemPrompt: Record<Language, string>;
};

export type GeistTurn = {
  id: number;
  query: string;
  answer: string;
  streaming: boolean;
  note: Marker | null;
};
