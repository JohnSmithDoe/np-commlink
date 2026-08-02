# Theming — the parts that are not in one file

**Rule of thumb: retheme the CSS custom properties, never the components one by one.**

Most of this section used to live here and now lives in the style layer itself, because it was always
about one file each:

| For | Read |
| --- | --- |
| The layer as a whole — two themes off one token group, `<html data-theme>`, the `@use` graph and what a component may `@use` | `src/global.scss` |
| The `--sr-*` tokens, the type scale, the `.sr-*` primitives | `src/theme/_shadowrun.scss` |
| The Ionic `--ion-*` chrome and the per-theme flip | `src/theme/variables.scss` |
| The deck mixins, and why the file emits nothing | `src/theme/_deck.scss` |
| The wide-screen numbers, and why they are one contract | `src/theme/_layout.scss` |
| The self-hosted deck font | `src/theme/_fonts.scss` |
| The theme-keyed deck labels | [deck-catalog.md](./deck-catalog.md) |

What is left here is what spans TypeScript, HTML and SCSS at once, and therefore has no header to
sit in.

## No flash of the wrong theme — a splash, not an inline script

The theme is read from the eager `settings` slice (`npc-settings`, no `localStorage` except the
language boot mirror), so it resolves **after** first paint. A full-screen splash covers boot until
`theme.service` has written `<html data-theme>` underneath it. The splash _is_ the FOUC gate: the
flashing chrome (`ion-menu`, the `ion-app` background) lives in the app shell _above_ the router
outlet, so no route resolver can cover it. An inline `localStorage` boot script would kill the flash
with less code; persistence staying in the NgRx + `@ionic/storage` layer is the trade taken.

**The splash carries no text, by construction.** It paints before the stylesheet and before
`settings`, so it can read neither a token nor the theme — and a wordmark would need a font that
cannot have loaded yet, since `--sr-mono`'s webfont arrives _with_ the global CSS. It is one inline
SVG of the np mark (paths, never text), monochrome and `currentColor`, over a backdrop picked by
**`prefers-color-scheme`** — a *guess* at the theme rather than a read of it, and deliberately the
most a document can commit to before either answer arrives. Inlined rather than `<img src>`, because
a request would leave it blank for exactly the window it exists to cover; that is also why those
paths live twice, in `index.html` and `public/np-logo.svg`.

**`background_color` is the one theme mirror that cannot be fixed.** `ThemeService` flips the
`theme-color` *meta* at runtime, but a manifest is read before any code runs and paints the PWA
install/launch screen — so an OK Boomer user who installs the app gets a dark launch screen,
permanently. One manifest, two themes, no runtime hook.

**Implementation spans three places behind one `reveal()`** (`@shared/util/services/splash.service`,
idempotent, ~3 s timeout fallback): `@capacitor/splash-screen` with `launchAutoHide: false` on
native, re-applied by `scripts/android-postsync.sh`; an inline `#app-splash` overlay on web, because
the plugin's web implementation is a no-op. Angular App Shell was rejected — it needs an
SSR/prerender toolchain we do not have, its FCP benefit does not apply to a local-asset APK, and its
build-time-baked shell cannot be theme-neutral.

Two details of `reveal()` are load-bearing. It sets **`pointer-events: none`** with the fade-out
class, because opacity does not affect hit-testing and an invisible full-bleed overlay at
`z-index 99999` otherwise swallows the first press for the whole fade. And it removes the element on
**`transitionend`**, not on a timer equal to the CSS duration: that duration existed twice, a TS
const and a stylesheet value, with nothing holding them equal, so either edit alone would truncate
the fade or park an invisible overlay. The remaining timeout is deliberately *not* the same number,
because a ceiling is not a mirror. With scripting disabled nothing calls `reveal()`, so a
`<noscript><style>` in the head hides `#app-splash` — otherwise the splash covers the one message
that exists for that exact condition.

## Width on a wide screen — one property, four files

There is exactly one width mechanism, and it is a custom property rather than a breakpoint:
`--app-content-max-width`, declared on `:root` in `global.scss` and applied to **`ion-content > *`** —
every direct child, _independently_. That last word is the whole reason this section exists. A page
does not have one content box; it has as many as it projects, and each one centres itself.

