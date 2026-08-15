import { RITUAL_PROMPTS } from './ritual.catalog';

describe('RITUAL_PROMPTS', () => {
  it('never reuses an id — a stored completion has to stay resolvable', () => {
    const ids = RITUAL_PROMPTS.map((prompt) => prompt.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keys every prompt off its own id', () => {
    const mismatched = RITUAL_PROMPTS.filter(
      (prompt) => prompt.textKey !== `ritual.prompt.${prompt.id}`
    );

    expect(mismatched).toEqual([]);
  });

  it('uses kebab-case ids, so the key is greppable from the id', () => {
    const malformed = RITUAL_PROMPTS.filter(
      (prompt) => !/^[a-z][\d\-a-z]*$/.test(prompt.id)
    );

    expect(malformed).toEqual([]);
  });

  it('holds enough prompts that the recency exclusion still leaves a choice', () => {
    expect(RITUAL_PROMPTS.length).toBeGreaterThan(40);
  });
});
