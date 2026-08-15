#!/usr/bin/env node
/**
 * An `ion-icon` whose name was never passed to `addIcons` renders as an empty
 * box — no error, no failing test, just an invisible control. `angular.json`
 * copies only `public/`, so there is no SVG on disk for Ionic's runtime fetch
 * to fall back to; the element keeps its size and stays clickable, which is
 * precisely what makes it undiagnosable from the UI. The shopping list's
 * "move to storage" action sheet was unreachable this way.
 *
 * Neither half can see the other: the name is a string in a template, the
 * registration is an object literal in a sibling `.ts`. Sheriff checks import
 * edges, ESLint sees one file at a time — so this is a whole-repo script, the
 * third resort in the ladder `CLAUDE.md` lays out.
 *
 * Checked in one direction only. An unused *registration* is not reported: it
 * costs a few bytes, and the icon a component registers for a child it embeds
 * is indistinguishable from one nothing renders.
 *
 * Two checks, because the global one alone is too weak to catch the shape that
 * caused the outage twice. The registry really is one global map filled by
 * whichever component constructs first, so *presence* anywhere satisfies
 * ionicons — which is why `cart` survived for months registered by a sibling
 * that rendered no icon at all and merely happened to mount on the same page.
 * Presence is luck; the second check demands ownership, so that deleting a
 * component cannot blank an icon in a different one:
 *
 *   1. every used name is registered somewhere  (what ionicons needs)
 *   2. a name a *component* renders statically is registered by that same
 *      component                                 (what survives a refactor)
 *
 * Check 2 exempts non-component modules by design. A catalog or a payload
 * table legitimately names an icon for someone else to render — the deck
 * catalog names one per entry for the grid and the side menu, and a
 * notification preset names its CTA icon for the inbox. Neither has a
 * template or a
 * constructor, so neither can register; the renderer does, and check 1 still
 * covers them. A bound `[name]` is likewise attributed to whoever wrote the
 * string, not to the template interpolating it.
 *
 * Neither check catches the ordering case: an icon registered only by a
 * component behind another lazy route is blank until that route is visited.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const REGISTER_LITERAL = /addIcons\(\s*\{([\s\S]*?)\}\s*\)/g;
const REGISTER_BY_NAME = /addIcons\(\s*([A-Z][A-Z_0-9]*)\s*\)/g;
const KEY = /'([^']+)'\s*:|([A-Za-z_$][\w$]*)/g;

const USE_HTML = /<ion-icon[\s\S]*?>/g;
const USE_HTML_STATIC = /\sname="([a-z][a-z0-9-]*)"/;
const USE_HTML_BOUND = /\[name\]="([^"]*)"/;
// A `StartSwipeAction` / deck-catalog entry names its icon from TS.
const USE_TS = /\bicon:\s*'([a-z][a-z0-9-]*)'/g;
const QUOTED = /'([a-z][a-z0-9-]*)'/g;

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}

// `addIcons({ bagAdd })` registers both "bagAdd" and "bag-add".
const kebab = (name) =>
  name.replaceAll(/([a-z0-9]|(?=[A-Z]))([A-Z0-9])/g, '$1-$2').toLowerCase();

const sources = [...walk('src')];
const read = new Map(sources.map((file) => [file, readFileSync(file, 'utf8')]));
const scripts = sources.filter(
  (file) => file.endsWith('.ts') && !file.endsWith('.spec.ts')
);

const registered = new Set();
const registeredBy = new Map();

const registerKeysOf = (body, owner) => {
  for (const [, quoted, identifier] of body.matchAll(KEY)) {
    const name = quoted ?? identifier;
    for (const spelling of [name, kebab(name)]) {
      registered.add(spelling);
      registeredBy.get(owner)?.add(spelling) ??
        registeredBy.set(owner, new Set([spelling]));
    }
  }
};

for (const file of scripts) {
  const source = read.get(file);
  for (const [, body] of source.matchAll(REGISTER_LITERAL))
    registerKeysOf(body, file);

  for (const [, constant] of source.matchAll(REGISTER_BY_NAME)) {
    const declaration = new RegExp(
      String.raw`\b${constant}\s*(?::[^=]+)?=\s*\{([\s\S]*?)\}\s*as const`
    );
    for (const owner of scripts)
      registerKeysOf(declaration.exec(read.get(owner))?.[1] ?? '', file);
  }
}

// A template's icons belong to the component declaring it, not to the .html.
const declaringComponent = (file) =>
  file.endsWith('.html') ? file.replace(/\.html$/, '.ts') : file;
const isComponent = (file) =>
  scripts.includes(file) && read.get(file).includes('@Component(');

const used = new Map();
const foreign = new Map();

const use = (name, file, index, source, local) => {
  const at = `${file}:${source.slice(0, index).split('\n').length}`;
  if (!used.has(name)) used.set(name, at);

  const owner = declaringComponent(file);
  if (!local || !isComponent(owner)) return;
  if (registeredBy.get(owner)?.has(name)) return;
  const key = `${name} ${owner}`;
  if (!foreign.has(key)) foreign.set(key, { name, at });
};

for (const file of sources) {
  const source = read.get(file);
  if (file.endsWith('.html'))
    for (const match of source.matchAll(USE_HTML)) {
      const element = match[0];
      const stat = USE_HTML_STATIC.exec(element)?.[1];
      if (stat) use(stat, file, match.index, source, true);
      // The string was written wherever it was written; this template only
      // interpolates it, so it cannot be held to registering it.
      const bound = USE_HTML_BOUND.exec(element)?.[1] ?? '';
      for (const [, name] of bound.matchAll(QUOTED))
        use(name, file, match.index, source, false);
    }
  if (scripts.includes(file))
    for (const match of source.matchAll(USE_TS))
      use(match[1], file, match.index, source, true);
}

const missing = [...used].filter(([name]) => !registered.has(name));

for (const [name, where] of missing)
  console.log(`unregistered  ${name}  ${where}`);
for (const { name, at } of foreign.values())
  console.log(`not registered here  ${name}  ${at}`);

console.log(
  `\n${used.size} used · ${registered.size} registered · ` +
    `${missing.length} unregistered · ${foreign.size} registered elsewhere`
);
process.exitCode = missing.length + foreign.size > 0 ? 1 : 0;
