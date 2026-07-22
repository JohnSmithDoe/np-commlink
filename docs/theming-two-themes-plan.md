# Two themes: "Cyberpunk" (default) + "OK Boomer" (plain office)

> **Status: implemented** (main, trunk-based — see `git log --grep "feat(theme)"`).
> Theme rides the eager `settings` slice; picker on `/settings`; boot splash;
> plain base + `[data-theme='cyberpunk']` opt-in + flip tokens. The sections
> below are the design record; the CLAUDE.md "Theming" section is authoritative.

## Context — why this change

np-commlink ships **one** look: the Shadowrun cyberdeck (dark slate, amber+teal
neon, monospace, uppercase, glow, scanlines, HUD corner-brackets, gradient
backdrops). We want a **second, opt-in theme — "OK Boomer"**: a plain, serious,
office-usable style (light, sans-serif, sentence case, flat surfaces, no neon)
that can be shown in a professional setting without the cyberpunk flourish.

The existing "second-theme seam" (`src/theme/palettes/_example.scss`, a
`.ion-palette-<name>` color-override block) is **recolor-only** — it cannot turn
off the *structural* effects that make the app cyberpunk (case, tracking, glow,
scanlines, brackets, gradients). A genuinely plain theme has to neutralize
those, so the seam is insufficient and is replaced by the model below.

Reference: the sibling app `np-my-little-cv` already ships this exact
two-theme concept (serious default + nerdy CRT via `:root[data-theme='…']` +
a signal service). We mirror its architecture, adapted to np-commlink's
CSR/PWA + NgRx + `@ionic/storage` conventions.

## Decisions (agreed)

1. **Structure: plain = base, cyberpunk = opt-in.** The bare `:root` holds the
   plain palette + neutralized effect tokens; all cyberpunk decoration lives
   under `:root[data-theme='cyberpunk']` (and `:host-context([data-theme='cyberpunk'])`
   in component styles). This makes "serious looks serious" true *by
   construction* — a component with no theme-awareness renders plain, and only
   opts into flourish. Robust against future cyber additions leaking into plain.
2. **Cyberpunk still ships as the DEFAULT selection.** The `theme` slice
   initializes to `'cyberpunk'`, so the app sets `data-theme='cyberpunk'` unless
   the user chose "OK Boomer". First-run and existing users see no change.
3. **Persistence: theme rides on the eager app-global `settings` slice** (a
   `theme: TTheme` field on `ISettings`, default `'cyberpunk'`) — no separate
   theme slice. Persisted via the existing `@ionic/storage` per-key port
   (`npc-settings`), loaded at boot by `SettingsActions.load()` in `main.ts`'s
   `provideAppInitializer`. **No `localStorage`.**
4. **No flash-of-wrong-theme via a neutral splash, not an inline script.** The
   initial shell is theme-neutral; a full-screen splash (identical on web and
   native) covers boot until the theme slice's `loaded` fires and `data-theme`
   is applied underneath — then the splash is revealed away. The splash *is* the
   FOUC gate (the flashing chrome — `ion-menu`, `ion-app` bg — lives in the app
   shell *above* the router outlet, so a route resolver can't cover it; an
   eager-load-gated splash can).
5. **Splash uses `@capacitor/splash-screen` on native + an inline HTML overlay
   on web**, behind one `reveal()`. The plugin's web impl is a no-op (a browser
   tab has no OS launch screen), so desktop/PWA needs its own overlay; native
   uses the plugin with `launchAutoHide:false`. Native splash config is
   re-applied by `scripts/android-postsync.sh` (survives `cap sync`).

## Not chosen (and why)

- **Angular App Shell (`ng generate app-shell`)** — needs the SSR/prerender
  toolchain we don't have, its FCP benefit doesn't apply to a local-asset APK,
  and its build-time-baked shell can't be theme-neutral (reintroduces the
  hydration-mismatch trap). Our inline HTML splash is a right-sized hand-rolled
  shell.
- **Inline `localStorage` boot script** — would kill the flash with less code,
  but the user prefers keeping persistence in the app's NgRx + `@ionic/storage`
  layer; the neutral splash achieves the same no-flash result without
  `localStorage`.
- **Cyberpunk = base, boomer = suppress-override** — lower churn but fragile
  (every future cyber flourish must be manually re-suppressed). Rejected in
  favor of the robust base-flip (decision 1).

## Token model

Two axes of tokens:

- **Invariant** (unchanged across themes): spacing, the `--sr-mono` *literal*
  mono stack (referenced by the flip token below), red/danger semantics.
