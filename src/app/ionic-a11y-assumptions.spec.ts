/* ─── why ─────────────────────────────────────────────────────────
 * The `commlink/a11y-*` rules are built on facts about Ionic's own
 * source, and this dates the READING of those facts. It cannot check
 * them: each is an inline literal inside a `render()`,
 * `componentWillLoad()` or `connectedCallback()`, so it is reachable
 * as neither a value nor a lint target — and jsdom never runs the
 * Stencil runtime, so no mounted element can be asked either. What is
 * readable is which version we read them against.
 *
 * So this goes red on a major bump and says only that: the reading
 * expired. It never claims a fact broke. A `toString()` regex over the
 * emitted `componentWillLoad` was the alternative and was rejected —
 * it survives a rename but not a hoist to module scope, so its red is
 * ambiguous while its remedy is identical to this one's, and a gate
 * that reports what it cannot know teaches people to disable it.
 *
 * ionicons is read through the range `@ionic/core` DECLARES, not from
 * the installed top-level copy. The 7.4.0 at the root supplies icon
 * path data to `addIcons`; the `ion-icon` that renders is the 8.x
 * `@ionic/core` bundles, and that copy's `exports` map hides its own
 * `package.json`. This is the only readable statement about the copy
 * that actually runs, and it moves when Ionic deliberately re-bases
 * rather than whenever ionicons ships inside the caret.
 *
 * Stencil is here because it emits every `render()` and
 * `inheritAttributes()` the other two rows depend on.
 *
 * `!==`, not `>`: a downgrade expires the reading just as well, and it
 * is what makes this reproducible by editing a constant either way.
 * The messages name a file and a LITERAL, never a line number — a
 * stale coordinate sends the reader somewhere wrong with confidence.
 *
 * The standing weakness, since nothing else records it: the remedy is
 * editing the constant below, and nothing forces the re-reads. The
 * message is the checklist, so bumping a number puts the four coordinates
 * in the same diff as the bump. That is the whole mechanism.
 * ───────────────────────────────────────────────────────────────── */
import ionicCorePackage from '@ionic/core/package.json';

const majorVersionOf = (range: string): number =>
  Number.parseInt(/^\D*(\d+)/.exec(range)?.[1] ?? '', 10);

const ASSUMPTIONS = [
  {
    packageName: '@ionic/core',
    verifiedMajor: 8,
    observed: ionicCorePackage.version,
    reverify: [
      'R4 — dist/collection/components/modal/modal.js: componentWillLoad must still declare attributesToInherit = [aria-label, role], and role="dialog" + aria-modal must still sit on the shadow wrapper (a11y-overlay-has-name banner).',
      'ion-content — dist/collection/components/content/content.js: connectedCallback must still compute isMainContent from closest(ion-menu, ion-popover, ion-modal), and render must still gate role:"main" on it (ungated; footguns.md).',
      'R6 — dist/collection/components/toast/toast.js: renderButtons must still be a SIBLING of the role="status" aria-live="polite" container rather than a child of it (a11y-no-actionable-toast-button banner).',
    ],
  },
  {
    packageName: 'ionicons (as @ionic/core depends on it)',
    verifiedMajor: 8,
    observed: ionicCorePackage.dependencies.ionicons,
    reverify: [
      'R1 — the Icon that renders is @ionic/core/components/ion-icon.js and its chunk, NOT the top-level ionicons 7.4.0: render must still emit role:"img" unconditionally, and inheritAttributes must still take only [aria-label] (a11y-icon-is-hidden-or-named banner).',
    ],
  },
  {
    packageName: '@stencil/core (as @ionic/core depends on it)',
    verifiedMajor: 4,
    observed: ionicCorePackage.dependencies['@stencil/core'],
    reverify: [
      'Stencil emits every render() and inheritAttributes() the three rows above read. A major bump can change how host attributes and roles are applied at all — re-read all four facts, not just one.',
    ],
  },
];

describe('Ionic a11y assumptions', () => {
  it('was read against the installed majors', () => {
    const expired = ASSUMPTIONS.filter(
      (assumption) =>
        majorVersionOf(assumption.observed) !== assumption.verifiedMajor
    ).map(
      (assumption) =>
        `${assumption.packageName}: read against major ${assumption.verifiedMajor}, installed ${assumption.observed}. ` +
        'This does NOT mean a fact broke — the reading expired. Re-read, then bump the constant in the same commit:\n  - ' +
        assumption.reverify.join('\n  - ')
    );

    expect(expired).toEqual([]);
  });
});
