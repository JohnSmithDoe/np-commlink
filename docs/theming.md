# Theming — two themes off one token group

> Part of the np-commlink compendium. Index and §-to-file map:
> [project-summary.md](./project-summary.md). Section numbers are stable across the split.
>
> **Here:** §8 — cyberpunk vs OK Boomer, the five theme decisions (plain = base, splash instead of
> an inline script, …), the flip-token model, and the checklist for adding a third theme.
> **Rule of thumb:** retheme the CSS custom properties, never the components one by one.
> **See also:** the theme-keyed deck labels (§7.1) → [deck-catalog.md](./deck-catalog.md).

## 8. Theming — two themes

**Two** themes off one token group: **cyberpunk** — the Shadowrun deck (near-black slate, amber +
teal neon, monospace, glow, HUD frame; the **default**) — and **OK Boomer** — a plain, light,
serious office look (sans-serif, flat surfaces, sentence case, no neon), showable in a professional
setting.

The old second-theme seam (a `.ion-palette-<name>` override block, kept for a while as an
all-comments `theme/palettes/_example.scss`) was **recolor-only** — it cannot turn off the
_structural_ effects that make the app cyberpunk (case, tracking, glow, scanlines, brackets,
gradients), so it was replaced by the model below, and the example file has since been deleted:
`src/theme/` should offer one answer to "how do I add a theme", not two. **Do not restyle components
one by one — retheme the CSS custom properties.**

The active theme is the **`<html data-theme>`** attribute, driven by the eager `settings` slice
(`selectTheme` · `SettingsActions.setTheme` · picker on `/settings`) and applied by
`SettingsEffects.applyTheme$` via `@shared/util/theme/theme.service` (which also sets `<meta theme-color>`
and the native status-bar style).

### Decisions

1. **Plain = base, cyberpunk = opt-in.** The bare `:root` holds the plain palette and neutralized
   effect tokens; all cyberpunk decoration lives under `:root[data-theme='cyberpunk']` (and
   `:host-context([data-theme='cyberpunk'])` in component styles). "Serious looks serious" becomes
   true _by construction_: a component with no theme-awareness renders plain and only opts into
   flourish, so future cyber additions cannot leak into plain. The inverse (cyberpunk = base, boomer =
   suppress) was lower churn but fragile — every future flourish would need manual re-suppression.
2. **Cyberpunk still ships as the default selection**, so first-run and existing users see no change.
3. **Theme rides the eager app-global `settings` slice**, not a separate theme slice — persisted via
   the existing per-key port (`npc-settings`). **No `localStorage`** (except the language boot
   mirror, §9).
4. **No flash-of-wrong-theme via a neutral splash, not an inline script.** The initial shell is
   theme-neutral; a full-screen splash covers boot until the theme is applied underneath, then is
   revealed away. The splash _is_ the FOUC gate — the flashing chrome (`ion-menu`, `ion-app` bg) lives
   in the app shell _above_ the router outlet, so a route resolver can't cover it. An inline
   `localStorage` boot script would kill the flash with less code, but persistence stays in the
   NgRx + `@ionic/storage` layer.

   **The splash therefore carries no text, by construction.** It paints before the stylesheet and
   before `settings`, so it can read neither a token nor the theme — and a wordmark would need a font
   that cannot have loaded yet, since `--sr-mono`'s webfont arrives _with_ the global CSS. Every
   string in it was also a second source of truth: it read `np-commlink` while the title and manifest
   read `CommLink`. It is one inline SVG of the np mark instead (paths, never text), monochrome and
   `currentColor`, over a backdrop picked by **`prefers-color-scheme`** from each theme's own
   `--sr-bg`/`--sr-text`. That is a _guess_ at the theme rather than a read of it, and deliberately
   the most a document can commit to before either answer arrives. Inlined rather than `<img src>`,
   because a request would leave the splash blank for exactly the window it exists to cover — which
   is also why those paths live twice, in `index.html` and `public/np-logo.svg`.

   **`background_color` is the one theme mirror that cannot be fixed.** `ThemeService` flips the
   `theme-color` _meta_ at runtime, but a manifest is read before any code runs and paints the PWA
   install/launch screen — so a boomer user who installs the app gets a dark launch screen,
   permanently. One manifest, two themes; there is no runtime hook to fix it with.
