#!/usr/bin/env node
/**
 * The handbook's figures, end to end: Playwright shoots them, cwebp converts
 * them, and every page whose figures were all refreshed drops its stale flag.
 *
 * The conversion was the undocumented half. Shots land as 786x1454 PNGs under
 * `test-results/` — outside the repo, per `e2e/handbook/shot.ts` — while every
 * committed figure is a 620px-wide lossy WebP. Nothing in the repo said how one
 * became the other, so a regeneration meant reconstructing the encoder, its
 * resize and its quality from the artifacts. It is `cwebp` at its DEFAULT
 * quality: matched against the committed bytes, q75 (the default) lands within
 * a few percent on every figure whose screen had not changed, where q80 is
 * consistently ~11% over.
 *
 * The stale flag is cleared per page rather than globally: a page is only
 * current if EVERY figure it names came out of this run. A suite that skipped
 * a test would otherwise clear a warning it did not earn, and the flag is the
 * one thing telling a reader the picture predates the screen.
 *
 * There is no such thing as re-shooting one file: `SHOT_DIR` sits inside
 * Playwright's own `test-results/`, which it EMPTIES at the start of every run,
 * so a two-file run leaves only those two files' figures and the rest convert
 * to nothing. It is one whole green run or none, and `--skip-shots` is only
 * safe with no Playwright invocation in between.
 *
 * It starts and stops `ng serve` itself rather than leaving that to the config's
 * `webServer`: a server Playwright spawns here dies partway through a run of
 * this length, and every test after it fails on ERR_CONNECTION_REFUSED. An
 * already-answering port is reused and left running.
 *
 * Not a gate, and deliberately not in `verify:all` — it drives a browser over
 * the whole app and rewrites ~100 binaries.
 */
import { execFileSync, spawn } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, join } from 'node:path';

const SHOT_DIR = 'test-results/handbook-shots';
const IMG_DIR = 'public/handbook/img';
const PAGE_DIR = 'public/handbook/pages';
const WIDTH = 620;
const PORT = 4321;
const BASE_URL = `http://localhost:${PORT}`;
const SERVE_TIMEOUT_MS = 240_000;

const run = (command, args) =>
  execFileSync(command, args, { stdio: 'inherit', encoding: 'utf8' });

function requireCwebp() {
  try {
    execFileSync('cwebp', ['-version'], { stdio: 'ignore' });
  } catch {
    console.error(
      'cwebp not found. It is the encoder every committed figure was made with.\n' +
        '  macOS: brew install webp'
    );
    process.exit(1);
  }
}

const reachable = async () => {
  try {
    return (await fetch(BASE_URL)).ok;
  } catch {
    return false;
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function serve() {
  if (await reachable()) return undefined;

  const server = spawn(
    'pnpm',
    ['exec', 'ng', 'serve', '--port', String(PORT)],
    {
      stdio: 'ignore',
    }
  );
  const deadline = Date.now() + SERVE_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await sleep(2000);
    if (await reachable()) return server;
    if (server.exitCode !== null) break;
  }
  server.kill();
  throw new Error(`dev server never answered on ${BASE_URL}`);
}

async function shoot() {
  rmSync(SHOT_DIR, { recursive: true, force: true });
  const server = await serve();

  try {
    run('pnpm', [
      'exec',
      'playwright',
      'test',
      '--config',
      'playwright.handbook.config.ts',
    ]);
  } finally {
    server?.kill();
  }
}

function convert() {
  mkdirSync(IMG_DIR, { recursive: true });
  const shots = readdirSync(SHOT_DIR).filter((file) => file.endsWith('.png'));

  for (const shot of shots) {
    const name = basename(shot, '.png');
    execFileSync(
      'cwebp',
      [
        '-quiet',
        '-resize',
        String(WIDTH),
        '0',
        join(SHOT_DIR, shot),
        '-o',
        join(IMG_DIR, `${name}.webp`),
      ],
      { stdio: 'inherit' }
    );
  }
  return new Set(shots.map((shot) => basename(shot, '.png')));
}

function figuresByPage() {
  const pages = new Map();

  for (const file of readdirSync(PAGE_DIR).filter((f) => f.endsWith('.json'))) {
    const page = JSON.parse(readFileSync(join(PAGE_DIR, file), 'utf8'));
    const figures = (page.sections ?? [])
      .flatMap((section) => section.blocks ?? [])
      .filter((block) => block.type === 'figure' && block.img)
      .map((block) => basename(block.img, '.webp'));
    if (figures.length) pages.set(file, { page, figures });
  }
  return pages;
}

function clearStaleFlags(fresh) {
  const cleared = [];
  const kept = [];

  for (const [file, { page, figures }] of figuresByPage()) {
    if (!page.shotsStale) continue;
    const missing = figures.filter((figure) => !fresh.has(figure));

    if (missing.length) {
      kept.push(`${file} — no shot for ${missing.join(', ')}`);
      continue;
    }
    delete page.shotsStale;
    writeFileSync(join(PAGE_DIR, file), `${JSON.stringify(page, null, 2)}\n`);
    cleared.push(file);
  }
  return { cleared, kept };
}

function report(fresh, { cleared, kept }) {
  const referenced = new Set(
    [...figuresByPage().values()].flatMap(({ figures }) => figures)
  );
  const orphans = [...fresh].filter((name) => !referenced.has(name)).sort();

  console.log(
    `\n${fresh.size} figures written to ${IMG_DIR}/ at ${WIDTH}px wide.`
  );
  console.log(
    `${cleared.length} pages cleared of "shotsStale"${cleared.length ? `: ${cleared.join(', ')}` : ''}`
  );

  if (kept.length) {
    console.log('\nStill flagged — a figure they name was not shot:');
    for (const line of kept) console.log(`  ${line}`);
  }
  if (orphans.length) {
    console.log(`\nShot but named by no page: ${orphans.join(', ')}`);
  }
}

requireCwebp();
if (!existsSync('playwright.handbook.config.ts')) {
  console.error('Run from the repository root.');
  process.exit(1);
}

if (!process.argv.includes('--skip-shots')) await shoot();
else if (!existsSync(SHOT_DIR)) {
  console.error(`--skip-shots given but ${SHOT_DIR}/ holds no run to convert.`);
  process.exit(1);
}

const fresh = convert();
report(fresh, clearStaleFlags(fresh));
