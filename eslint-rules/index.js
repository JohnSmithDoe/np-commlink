'use strict';

// ionic-a11y — this project's own rule set, not published.
//
// The mechanical half of docs/ionic-a11y-practices.md, which is where each rule's
// rationale lives, verified against the installed Ionic source. It exists because
// angular-eslint's `templateAccessibility` set keys off *native* elements while
// every control in this app is a custom element Ionic defines at runtime — so
// enabling that set reported a clean pass over genuinely unlabelled controls.
//
// Rules, not `no-restricted-syntax` selectors, because flat config *replaces* a
// rule's options rather than merging them: the selector this replaces had to be
// re-spread into every later block that set the same rule
// (`ICON_BUTTON_RESTRICTION`, three copies) or it was silently dropped for those
// files. A rule id cannot be shadowed that way. A rule can also say *why*, and can
// read more than the shape of one node.
//
// This exports rules only. Which files each one applies to is decided in
// eslint.config.js, next to every other gate — a `files` glob hidden in here is
// the one thing this config has already got wrong once.
//
// R5 (no action reachable only by swipe or drag) has no rule and cannot get one:
// deciding it means knowing whether a keyboard path to the *same* action exists
// somewhere in the app, which is not a property of a template. It stays the review
// matter the doc says it is.

module.exports = {
  meta: {
    name: 'ionic-a11y',
    version: '1.0.0',
  },
  rules: {
    // R1
    'icon-is-hidden-or-named': require('./rules/icon-is-hidden-or-named'),
    // R2
    'icon-only-control-has-name': require('./rules/icon-only-control-has-name'),
    // R3
    'form-control-has-label': require('./rules/form-control-has-label'),
    // R4 — declarative overlays, and the controller-presented ones
    'overlay-has-name': require('./rules/overlay-has-name'),
    'overlay-options-have-name': require('./rules/overlay-options-have-name'),
    // R6
    'no-actionable-toast-button': require('./rules/no-actionable-toast-button'),
    // R7
    'builtin-name-is-translated': require('./rules/builtin-name-is-translated'),
    // R8
    'aria-label-needs-role': require('./rules/aria-label-needs-role'),
  },
};
