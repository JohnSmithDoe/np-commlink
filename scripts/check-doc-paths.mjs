#!/usr/bin/env node
/**
 * Every path the prose names must exist.
 *
 * The compendium describes the tree, so it decays every time the tree moves —
 * and it decays *silently*: markdown is outside prettier, eslint and tsc alike
 * (`docs/coding-conventions.md` §1.4), so a doc that names a deleted folder
 * reads exactly as well as one that does not. This is the only gate that can
 * see it.
 *
 * It found `commlink/testing` on its first run — a fixture directory two files
 * described and nobody built — in a compendium that had just been reconciled
 * against the tree by hand, which is the argument for having it.
 *
 * Two directions, both decidable:
 *
 *   - a backticked token that looks like a repo path resolves against `.`,
 *     `src/` or `src/app/`
 *   - a relative markdown link target exists, resolved from its own file
 *
 * What it deliberately cannot decide: whether a path that *does* resolve is the
 * one the sentence means. A stale reference to a file that still exists — the
 * `@shared/util/list` → `item-lists/` rename, had the old name survived
 * elsewhere — is invisible here and stays a review matter.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const SOURCES = ['CLAUDE.md', 'README.md', 'review.md'];
const SOURCE_DIRS = ['docs', '.claude/skills'];

const ROOTS = ['.', 'src', 'src/app'];
const EXTENSIONS = [
  '',
  '.ts',
  '.md',
  '.mjs',
  '.js',
  '.scss',
  '.json',
  '.html',
  '.sh',
  '.yml',
  '.http',
];

/**
 * Named in order to say they do NOT exist — the one case where prose is right
 * about a path the tree lacks. Each needs its reason here, so the entry cannot
 * outlive it.
 */
const KNOWN_ABSENT = new Map([
  [
    '@shared/data/selectors',
    'cited as the folder the kernel does not have: it would name a domain store key',
  ],
  [
    'theme/palettes/_example.scss',
    'deleted with the .ion-palette seam; cited as the approach data-theme superseded',
  ],
  ['model/index.ts', 'the model barrels are gone; cited as what was removed'],
  [
    'commlink/testing',
    'the dashboard read-model has no fixture folder; cited to say so, since two docs and a comment once claimed it did',
  ],
]);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}

const entriesOf = (dir) => (existsSync(dir) ? readdirSync(dir) : []);

/**
 * Generated trees are out of scope, because their contents depend on which
 * commands have run — checking them would make the verdict a function of gate
 * order rather than of the docs. Narrowed *after* it caught the README citing
 * `www/browser/3rdpartylicenses.txt` for a file the build writes to
 * `www/3rdpartylicenses.txt`, which is the loss this costs.
 */
const GENERATED = new Set([
  'www',
  'android',
  'coverage',
  'node_modules',
  'dist',
  '.angular',
]);

/**
 * A token is only a candidate if its first segment names something real, which
 * is what keeps npm packages, rule namespaces, container images and git branch
 * names out without a list anyone has to maintain (`vitest/globals`,
 * `sonarsource/sonar-scanner-cli`, `feature/ddd-refactor`).
 */
const FIRST_SEGMENTS = new Set(ROOTS.flatMap((root) => entriesOf(root)));

/**
 * Route paths collide with folder names on purpose — every path is a domain
 * prefix — so `cash/rules` reads as a directory and is not one. The vocabulary
 * is read off the route manifests rather than listed here, so renaming a route
 * updates this gate with it.
 */
const routeSegments = new Set();
for (const file of walk('src/app')) {
  if (!file.endsWith('.routes.ts')) continue;
  const source = readFileSync(file, 'utf8');
  for (const [, path] of source.matchAll(/path: '([^']*)'/g))
    for (const segment of path.split('/')) routeSegments.add(segment);
}

// A `:param` is a route parameter and `_storage` is a list id — both are values
// a segment takes, not segments the manifests spell out.
const isRouteSegment = (segment) =>
  routeSegments.has(segment) ||
  segment.startsWith(':') ||
  /^_[a-z-]+$/.test(segment);
