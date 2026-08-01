import { TLanguage, TMarker } from '../../@shared/model/app.types';

/**
 * The deck's view of the on-device model. `unsupported`, `flatlined` and the
 * `priming`/`reforging` pair are ours, not the platform's: the Prompt API only
 * reports whether weights are present. It has no notion of "this runtime will
 * never have them" (our Android APK) versus "creating the session just failed",
 * nor of the difference between the first open, which downloads gigabytes, and
 * every later one, which only re-creates a session against local weights.
 */
export type TGeistLink =
  | 'probing'
  | 'unsupported'
  | 'dormant'
  | 'priming'
  | 'reforging'
  | 'jacked-in'
  | 'flatlined';

type TGeistPersonaId = 'fixer' | 'archivist' | 'mentor';

export type IGeistPersona = {
  id: TGeistPersonaId;
  codename: string;
  taglineKey: TMarker;
  /**
   * Sent as the session's system message, in the UI language.
   *
   * Deliberately NOT an i18n key, for the reason it always was: this steers the
   * model rather than labelling anything, so an edit in a message bundle would
   * silently change answers. A `Record` keeps both wordings in code, where they
   * are reviewed as behaviour — and makes a third language a compile error at
   * every persona instead of an English session answered in German, which is
   * what a single string produced.
   */
  systemPrompt: Record<TLanguage, string>;
};

export type IGeistTurn = {
  id: number;
  query: string;
  answer: string;
  streaming: boolean;
  note: TMarker | null;
};
