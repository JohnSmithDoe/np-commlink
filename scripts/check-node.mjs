#!/usr/bin/env node
// Gate: this repo does not build on a Node outside `engines.node`.
//
// The range is Angular's builder's own. Inside it sits a floor that matters more
// than it looks: `eslint.config.js` `require()`s the plugin's `.ts` sources and
// relies on native type stripping (Node >= 22.18). Below that the failure is
// `Unknown file extension ".ts"` thrown from inside ESLint's config loader — which
// names neither Node, nor the version, nor the plugin.
//
// `engines` alone does not stop it. Measured against pnpm 11.18: an unmet root
// `engines.node` is a **warning** and the install still exits 0, with or without
// `engine-strict=true` (that setting governs DEPENDENCIES' engines, not the
// consuming project's). So the declaration stays — it is the readable source of
// truth, and this reads the range OUT of it rather than restating it — and this is
// what actually fails.
//
// Runs as `preinstall`, so it fires before anything else can produce a confusing
// error, and covers CI for free (`pnpm install --frozen-lockfile`) with no extra
// step. Node builtins only: at `preinstall` time there are no dependencies yet.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const required = JSON.parse(
  readFileSync(join(HERE, '..', 'package.json'), 'utf8')
).engines?.node;

// Only `||`-joined `^x.y.z` and `>=x[.y[.z]]` alternatives — the forms Angular
// declares. Anything else is a change to `engines` that should come with a change
// here, so it says so rather than guess.
const ALTERNATIVE = /^(\^|>=)\s*(\d+)(?:\.(\d+))?(?:\.(\d+))?$/;

const alternatives = (required ?? '').split('||').map((part) => {
  const match = ALTERNATIVE.exec(part.trim());
  if (!match) {
    console.error(
      `check-node: cannot read "${part.trim()}" in engines.node (${required ?? 'missing'}).`
    );
    process.exit(1);
  }
  const [, operator, ...parts] = match;
  return { caret: operator === '^', floor: parts.map((p) => Number(p ?? 0)) };
});

const actual = process.versions.node.split('.').map(Number);

// The FIRST differing component decides and the rest are irrelevant — which is
// what makes this a comparison and not a per-component test. Node 23.0 is above a
// 22.18 floor even though its minor is lower, and a rule that looked at each
// component independently would reject it.
const compareVersions = (left, right) => {
  for (let index = 0; index < 3; index++) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
};

const satisfies = ({ caret, floor }) =>
  compareVersions(actual, floor) >= 0 && (!caret || actual[0] === floor[0]);

if (!alternatives.some(satisfies)) {
  console.error(
    [
      '',
      `This repo needs Node ${required} — you are on v${process.versions.node}.`,
      '',
      'Angular 22 refuses anything else, and below 22.18 the lint config fails to',
      'load with a message that names none of this.',
      '',
      '  nvm install && nvm use     (.nvmrc pins the line)',
      '',
    ].join('\n')
  );
  process.exit(1);
}