5. **Splash: `@capacitor/splash-screen` on native + an inline HTML overlay on web**, behind one
   `reveal()` (`@shared/util/services/splash.service`, idempotent, armed with a ~3 s timeout fallback). The
   plugin's web impl is a no-op, so desktop/PWA needs its own `#app-splash`; native uses
   `launchAutoHide: false`. Native splash config is re-applied by `scripts/android-postsync.sh`.
   Angular App Shell was rejected: it needs an SSR/prerender toolchain we don't have, its FCP benefit
   doesn't apply to a local-asset APK, and its build-time-baked shell can't be theme-neutral.

   Two details of `reveal()` are load-bearing. It sets **`pointer-events: none`** with the fade-out
   class, because opacity does not affect hit-testing — an invisible full-bleed overlay at
   `z-index 99999` otherwise swallows the first press on the revealed app for the whole fade. And it
   removes the element on **`transitionend`**, not on a timer equal to the CSS duration: that duration
   existed twice (a TS const and a stylesheet value) with nothing holding them equal, so either edit
   alone would truncate the fade or park an invisible overlay. The net that remains is deliberately
   _not_ the same number, because a ceiling is not a mirror; `FADE_MS` survives only as
   `NATIVE_FADE_MS`, which is a real plugin parameter rather than a copy of ours. With scripting
   disabled nothing calls `reveal()` at all, so a `<noscript><style>` in the head hides `#app-splash`
   — otherwise the splash covers the one message that exists for that exact condition.

### Token model

**Invariant** across themes: spacing, the `--sr-mono` literal stack, red/danger semantics. That
stack's first entry is **self-hosted** — see _The deck font_ below.
**Theme-varying:** plain values on base `:root`, overridden in `:root[data-theme='cyberpunk']`. New
**flip tokens** turn structural axes into values so components reference a token, never a literal:

| token                                   | plain (`:root`)   | cyberpunk                     |
| --------------------------------------- | ----------------- | ----------------------------- |
| `--sr-deck-font`                        | system sans stack | `var(--sr-mono)`              |
| `--sr-heading-transform` / `-tracking`  | `none` / `normal` | `uppercase` / `0.1em`         |
| `--sr-label-transform` / `-tracking`    | `none` / `0.02em` | `uppercase` / `0.14em`        |
| `--sr-brand-transform`                  | `none`            | `lowercase`                   |
| `--sr-radius`                           | `6px`             | `2px`                         |
| `--sr-glow` / `--sr-glow-lg`            | `none`            | amber bloom                   |
| `--sr-line`                             | `rgba(0,0,0,.12)` | `rgba(amber,.35)`             |
| palette + `--ion-color-*`               | OK Boomer light   | cyber slate/amber/teal        |

OK Boomer starting values (WCAG-AA against white/light slate): `--sr-bg #f4f6f8`,
`--sr-panel/-2/-toolbar #ffffff`, `--sr-text #1f2733`, `--sr-text-dim #5b6472`,
`--ion-color-primary #2f5bd0` (calm corporate blue), `--ion-color-secondary #4b6b7a` (slate teal),
`--sr-line rgba(15,23,42,.12)`.

**Structural effects that can't be one token** (gradient functions, `::after` scanlines, bracket
geometry, LED glow + `@keyframes`, hud-frame gradient + inset bevel, radial backdrop) become the
**cyberpunk layer**: the base rule is flat, the decorated variant emitted under the deck selector.

Files: `src/theme/_shadowrun.scss` owns the `--sr-*` palette, `variables.scss` the Ionic `--ion-*`
chrome, both `@use`d once from `src/global.scss` (which also carries the Android safe-area map and
`body.scanner-active` transparency). Deck signature pieces are **theme-aware Sass mixins** in the
side-effect-free `src/theme/_deck.scss`: `panel-base` (flat) vs `panel-cyber` (gradient + bevel),
`led-base` vs `led-glow` (bloom + pulse), `hud-corners`, `brand`, plus the two theme-invariant
recipes `hud-label` (eyebrow typography, colour deliberately excluded) and `status-bar` (the row's
leading colour bar); `_shadowrun.scss` wraps them as the global
`.sr-panel`/`.sr-corners`/`.sr-led*`/`.sr-brand*`/`.sr-hud`/`.sr-status-bar` classes, and
`_cash.scss` + the report/recipe surfaces `@include hud-label` where they paint their own colour.
`led-glow` declares its pulse inside `prefers-reduced-motion: no-preference` rather than letting a
later `reduce` block switch it off — a media query adds no specificity, so a `reduce` opt-out cannot
out-weigh `:root[data-theme='cyberpunk'] .sr-led--on` and silently lost. Consume via `var(--sr-*)` / the
`.sr-*` classes, or `@use 'theme/deck'` + `@include` where a class can't reach (`:host`,
pseudo-elements); **never `@use 'theme/shadowrun'` from a component** — it emits global CSS.

**That bare `theme/…` path needs `stylePreprocessorOptions.includePaths: ["src"]`, and did not have it
until 2026-08-01.** The idiom was documented in three places (here, `CLAUDE.md`, and comments in
`_deck.scss` + `_shadowrun.scss`) and had never been executed: the only bare `@use 'theme/…'` lines in
the tree are in `src/global.scss`, where they resolve because `global.scss` *is* in `src/` — a relative
path that happens to read like a load-path one. Every component reaching a partial went the long way
(`@use '../../../../theme/dashboard'`, ten sites). Planting `@use 'theme/deck'` in a component
stylesheet failed with `Can't find stylesheet to import`, and the same line compiles with `includePaths`
set. Both forms work now; the bare one is preferred because a relative `../../../../` silently breaks
when the file moves. **Pattern:** an idiom nothing in the tree exercises is a claim, not a convention —
and the only way to tell them apart is to run it.