**A page changes its width by re-declaring the property on `:host`, never by fighting the rule.**
Three pages take `100%` (`commlink`, `office-time`, `geist` — they are dashboards, not documents) and
the shared list page takes `src/theme/_layout.scss`'s `$content-wide`. Because custom properties inherit
through the flattened DOM, a value set on `app-list-page` reaches both `ion-content`'s children and
the rows `app-page-header` projects into `ion-header` — which is what lets a header row and the list
body agree on an edge despite living in different Ionic containers.

**That agreement is a convention, not a guarantee**, and it is the one thing worth checking when a
list page looks wrong on desktop. Before `_layout.scss` the searchbar took `420px` hard-right above
768px while the sort toolbar beneath it centred on the property — three edges in one header, which
read as a bug rather than a hierarchy. Any new component projected into a list header has to read the
same property or it re-introduces exactly that. `e2e/desktop/list-layout.e2e.ts` asserts the edges by
bounding box for that reason; nothing in the type system can.

**Above `$wide` a list flows into columns instead of stretching.** Widening the column without the
grid is the failure mode — rows get longer, not more numerous — so the two numbers are one contract:
`$content-wide ÷ $list-column-min` _is_ the column count. `$wide` deliberately sits above the bare
two-column arithmetic, because a portrait tablet fits two columns and still reads worse as two.

Only `desktop-chromium` is wide enough to enter that media query (Playwright's 1280×720 default), and
`e2e/desktop/**` is the only path it matches — so a layout assertion written anywhere else in the
suite is vacuously true on the emulated Pixel 5.

## Accent overrides — the one theme value a user can set

The theme picks a whole look; the **accent pair** inside it is separately overridable, and the
mechanism is TypeScript rather than SCSS — the stylesheet is the thing being overridden. `/settings`
carries two `<input type="color">`s and a reset, writing
`SettingsActions.setAccentColors(theme, {primary, secondary})` / `resetAccentColors(theme)` into
`SettingsState.customAccents` — a `Partial<Record<Theme, AccentColors>>`, so an override is **per
theme**, switching theme switches which is in effect, and it is optional on the persisted doc, which
is what keeps it migration-free.

Four decisions rather than mechanics:

- **A hex is not a colour to Ionic — it is six.** `deriveIonicColorSet`
  (`@shared/util/theme/ionic-color.utils.ts`) expands one hex into the whole
  `--ion-color-<key>{,-rgb,-contrast,-contrast-rgb,-shade,-tint}` family, because every Ionic
  component reads a different member and a base alone leaves shades stale. Shade is 12% toward
  black, tint 10% toward white, contrast the **YIQ ≥ 128** flip — all three verified against the
  shipped tuples in `variables.scss`, the deck's teal `#32aea6` being the one close enough to the
  boundary (YIQ ≈ 136) that a wrong threshold would flip it visibly.
- **Overrides are applied as inline custom properties on `<html>` and win by cascade order**, not by
  editing the SCSS rule — which is why they compose with `data-theme` instead of competing with it.
- **`#applyAccentColor` always clears all six vars before re-setting any.** That clearing *is* the
  reset and the theme switch: without it a stale override would survive both, since nothing else
  removes an inline property.
- **The default swatches live in TS as well as SCSS** (`DEFAULT_ACCENT_SWATCHES` in
  `settings.page.ts`), because a colour input has to be *seeded* with the value in effect and cannot
  read a `var()`. Same duplication `THEME_COLOR` already accepts, and the same caveat: change a
  theme's accent in `variables.scss` and this copy has to follow.

## Adding a third theme

Two halves, and only one of them needs writing down.

**The SCSS half:** plain-relative values on the base `:root`, then a `:root[data-theme='<name>']`
override block. Do **not** import Ionic's prebuilt `dark.class.css`.

**The TypeScript half is enforced by the compiler, so it is not a checklist.** `Theme`, `THEMES`,
`THEME_LABEL_KEYS`, `THEME_COLOR`, `DEFAULT_ACCENT_SWATCHES`, the per-entry `labels` on every deck
catalog entry and `DECK_CHROME_LABELS` are all `Record<Theme, …>` — adding a union member fails to
compile until every one of them grows, and `deck.catalog.spec.ts` then catches a key the message
bundles are missing. Listing them here would only restate a set that cannot be forgotten.

What the types cannot tell you is the one judgement: **`DECK_CHROME_LABELS` is where a theme's voice
lives.** A field names a HUD slot, not a word — so the `noise` slot is `Rauschen` under cyberpunk and
`Ungelesen` under OK Boomer. A third theme has to decide how it *talks*, not just how it looks.
