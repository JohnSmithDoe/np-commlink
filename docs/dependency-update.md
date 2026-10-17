# Dependency update

The full update, phase by phase. A phase is deleted from this file when it lands; the file and its
CLAUDE.md row go with the last one. Versions and peer ranges are as read from the registry on
2026-10-17 — re-read them when a phase starts.

## The gates

| Group | Now → target | What gates it |
| --- | --- | --- |
| Ionic (angular, core) + ionicons | 8.8 → 9.0, 7.4 → 8.1 | its own major — phase 7 |

TypeScript stays on 6.0: **7.x is out of reach** — Angular, typescript-eslint and the Ionic toolkit all
cap `<6.1`.

Every phase is green on lint, test and build per commit, and on `verify:all` per phase.

Owed from the in-range bumps (Capacitor 8.5): `pnpm run apk:debug` on a device.

## Phase 7 — Ionic 9 and ionicons 8

- Ionic's v9 migrate tool moves every standalone import to the package root and reports the rest.
- What reaches us: `ion-select`'s `ionChange` timing and its action sheet's `selected` role (96
  selects), the modal handle's default behaviour, the md textarea's taller minimum. Our SCSS targets
  none of the restructured input internals; Ionic 9's zoneless default is what we already run.
- If Ionic 9 no longer declares `zone.js` a required peer, drop the `!zone.js` hoist exclusion from
  `pnpm-workspace.yaml` and its [footguns.md](./footguns.md) entry.
- Re-verify every [footguns.md](./footguns.md) entry about `ion-button` relocating `aria-*` into its
  shadow root — the `@angular/aria` step after this one stands on it.
- Visible change: flag `"shotsStale": true` on the handbook pages showing selects, modals and
  textareas.
- CLAUDE.md's opening line moves to Ionic 9 and Angular 22.

## When the last phase lands

- [state.md](./state.md)'s "Waiting on upstream" loses the Angular 22 entry and gains TypeScript 7.
- The lockstep rule — Angular, its cli and builder, angular-eslint, NgRx and TypeScript move in one
  commit or not at all — moves to [decisions.md](./decisions.md); it is owed again at 23.
- [next-version.md](./next-version.md): `@angular/aria` is no longer gated.

No phase changes a persisted shape, a storage key or `APP_VERSION`.
