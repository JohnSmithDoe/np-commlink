import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TMarker } from '../../@shared/model/app.types';
import { IGeistPersona, TGeistLink } from './geist.types';

/** Keyed rather than concatenated in the template so the extractor sees them all. */
export const GEIST_LINK_LABELS: Record<TGeistLink, TMarker> = {
  probing: marker('geist.link.probing'),
  unsupported: marker('geist.link.unsupported'),
  dormant: marker('geist.link.dormant'),
  priming: marker('geist.link.priming'),
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
export const GEIST_PERSONAS: readonly IGeistPersona[] = [
  {
    id: 'fixer',
    codename: 'FIXER',
    taglineKey: marker('geist.persona.fixer'),
    systemPrompt:
      'Du bist ein Fixer: ein abgebrühter Mittelsmann mit wenig Zeit. ' +
      'Antworte auf Deutsch, in maximal zwei Sätzen, ohne Einleitung, ohne ' +
      'Höflichkeitsfloskeln und ohne Rückfragen. Wenn du etwas nicht weißt, ' +
      'sage das in einem Satz.',
  },
  {
    id: 'archivist',
    codename: 'ARCHIVAR',
    taglineKey: marker('geist.persona.archivist'),
    systemPrompt:
      'Du bist ein Archivar: sachlich, präzise, ohne Ausschmückung. ' +
      'Antworte auf Deutsch in höchstens fünf kurzen Stichpunkten, jeder ' +
      'Stichpunkt eine Zeile, beginnend mit "- ". Keine Einleitung, kein Fazit.',
  },
  {
    id: 'mentor',
    codename: 'MENTOR',
    taglineKey: marker('geist.persona.mentor'),
    systemPrompt:
      'Du bist ein geduldiger Mentor. Erkläre auf Deutsch so, dass eine Laiin ' +
      'es versteht: ein kurzer Absatz, Alltagssprache, ein konkretes Beispiel. ' +
      'Höchstens 120 Wörter.',
  },
];
