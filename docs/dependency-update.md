# Dependency update

The full update, phase by phase. A phase is deleted from this file when it lands; the file and its
CLAUDE.md row go with the last one. Versions and peer ranges are as read from the registry on
2026-10-17 — re-read them when a phase starts.

## The gates

| Group | Now → target | What gates it |
| --- | --- | --- |
| Angular (core family, cli, build, cdk) | 21.2 → 22.2 | TypeScript `>=6.0 <6.1`; Node `^22.22.3 \|\| ^24.15 \|\| >=26` |
| NgRx (all packages, eslint-plugin) | 21.1 → 22.0 | Angular `^22` |
| angular-eslint (+ builder, schematics) | 21.4 → 22.6 | typescript-eslint `^8`; ESLint `^9 \|\| ^10` |
| TypeScript | 5.9 → **6.0** | **7.x is out of reach**: Angular, typescript-eslint and the Ionic toolkit all cap `<6.1` |
| typescript-eslint | 8.65 → 8.71 | TypeScript `<6.1` |
| Ionic angular-toolkit | 12.3 → 13.0 | TypeScript `<6.1`; devkit `>=21 <23` |
| Ionic (angular, core) + ionicons | 8.8 → 9.0, 7.4 → 8.1 | its own major — phase 7 |
| Vitest + coverage-v8, jsdom | 4.1 → 5.0, 29 → 30 | Angular's builder 22 accepts Vitest `^4.0.8 \|\| ^5` |
| ESLint, unicorn, Sheriff | 9.39 → 10.12, 65 → 78, 0.19 → 0.20 | unicorn 78 requires ESLint `>=10.4`; every other plugin accepts 10 |
| ng2-charts | 9 → 11 | 11 requires Angular `>=22` |
| ngx-translate-extract-marker | 2.0 → 3.0 | none |

`engines.node` in `package.json` rises from `>=22.18` to `^22.22.3 || ^24.15.0 || >=26` with
phase 1, matching Angular's builder. `.nvmrc` stays `22`.

Already answered, not work:

- **The router's `paramsInheritanceStrategy` default becomes `'always'`** — no parameterised route has
  children, and every `data`/`resolve` sits on a componentless or empty-path parent `'emptyOnly'`
  already inherits from. Accept the default.
- **OnPush becomes the default** — every component already declares it.
- **`strictTemplates` defaults to true** — already set.

Every phase is green on lint, test and build per commit, and on `verify:all` per phase. Phases 4–8
are independent once phase 1 has landed.

Owed from the in-range bumps (Capacitor 8.5): `pnpm run apk:debug` on a device.

## Phase 1 — Angular 22, one lockstep commit

- `ng update` Angular core and cli, then NgRx store, then angular-eslint; bump typescript-eslint,
  the NgRx eslint plugin and the Ionic toolkit by hand; raise `engines.node`.
- The `ng update` migrations that apply: `change-detection-eager`, `strict-safe-navigation-narrow`
  (switches the two new nullability diagnostics off), `safe-optional-chaining` (wraps `?.` in
  `$safeNavigationMigration()`), `model-output`. The other four are no-ops here.
- TypeScript 6: drop `baseUrl` from `tsconfig.json` — no `paths`, no bare imports lean on it. No
  `ignoreDeprecations`.
- Fix the build: Signal Forms' experimental → stable renames, binding conflicts, `data-*` inputs.
- `ng generate @angular/core:cleanup-unused-imports`. Every other `ng generate` migration matches
  nothing here: no NgModules, decorator inputs/outputs/queries, structural directives, `ngClass`,
  `ngStyle`, `CommonModule`, constructor injection or eager route components.

## Phase 2 — take the opt-outs back out

- Unwrap every `$safeNavigationMigration(…)`, remove the diagnostics opt-out, and delete each `?.`/`??`
  the new diagnostics call dead.
- Delete `changeDetection: ChangeDetectionStrategy.OnPush` from every component — it is the default,
  so it says nothing — and the `Eager` the migration put on three spec test hosts.

## Phase 3 — `@Service`

- `ng generate @angular/core:service`: root-provided classes become `@Service()`, scoped ones
  `@Service({ autoProvided: false })`. Check what it does with the route-provided facades.
- **Same commit:** the `no-restricted-syntax` selector in `eslint.config.js` that keeps services out
  of `util/` matches the decorator **by name**, so after the rename it fires on nothing. Widen it to
  `/^(Injectable|Service)$/`, update CLAUDE.md's hard-rules row, and prove it with a throwaway
  `@Service()` in a `util/` file that must fail lint. The footgun goes into
  [footguns.md](./footguns.md).

## Phase 4 — error boundaries

- **Spec first**: does `@boundary` around `ion-router-outlet` catch a routed page that throws? Yes →
  one boundary in `src/app/@shared/feature/module-tabs-page/` and one at the root outlet. No → one per
  program's top-level page.
- One `@shared` fallback with a `$reset` retry; its wording is `@shared`'s own.
- `src/app/@shared/data/errors/global-error-handler.ts` implements `onViewError`: a contained view
  error is logged with the failing component's class and does not raise the reload alert.
  `ErrorDetails` is developer preview in 22.2.
- Where the boundaries sit, and why, goes into [decisions.md](./decisions.md).

## Phase 5 — ESLint 10

- ESLint 10, unicorn 78, Sheriff 0.20; read each changelog.
- Every new unicorn rule is adopted or switched off with its reason in `eslint.config.js`.
- `pnpm run test:plugin`, and re-check that each "gate goes silently inert" footgun still fires.

## Phase 6 — Vitest 5

- Vitest and coverage-v8 to 5, jsdom to 30.
- Vitest 5 clears mocks before each test by default. Keep that default; fix any spec that counted
  calls across tests.
- The coverage floors in `angular.json` must still hold.

## Phase 7 — Ionic 9 and ionicons 8

- Ionic's v9 migrate tool moves every standalone import to the package root and reports the rest.
- What reaches us: `ion-select`'s `ionChange` timing and its action sheet's `selected` role (96
  selects), the modal handle's default behaviour, the md textarea's taller minimum. Our SCSS targets
  none of the restructured input internals; Ionic 9's zoneless default is what we already run.
- Re-verify every [footguns.md](./footguns.md) entry about `ion-button` relocating `aria-*` into its
  shadow root — the `@angular/aria` step after this one stands on it.
- Visible change: flag `"shotsStale": true` on the handbook pages showing selects, modals and
  textareas.
- CLAUDE.md's opening line moves to Ionic 9 and Angular 22.

## Phase 8 — the rest

- ng2-charts 11 and ngx-translate-extract-marker 3, each after reading its changelog.
- `pnpm run i18n:extract` leaves no diff.

## When the last phase lands

- [state.md](./state.md)'s "Waiting on upstream" loses the Angular 22 entry and gains TypeScript 7.
- The lockstep rule — Angular, its cli and builder, angular-eslint, NgRx and TypeScript move in one
  commit or not at all — moves to [decisions.md](./decisions.md); it is owed again at 23.
- [next-version.md](./next-version.md): `@angular/aria` is no longer gated.

No phase changes a persisted shape, a storage key or `APP_VERSION`.
