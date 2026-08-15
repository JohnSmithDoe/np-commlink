#!/usr/bin/env node
// Gate: the GitHub Pages build is actually serveable from its subpath.
//
// e2e runs against `ng serve`, which serves from the root and never sees this.
// CI then produces `build:pages` and deploys it without a single request having
// been made to it — so the two failure modes CLAUDE.md names by title were the
// only ones nothing covered:
//
//   · `<base href>` — a relative `./` resolves wrong the moment someone lands on
//     the URL without its trailing slash, which is why the Pages build passes an
//     absolute `/np-commlink/`.
//   · the i18n prefix — `TranslateHttpLoader` must ask for `./i18n/`, because an
//     absolute `/i18n/` 404s under a subpath and every label in the app silently
//     degrades to its raw key.
//
// Both are *serving* faults: the build succeeds, the bundle is valid, and the
// only thing that reveals them is a request. Hence a real server over the real
// output rather than a grep — grepping the built JS for a path string is exactly
// the kind of diagnostic that keeps passing after it stops meaning anything.
//
// Node builtins only, no port collision with `ng serve` (4200) or Playwright
// (4321), and it tears the server down on every exit path.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve('www/browser');
const BASE = '/np-commlink/';
const PORT = 4322;

const CONTENT_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
};

if (!existsSync(ROOT)) {
  console.error(
    `check-pages-build: ${ROOT} does not exist — run \`pnpm run build:pages\` first.`
  );
  process.exit(1);
}

/**
 * Serve `www/browser` under BASE, the way GitHub Pages does. Deliberately NOT
 * an SPA fallback: hash routing means `index.html` is the only document ever
 * requested, so a 404 here is a real missing file rather than a route.
 */
const serveFromBuild = (request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost');
  if (!pathname.startsWith(BASE)) {
    response.writeHead(404).end('outside the base href');
    return;
  }
  const relative = pathname.slice(BASE.length) || 'index.html';
  // `normalize` collapses any `..` before it is joined, so a traversal cannot
  // reach outside the build output.
  const file = join(ROOT, normalize('/' + relative));
  readFile(file)
    .then((body) => {
      response.writeHead(200, {
        'content-type':
          CONTENT_TYPES[extname(file)] ?? 'application/octet-stream',
      });
      response.end(body);
    })
    .catch(() => response.writeHead(404).end('not found'));
};

const server = createServer(serveFromBuild);

const failures = [];
const check = async (path, assert) => {
  const response = await fetch(`http://localhost:${PORT}${path}`);
  const body = await response.text();
  const problem = assert(response, body);
  if (problem) failures.push(`${path}: ${problem}`);
};

await new Promise((ready) => server.listen(PORT, ready));

try {
  await check(BASE, (response, body) => {
    if (!response.ok) return `expected 200, got ${response.status}`;
    // The build rewrites <base href>; anything relative here is the Capacitor
    // build, which resolves wrong under a subpath without a trailing slash.
    if (!body.includes(`<base href="${BASE}">`))
      return `index.html does not carry <base href="${BASE}">`;
  });

  // Fetched at the URL the app itself will resolve `./i18n/de.json` to from a
  // document based at BASE — so this fails exactly when the loader prefix would.
  await check(`${BASE}i18n/de.json`, (response, body) => {
    if (!response.ok) return `expected 200, got ${response.status}`;
    try {
      const keys = Object.keys(JSON.parse(body));
      if (keys.length === 0) return 'bundle is empty';
    } catch {
      return 'bundle is not valid JSON';
    }
  });

  // The regression itself: an ABSOLUTE /i18n/ must NOT resolve, because that is
  // what a reverted loader prefix would request and what Pages would 404 on.
  await check('/i18n/de.json', (response) =>
    response.ok
      ? 'served from the server root — this check can no longer detect a reverted loader prefix'
      : undefined
  );
} finally {
  server.close();
}

if (failures.length > 0) {
  console.error('\nThe Pages build is not serveable from its subpath:\n');
  for (const failure of failures) console.error(`  · ${failure}`);
  console.error('');
  process.exit(1);
}

console.log(`pages build serves correctly from ${BASE}`);
