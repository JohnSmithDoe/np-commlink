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

// R5 (no action reachable only by swipe or drag) has no rule and cannot get one:
// deciding it means knowing whether a keyboard path to the *same* action exists
// somewhere in the app, which is not a property of a template. It stays the
// review matter docs/ionic-a11y-practices.md says it is.
export const rules: Record<string, Rule.RuleModule> = {
  // Ionic a11y — the mechanical half of docs/ionic-a11y-practices.md, where each
  // rule's rationale lives, verified against the installed Ionic source. The name
  // after `a11y-` carries the R-number's subject; the R-number is in the docblock.
  'a11y-icon-is-hidden-or-named': a11yIconIsHiddenOrNamed, // R1
  'a11y-icon-only-control-has-name': a11yIconOnlyControlHasName, // R2
  'a11y-form-control-has-label': a11yFormControlHasLabel, // R3
  'a11y-overlay-has-name': a11yOverlayHasName, // R4, declarative
  'a11y-overlay-options-have-name': a11yOverlayOptionsHaveName, // R4, controller
  'a11y-no-actionable-toast-button': a11yNoActionableToastButton, // R6
  'a11y-builtin-name-is-translated': a11yBuiltinNameIsTranslated, // R7
  'a11y-aria-label-needs-role': a11yAriaLabelNeedsRole, // R8

  // The two gates that used to be hand-rolled in eslint.config.js out of
  // `no-restricted-syntax` / `no-restricted-imports`.
  'i18n-key-ownership': i18nKeyOwnership,
  'ngrx-data-layer-only': ngrxDataLayerOnly,

  // The per-file half of the data-testid contract. The two whole-repo set
  // differences stay in scripts/check-testids.mjs — see the rule's header.
  'testid-is-static': testidIsStatic,

  // "Never compose an identifier at the call site", the other half: a composed
  // i18n key is invisible to `i18n:extract --clean`, which then deletes it. The
  // pair — one rule says a marker's argument is a literal, the other says a key
  // reaching TranslateService is wrapped in a marker at all.
  'marker-argument-is-literal': markerArgumentIsLiteral,
  'instant-argument-is-marker': instantArgumentIsMarker,

  // An action has one name. The key is the identifier the creator is built from,
  // and nothing matches on the wire string that identifier generates.
  'action-event-keys-are-identifiers': actionEventKeysAreIdentifiers,
  'no-action-type-literal': noActionTypeLiteral,

  // Layout invariants Sheriff structurally cannot see: it governs how imports
  // resolve, not whether a barrel is created.
  'no-barrel-outside-data': noBarrelOutsideData,

  // A MockStore override outlives the spec file that set it.
  'spec-resets-mock-selectors': specResetsMockSelectors,

  // A component selector is already a locator contract; a second name is not
  // more safety.
  'no-testid-on-component-element': noTestidOnComponentElement,

  // The two Ionic locator traps a literal can reveal. Their worth is not the
  // violation count — it is that these get rediscovered, one red spec at a time.
  'e2e-ionic-locator-traps': e2eIonicLocatorTraps,
};