`/commlink` is the reference cyberpunk expression; `/soykaf`, `/geist`, `/trackplay` and the
grocery/office-time pages read the same shared classes. Chart palettes are tokenised via
`@shared/util/charts/chart-colors`, which reads the live theme tokens.

### Accent overrides — the one theme value a user can set (`d79e75e`)

The theme picks a whole look; the **accent pair** inside it is separately overridable. `/settings`
carries two `<input type="color">`s and a reset, writing
`SettingsActions.setAccentColors(theme, {primary, secondary})` / `resetAccentColors(theme)` into
`ISettingsState.customAccents` — a `Partial<Record<TTheme, IAccentColors>>`, so an override is
**per theme** and switching theme switches which override is in effect (or none). It is optional on
the persisted doc, which is what keeps it migration-free.

Four things about it are decisions rather than mechanics:

- **A hex is not a colour to Ionic — it is six.** `deriveIonicColorSet`
  (`@shared/util/theme/ionic-color.utils.ts`) expands one hex into the whole
  `--ion-color-<key>{,-rgb,-contrast,-contrast-rgb,-shade,-tint}` family, because every Ionic
  component reads a different member and a base alone leaves shades stale. Shade is 12% toward
  black, tint 10% toward white, and contrast is the **YIQ ≥ 128** flip — all three verified against
  the shipped tuples in `variables.scss`, the deck's teal `#32aea6` being the one that sits close
  enough to the boundary (YIQ ≈ 136) that a wrong threshold would flip it visibly.
- **Overrides are applied as inline custom properties on `<html>`, and win by cascade order**, not by
  editing the SCSS rule — which is why they compose with `data-theme` instead of competing with it
  (`ThemeService.apply(theme, accents)`).
- **`#applyAccentColor` always clears all six vars before re-setting any.** That clearing *is* the
  reset and the theme switch: without it a stale override would survive both, since nothing else
  removes an inline property.
- **The default swatches live in TS as well as SCSS** (`DEFAULT_ACCENT_SWATCHES` in
  `settings.page.ts`), because a colour input has to be *seeded* with the value in effect and cannot
  read a `var()`. Same duplication `THEME_COLOR` already accepts in `ThemeService`, and the same
  caveat: change a theme's accent in `variables.scss` and this copy has to follow.

A third theme therefore grows this too — `DEFAULT_ACCENT_SWATCHES` is a `Record<TTheme, …>`, so it
is one of the compile errors listed under _Adding a third theme_.

### The deck font

**JetBrains Mono is self-hosted**, five latin-subset weights in `src/assets/fonts/`, declared as one
`@font-face` per weight in `src/theme/_fonts.scss` (`@use`d from `global.scss`). It was named in
`--sr-mono` and loaded nowhere for a long time, and because cyberpunk's `--sr-deck-font` _is_ that
stack, the entire default theme rendered in `ui-monospace` for anyone without the font installed
locally — which developers usually have, and is exactly why it went unnoticed.

Three things about it are decisions rather than defaults:

- **All five weights are declared** though the app's own CSS names only 400/600/700 — Ionic's shadow
  styles ask for 500, and an undeclared weight is _synthesised_ by the browser (faux-bold, visibly
  worse). A declared face nobody matches is never fetched, so the extra two cost nothing at runtime.
- **`font-display: swap`**, which is why the rest of the `--sr-mono` fallback stack still matters: it
  is what paints until the woff2 arrives, not dead weight behind a name.
- **The files are not in `public/`**, and that is load-bearing — see §11
  ([build-and-deploy.md](./build-and-deploy.md)) for the `url()` resolution trap and the ngsw prefetch
  group.

### Adding a third theme

Add plain-relative values on base `:root`, a `:root[data-theme='<name>']` override block, a `TTheme`
union member (the picker renders from `THEMES` + `THEME_LABEL_KEYS`, both `Record<TTheme,…>`), its
entry in `DEFAULT_ACCENT_SWATCHES` and in `THEME_COLOR` (both `Record<TTheme,…>` too — see _Accent
overrides_ for why those two duplicate SCSS values in TS), **and two full key blocks — a `labels` entry per catalog entry _and_ a `DECK_CHROME_LABELS` block for all
19 HUD slots** — declared in code as well as filled in both message bundles. Both are
`Record<TTheme,…>`, so the code half **fails to compile** until complete, and `deck.catalog.spec.ts`
then catches a key the bundles are missing. The chrome block is where a theme's **voice** lives: a
field names a HUD slot, not a word, so OK Boomer fills "noise" with `Ungelesen` where cyberpunk fills
it with `Rauschen`. Do **not** import Ionic's prebuilt `dark.class.css`.

