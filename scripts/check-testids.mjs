#!/usr/bin/env node
/**
 * Audit the `data-testid` contract in both decidable directions:
 *
 *   - **declared but never referenced** — a dead id, exactly the decay
 *     `i18n:extract --clean` exists to prevent for message keys. A test cannot
 *     catch it: the suite stays green while the template keeps claiming "a spec
 *     depends on this".
 *   - **referenced but never declared** — a spec locator that can never match.
 *
 * The third case — a spec that reaches for an Ionic element name instead of an
 * id — is deliberately NOT checked, because it is not decidable from the two
 * file sets: nothing in a spec says which element it *should* have named.
 *
 * This works only because no id is composed at the call site: a static literal
 * appears verbatim on both sides, so one grep sees both halves.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DECLARE_HTML = /data-testid="([^"{}]+)"/g;
// The imperatively-created overlays (a toast) declare theirs in TS.
const DECLARE_TS = /'data-testid':\s*'([^']+)'/g;

const USE_PLAYWRIGHT = /getByTestId\(\s*'([^']+)'/g;
const USE_FIXTURE = /(?:get|query)ByTestId\(\s*\w+\s*,\s*'([^']+)'/g;
const USE_SELECTOR = /data-testid(\^?)=["']([^"']+)["']/g;

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}

const declared = new Map();
const referenced = new Set();
const prefixes = new Set();

const collect = (source, pattern, group, sink) => {
  for (const match of source.matchAll(pattern)) sink(match[group]);
};

for (const file of walk('src')) {
  const isSpec = file.endsWith('.spec.ts');
  const source = readFileSync(file, 'utf8');

  if (file.endsWith('.html'))
    collect(source, DECLARE_HTML, 1, (id) => declared.set(id, file));
  if (file.endsWith('.ts') && !isSpec)
    collect(source, DECLARE_TS, 1, (id) => declared.set(id, file));
  if (isSpec) {
    collect(source, USE_FIXTURE, 1, (id) => referenced.add(id));
    for (const [, caret, value] of source.matchAll(USE_SELECTOR))
      (caret ? prefixes : referenced).add(value);
  }
}

for (const file of walk('e2e')) {
  const source = readFileSync(file, 'utf8');
  collect(source, USE_PLAYWRIGHT, 1, (id) => referenced.add(id));
  for (const [, caret, value] of source.matchAll(USE_SELECTOR))
    (caret ? prefixes : referenced).add(value);
}

const isReferenced = (id) =>
  referenced.has(id) || [...prefixes].some((prefix) => id.startsWith(prefix));

const dead = [...declared].filter(([id]) => !isReferenced(id));
const missing = [...referenced].filter((id) => !declared.has(id));

for (const [id, file] of dead) console.log(`dead      ${id}  (${file})`);
for (const id of missing) console.log(`undeclared ${id}`);

console.log(
  `\n${declared.size} declared · ${referenced.size} referenced · ${dead.length} dead · ${missing.length} undeclared`
);
process.exitCode = dead.length + missing.length > 0 ? 1 : 0;
