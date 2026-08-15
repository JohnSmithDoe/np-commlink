/* ─── why ─────────────────────────────────────────────────────────
 * The exclusion is a set, not one id, because it answers two questions
 * at once: the card a reroll replaces, and the handful finished recently
 * — a prompt returning the day after it was done reads as a broken draw
 * where the same prompt three weeks later reads as the habit working.
 * It falls back to the full pool rather than returning nothing, so a
 * catalog smaller than the exclusion still deals a card instead of
 * emptying the page.
 * ───────────────────────────────────────────────────────────────── */
import {
  RitualCatalog,
  RitualPrompt,
  RitualPromptId,
} from '../model/ritual.types';

export const drawPrompt = (
  prompts: RitualCatalog,
  exclude?: ReadonlySet<RitualPromptId>,
  random: () => number = Math.random
): RitualPrompt => {
  const others = prompts.filter((prompt) => !exclude?.has(prompt.id));
  const pool = others.length > 0 ? others : prompts;
  return pool[Math.floor(random() * pool.length)] ?? prompts[0];
};

export const promptById = (
  prompts: RitualCatalog,
  id: RitualPromptId | undefined
): RitualPrompt | undefined => prompts.find((prompt) => prompt.id === id);