const isRoutePath = (token) => token.split('/').every(isRouteSegment);

/** `commlink/font-size-uses-scale` is a rule id, and `commlink` is a domain. */
const ruleIds = new Set(
  [...entriesOf('eslint-plugin-commlink/rules'), ...entriesOf('stylelint')].map(
    (file) => 'commlink/' + file.replace(/\.(ts|mjs)$/, '')
  )
);

/**
 * Case-EXACT existence, because `existsSync` is not.
 *
 * macOS is case-insensitive and the Codeberg runner is not, so `existsSync`
 * answers `true` here for `@shared/Util/theme/theme.service` and `false` there —
 * a doc reference that passes locally and reddens the first CI run, which is the
 * one run nobody can bisect. Measured on this filesystem:
 * `existsSync('src/App') === true`.
 *
 * So each segment is matched against its parent's real directory listing. Same
 * guarantee `forceConsistentCasingInFileNames` gives imports, which this gate
 * would otherwise be the only path-resolving thing in the repo to lack.
 */
const listings = new Map();
const listingOf = (dir) => {
  if (!listings.has(dir)) listings.set(dir, new Set(entriesOf(dir)));
  return listings.get(dir);
};

const existsCaseExact = (candidate) => {
  const segments = candidate.split('/').filter(Boolean);
  let parent = '.';
  for (const segment of segments) {
    if (!listingOf(parent).has(segment)) return false;
    parent = join(parent, segment);
  }
  return segments.length > 0;
};

const resolves = (token) =>
  ROOTS.some((root) =>
    EXTENSIONS.some((extension) =>
      existsCaseExact(join(root, token) + extension)
    )
  );

const UNPATHLIKE = /[\s(){}<>*|[\]$=!?'"…→]|::/;

const isCandidate = (token) =>
  token.includes('/') &&
  !token.startsWith('/') &&
  !token.startsWith('./') &&
  !UNPATHLIKE.test(token) &&
  FIRST_SEGMENTS.has(token.split('/')[0]) &&
  !GENERATED.has(token.split('/')[0]) &&
  !isRoutePath(token) &&
  !ruleIds.has(token);

const clean = (token) =>
  token
    .replace(/[.,;:)]+$/, '')
    .replace(/#.*$/, '')
    .replace(/\/$/, '');

const unresolved = [];
let checked = 0;

const files = [
  ...SOURCES.filter((file) => existsSync(file)),
  ...SOURCE_DIRS.filter((dir) => existsSync(dir))
    .flatMap((dir) => [...walk(dir)])
    .filter((file) => file.endsWith('.md')),
];

for (const file of files) {
  const source = readFileSync(file, 'utf8');

  for (const [, raw] of source.matchAll(/`([^`\n]+)`/g)) {
    const token = clean(raw.trim());
    if (!isCandidate(token)) continue;
    checked++;
    if (resolves(token) || KNOWN_ABSENT.has(token)) continue;
    unresolved.push([file, token, 'named in prose']);
  }

  for (const [, target] of source.matchAll(/\]\((\.[^)]+)\)/g)) {
    const path = clean(target.split('#')[0]);
    checked++;
    if (existsSync(resolve(dirname(file), path))) continue;
    unresolved.push([file, target, 'link target']);
  }
}

for (const [file, token, kind] of unresolved)
  console.log(`unresolved  ${token}  (${kind}, ${file})`);

// An exemption for a path that now exists is dead config, and dead config is
// how an exemption list grows past what anyone can justify — the same direction
// `verify:testids` checks for a declared id no spec references.
const stale = [...KNOWN_ABSENT.keys()].filter(resolves);
for (const token of stale)
  console.log(`stale exemption  ${token}  (it exists now — drop the entry)`);

const failures = unresolved.length + stale.length;
console.log(
  `\n${files.length} files · ${checked} paths checked · ${unresolved.length} unresolved · ${stale.length} stale exemptions`
);
process.exitCode = failures > 0 ? 1 : 0;
