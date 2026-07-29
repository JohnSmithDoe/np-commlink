/**
 * The release version, injected at build time by esbuild's `define` — see the
 * `--define NPC_RELEASE=…` on the build scripts, which reads `npm_package_version`.
 * `package.json` therefore owns the number and nothing under `src/` restates it.
 *
 * Declared optional because `ng serve` and Vitest apply no define at all: there
 * the identifier is genuinely undeclared, so the only safe read is the
 * `typeof`-guarded `APP_RELEASE` in `@shared/model/app.consts` — a bare
 * reference would throw `ReferenceError`.
 */
declare const NPC_RELEASE: string | undefined;
