/* ─── why ─────────────────────────────────────────────────────────
 * The a11y rules are the mechanical half of docs/ionic-a11y-practices.md,
 * verified against the installed Ionic source; the trailing label on each
 * line is the R-number it keys to, and the rest of its rationale is in its
 * own file's banner.
 *
 * It is not one rule per R. R4 needs two — an overlay named by an
 * attribute and one named through a controller's `htmlAttributes` are
 * different ASTs in different languages. R5 (no action reachable only by
 * swipe or drag) can get no rule at all: deciding it means knowing whether
 * a keyboard path to the *same* action exists somewhere else in the app,
 * which is not a property of a template. It stays the review matter the
 * doc says it is.
 * ───────────────────────────────────────────────────────────────── */

import type { Rule } from 'eslint';
import { rule as a11yAriaLabelNeedsRole } from './rules/a11y-aria-label-needs-role.ts';
import { rule as a11yBuiltinNameIsTranslated } from './rules/a11y-builtin-name-is-translated.ts';
import { rule as a11yFormControlHasLabel } from './rules/a11y-form-control-has-label.ts';
import { rule as a11yIconIsHiddenOrNamed } from './rules/a11y-icon-is-hidden-or-named.ts';
import { rule as a11yIconOnlyControlHasName } from './rules/a11y-icon-only-control-has-name.ts';
import { rule as a11yNoActionableToastButton } from './rules/a11y-no-actionable-toast-button.ts';
import { rule as a11yOverlayHasName } from './rules/a11y-overlay-has-name.ts';
import { rule as a11yOverlayOptionsHaveName } from './rules/a11y-overlay-options-have-name.ts';
import { rule as actionEventKeysAreIdentifiers } from './rules/action-event-keys-are-identifiers.ts';
import { rule as commentsHeaderOnly } from './rules/comments-header-only.ts';
import { rule as e2eIonicLocatorTraps } from './rules/e2e-ionic-locator-traps.ts';
import { rule as i18nKeyOwnership } from './rules/i18n-key-ownership.ts';
import { rule as instantArgumentIsMarker } from './rules/instant-argument-is-marker.ts';
import { rule as markerArgumentIsLiteral } from './rules/marker-argument-is-literal.ts';
import { rule as noActionTypeLiteral } from './rules/no-action-type-literal.ts';
import { rule as noTestidOnComponentElement } from './rules/no-testid-on-component-element.ts';
import { rule as noBarrelOutsideData } from './rules/no-barrel-outside-data.ts';
import { rule as specResetsMockSelectors } from './rules/spec-resets-mock-selectors.ts';
import { rule as ngrxDataLayerOnly } from './rules/ngrx-data-layer-only.ts';
import { rule as testidIsStatic } from './rules/testid-is-static.ts';

export const rules: Record<string, Rule.RuleModule> = {
  'a11y-icon-is-hidden-or-named': a11yIconIsHiddenOrNamed, // R1
  'a11y-icon-only-control-has-name': a11yIconOnlyControlHasName, // R2
  'a11y-form-control-has-label': a11yFormControlHasLabel, // R3
  'a11y-overlay-has-name': a11yOverlayHasName, // R4, declarative
  'a11y-overlay-options-have-name': a11yOverlayOptionsHaveName, // R4, controller
  'a11y-no-actionable-toast-button': a11yNoActionableToastButton, // R6
  'a11y-builtin-name-is-translated': a11yBuiltinNameIsTranslated, // R7
  'a11y-aria-label-needs-role': a11yAriaLabelNeedsRole, // R8

  'i18n-key-ownership': i18nKeyOwnership,
  'ngrx-data-layer-only': ngrxDataLayerOnly,

  'testid-is-static': testidIsStatic,

  'marker-argument-is-literal': markerArgumentIsLiteral,
  'instant-argument-is-marker': instantArgumentIsMarker,

  'action-event-keys-are-identifiers': actionEventKeysAreIdentifiers,
  'no-action-type-literal': noActionTypeLiteral,

  'no-barrel-outside-data': noBarrelOutsideData,

  'spec-resets-mock-selectors': specResetsMockSelectors,

  'no-testid-on-component-element': noTestidOnComponentElement,

  'comments-header-only': commentsHeaderOnly,

  'e2e-ionic-locator-traps': e2eIonicLocatorTraps,
};
