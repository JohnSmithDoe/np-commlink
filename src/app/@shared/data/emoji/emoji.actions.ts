import { createActionGroup } from '@ngrx/store';

export const EmojiActions = createActionGroup({
  source: 'Emoji',
  events: {
    used: (glyphs: readonly string[]) => ({ glyphs }),
  },
});