- **Theme-varying** — declared with **plain values on base `:root`**, overridden
  in the `:root[data-theme='cyberpunk']` block. Every hue derives from this one
  group (as today). New **flip tokens** turn structural axes into overridable
  values so components don't need per-theme selectors for typography:

  | token | plain (`:root`) | cyberpunk (`[data-theme='cyberpunk']`) |
  |---|---|---|
  | `--sr-deck-font` | system sans stack | `var(--sr-mono)` |
  | `--sr-heading-transform` | `none` | `uppercase` |
  | `--sr-heading-tracking` | `normal` | `0.1em` |
  | `--sr-label-transform` | `none` | `uppercase` |
  | `--sr-label-tracking` | `0.02em` | `0.14em` |
  | `--sr-brand-transform` | `none` | `lowercase` |
  | `--sr-radius` | `6px` | `2px` |
  | `--sr-glow` / `--sr-glow-lg` | `none` | (amber bloom, current values) |
  | `--sr-line` | `rgba(0,0,0,.12)` | `rgba(amber,.35)` |
  | palette (`--sr-bg/panel/panel-2/toolbar/bg-hi/mid/lo/text/text-dim`) + `--ion-color-primary/secondary` + `--ion-background/text/toolbar/item` | OK Boomer light values | current cyber values |

**Structural effects that can't be a single token** (gradient functions,
`::after` scanlines, bracket geometry, LED glow + `@keyframes`, hud-frame
gradient + inset bevel, radial content backdrop) become the **cyberpunk layer**:
the base rule is flat/plain, and the decorated variant is emitted under
`:root[data-theme='cyberpunk'] …`. `_deck.scss` mixins stay the source of the
cyber flourish; base surfaces use flat `background: var(--sr-panel); border:1px
solid var(--sr-line); border-radius: var(--sr-radius)`.

## OK Boomer palette (initial values — tunable)

Serious, light, office. Starting point (WCAG-AA against white/light slate):

- `--sr-bg: #f4f6f8`, `--sr-panel: #ffffff`, `--sr-panel-2: #ffffff`,
  `--sr-toolbar: #ffffff`, backdrop stops all `#f4f6f8` (flat).
- `--sr-text: #1f2733`, `--sr-text-dim: #5b6472`.
- `--ion-color-primary: #2f5bd0` (calm corporate blue), contrast `#ffffff`.
- `--ion-color-secondary: #4b6b7a` (slate teal), contrast `#ffffff`.
- `--sr-line: rgba(15,23,42,.12)`, `--sr-deck-font: system-ui, -apple-system,
  'Segoe UI', Roboto, Helvetica, Arial, sans-serif`.

## Files

- **Theme on the `settings` slice** `src/app/@shared/data/settings/`:
  `theme: TTheme` on `ISettings` (default `'cyberpunk'`), `SettingsActions.setTheme`,
  reducer handler, `selectTheme`, and `settings.effects.ts` `applyTheme$` /
  `revealSplash$` / `persistTheme$` (all `{dispatch:false}`). `TTheme` in
  `@shared/types.ts`. (No separate theme slice — folded per the settings re-scope.)
- **New — services (`@shared/util`)**: `theme.service.ts` `apply(theme)` →
  `document.documentElement.dataset.theme` + `<meta name=theme-color>` + native
  `StatusBar`; `splash.service.ts` `reveal()` (native `SplashScreen.hide()` +
  remove `#app-splash`, idempotent, armed with a ~3s timeout fallback). Both are
  DOM/Capacitor utils (no Store) → sheriff `util → model/external`. The
  store→DOM bridge is the effect layer (data → util).
- **Wiring** `src/main.ts`: register `theme` in `provideStore` + effects;
  dispatch `ThemeActions.load()` in `provideAppInitializer`.
- **Theme SCSS** `src/theme/_shadowrun.scss` + `variables.scss` + `_deck.scss`:
  base=plain, `[data-theme='cyberpunk']` block, flip tokens, gated effects.
- **Components** ~14 SCSS: literals → flip tokens; keyframe/gradient/glitch
  decorations gated under `:host-context([data-theme='cyberpunk'])`
  (`commlink.page.scss`, `kitchen.page.scss`, `tracking-item`, `game-play`,
  `cash/**`). ~7 are already portable (token-only).
- **Splash** `src/index.html` (neutral body + `#app-splash` overlay, neutral
  `theme-color`/`color-scheme`), `capacitor.config.ts` (`SplashScreen`
  plugin block), `scripts/android-postsync.sh` (re-apply splash config).
  Install `@capacitor/splash-screen`.
- **Toggle UI** settings page (`office-time/feature/settings-page`): an
  `ion-segment`/`ion-select` dispatching `ThemeActions.set`. i18n de/en keys.

## Verification

1. `pnpm run build` (prod) — clean.
2. `pnpm exec eslint "src/**/*.ts"` + `pnpm exec sheriff verify` — clean.
3. `pnpm test` — new `theme.reducer`/`theme.selector` specs pass; existing green.
4. `pnpm start` + `/screenshot`: default `/commlink` unchanged (cyberpunk);
   toggle → "OK Boomer" renders light/plain (no glow/scanlines/brackets, sans,
   sentence case) across commlink, a cash page, a grocery list, settings.
5. Reload after choosing OK Boomer → theme persists, splash covers boot, **no
   flash** of cyberpunk. Choose cyberpunk → persists likewise.
6. Android: `pnpm run build && npx cap sync android && ./scripts/android-postsync.sh`
   → native splash holds through boot, hides on reveal; both themes render.
