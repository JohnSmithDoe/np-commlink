import { TMarker } from '../../@shared/model/app.types';

/**
 * The deck's view of the on-device model. `unsupported` and `flatlined` are
 * ours, not the platform's: the Prompt API only reports whether weights are
 * present, it has no notion of "this runtime will never have them" (our Android
 * APK) versus "creating the session just failed".
 */
export type TGeistLink =
  'probing' | 'unsupported' | 'dormant' | 'priming' | 'jacked-in' | 'flatlined';

export type TGeistPersonaId = 'fixer' | 'archivist' | 'mentor';

export type IGeistPersona = {
  id: TGeistPersonaId;
  codename: string;
  taglineKey: TMarker;
  /**
   * Sent as the session's system message. Deliberately not an i18n key — it
   * steers the model, so translating it would silently change answers.
   */
  systemPrompt: string;
};

export type IGeistTurn = {
  id: number;
  query: string;
  answer: string;
  streaming: boolean;
  note: TMarker | null;
};
