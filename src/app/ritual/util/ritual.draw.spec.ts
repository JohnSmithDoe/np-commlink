import { RitualCatalog } from '../model/ritual.types';
import { drawPrompt, promptById } from './ritual.draw';

const PROMPTS: RitualCatalog = [
  { id: 'a', textKey: 'ritual.prompt.a' },
  { id: 'b', textKey: 'ritual.prompt.b' },
  { id: 'c', textKey: 'ritual.prompt.c' },
];

describe('drawPrompt', () => {
  it('draws from the catalog', () => {
    expect(PROMPTS).toContain(drawPrompt(PROMPTS, undefined, () => 0.5));
  });

  it('never redraws the card it replaces', () => {
    for (const roll of [0, 0.5, 0.99]) {
      expect(drawPrompt(PROMPTS, new Set(['b']), () => roll).id).not.toBe('b');
    }
  });

  it('skips everything finished recently, not only the last card', () => {
    for (const roll of [0, 0.5, 0.99]) {
      expect(drawPrompt(PROMPTS, new Set(['a', 'b']), () => roll).id).toBe('c');
    }
  });

  it('deals a card anyway when the exclusion covers the whole catalog', () => {
    const drawn = drawPrompt(PROMPTS, new Set(['a', 'b', 'c']), () => 0.5);

    expect(PROMPTS).toContain(drawn);
  });

  it('falls back to the only prompt there is rather than returning nothing', () => {
    const single: RitualCatalog = [PROMPTS[0]];

    expect(drawPrompt(single, new Set(['a']), () => 0).id).toBe('a');
  });
});

describe('promptById', () => {
  it('resolves a stored completion back to its wording', () => {
    expect(promptById(PROMPTS, 'c')?.textKey).toBe('ritual.prompt.c');
  });

  it('degrades rather than throwing when an id has left the catalog', () => {
    expect(promptById(PROMPTS, 'retired')).toBeUndefined();
  });
});
