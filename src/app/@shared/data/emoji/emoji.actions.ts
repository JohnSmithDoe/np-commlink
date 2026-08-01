import { createActionGroup } from '@ngrx/store';

// Published "an emoji was used" contract — the third of @shared's write-only
// action groups, and the same inversion as `DashboardActions`/`NotificationsActions`:
// the producer names a domain-blind action and stays ignorant of who folds it.
//
// It has to be one, because the producer and the owner sit on opposite sides of
// two seals. The recents themselves live on the app-global `settings` slice
// (they are a cross-cutting preference, like the theme and the language), but
// `domain:@shared` may not import `domain:settings` — so @shared cannot dispatch
// `SettingsActions` directly. `settings/data` folding a @shared action is the
// legal direction, exactly how the notifications reducer folds rows published by
// tracking.
//
// No selector ships beside this: the read side is a mirror signal
// (`EmojiRecentsService`), which is what keeps @shared naming no domain's store
// key.
export const EmojiActions = createActionGroup({
  source: 'Emoji',
  events: {
    // Emitted once per save, carrying every glyph found in the saved name —
    // never per tap, so an emoji picked and then deleted is not remembered.
    used: (glyphs: readonly string[]) => ({ glyphs }),
  },
});
