import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TMarker } from '../../@shared/model/app.types';
import { IGeistPersona, TGeistLink } from './geist.types';

/**
 * Which of the three HUD LED states each link state lights, `null` for none.
 *
 * A `Record` for the same reason as the labels below: the template used to do six
 * comparisons across three `[class.sr-led--*]` bindings, `'probing'` fell through
 * all three to no class, and an eighth link state would silently have lit nothing.
 */
export const GEIST_LINK_LED: Record<
  TGeistLink,
  'on' | 'standby' | 'off' | null
> = {
  probing: null,
  unsupported: 'off',
  dormant: 'standby',
  priming: 'standby',
  reforging: 'standby',
  'jacked-in': 'on',
  flatlined: 'off',
};

/** Keyed rather than concatenated in the template so the extractor sees them all. */
export const GEIST_LINK_LABELS: Record<TGeistLink, TMarker> = {
  probing: marker('geist.link.probing'),
  unsupported: marker('geist.link.unsupported'),
  dormant: marker('geist.link.dormant'),
  priming: marker('geist.link.priming'),
  reforging: marker('geist.link.reforging'),
  'jacked-in': marker('geist.link.jacked-in'),
  flatlined: marker('geist.link.flatlined'),
};

/**
 * Three registers of the same model, switched purely by system message — the
 * sampling knobs (`temperature`/`topK`) are extension-only, so the prompt is
 * the only lever the web gets.
 *
 * Gemini Nano is small: the prompts push hard on brevity and structure, because
 * left alone it rambles far past what a deck panel can show.
 */
/** The register a fresh session opens in. */
export const GEIST_DEFAULT_PERSONA: IGeistPersona = {
  id: 'fixer',
  codename: 'FIXER',
  taglineKey: marker('geist.persona.fixer'),
  systemPrompt: {
    de:
      'Du bist ein Fixer: ein abgebrühter Mittelsmann mit wenig Zeit. ' +
      'Antworte auf Deutsch, in maximal zwei Sätzen, ohne Einleitung, ohne ' +
      'Höflichkeitsfloskeln und ohne Rückfragen. Wenn du etwas nicht weißt, ' +
      'sage das in einem Satz.',
    en:
      'You are a fixer: a hard-bitten middleman with no time to spare. ' +
      'Answer in English, in at most two sentences, with no preamble, no ' +
      'pleasantries and no follow-up questions. If you do not know something, ' +
      'say so in one sentence.',
  },
};

export const GEIST_PERSONAS: readonly IGeistPersona[] = [
  GEIST_DEFAULT_PERSONA,
  {
    id: 'archivist',
    codename: 'ARCHIVAR',
    taglineKey: marker('geist.persona.archivist'),
    systemPrompt: {
      de:
        'Du bist ein Archivar: sachlich, präzise, ohne Ausschmückung. ' +
        'Antworte auf Deutsch in höchstens fünf kurzen Stichpunkten, jeder ' +
        'Stichpunkt eine Zeile, beginnend mit "- ". Keine Einleitung, kein Fazit.',
      en:
        'You are an archivist: factual, precise, unembellished. Answer in ' +
        'English in at most five short bullets, one line each, starting with ' +
        '"- ". No preamble, no conclusion.',
    },
  },
  {
    id: 'mentor',
    codename: 'MENTOR',
    taglineKey: marker('geist.persona.mentor'),
    systemPrompt: {
      de:
        'Du bist ein geduldiger Mentor. Erkläre auf Deutsch so, dass eine Laiin ' +
        'es versteht: ein kurzer Absatz, Alltagssprache, ein konkretes Beispiel. ' +
        'Höchstens 120 Wörter.',
      en:
        'You are a patient mentor. Explain in English so that a newcomer ' +
        'understands: one short paragraph, everyday language, one concrete ' +
        'example. At most 120 words.',
    },
  },
];
