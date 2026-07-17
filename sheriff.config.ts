import { anyTag, sameTag, SheriffConfig } from '@softarc/sheriff-core';

// Spec files (only) may import the @shared/testing kit (type:testing) regardless
// of which layer they live in. Production (non-spec) modules importing
// type:testing stay blocked, because no production type lists type:testing as an
// allowed dependency. Appended to every layer's dep rule below.
const specMayUseTesting = (ctx: {
  to: string;
  fromFilePath: string;
}): boolean =>
  ctx.to === 'type:testing' && ctx.fromFilePath.endsWith('.spec.ts');

// A feature may depend on another feature ONLY when the target is a *shared*
// feature (domain:shared) — i.e. the reusable @shared/feature kit (the
// domain-blind list-page shell). Same-domain feature composition (a list page +
// its edit-dialog wrappers) lives in the SAME `<domain>/feature` module, which
// Sheriff treats as intra-module and never checks — so this governs the sole
// cross-module case. Unlike a plain `sameTag`, it keeps banning
// `<domainA>/feature → <domainB>/feature` even if a domain bridge is later
// added: a feature may ride a bridge to another domain's data/ui/util, but never
// compose that domain's feature layer.
const featureMayUseSharedFeature = (ctx: {
  to: string;
  toModulePath: string;
}): boolean =>
  ctx.to === 'type:feature' && ctx.toModulePath.includes('/@shared/');

/**
 * Sheriff config — Hahnekamp two-axis tagging.
 *
 * Each module carries a `domain:*` tag (vertical) and a `type:*` tag
 * (horizontal). The shell is special: it only carries `type:shell` so
 * the domain-axis doesn't restrict it.
 *
 * Type axis:
 *   shell    → feature, smart-ui, ui, data, util, model
 *   feature  → smart-ui, ui, data, util, model (+ shared feature only)
 *   smart-ui → ui, data, util, model           (stateful presentational, leaf)
 *   ui       → self, util, model               (strict — pure dumb)
 *   data     → self, util, model
 *   util     → self, model
 *   model    → self
 *
 * Domain axis: every domain sealed except explicit bridges below.
 */
export const config: SheriffConfig = {
  enableBarrelLess: true,

  modules: {
    // Shell — root of src/app/ holds AppComponent, routes, title strategy,
    // orchestration effects. Only carries type:shell so the domain rule
    // doesn't fence it in.
    'src/app': ['type:shell'],

    // @shared root holds types.ts → type:model. Subfolders override.
    'src/app/@shared': ['domain:shared', 'type:model'],
    'src/app/@shared/<type>': ['domain:shared', 'type:<type>'],

    // Every other domain follows the canonical <domain>/<type> shape.
    'src/app/<domain>/<type>': ['domain:<domain>', 'type:<type>'],
  },

  depRules: {
    // main.ts wires reducers (type:data), the service worker, the OS
    // notification service (type:util), and the shell composition.
    root: ['type:shell', 'type:data', 'type:util'],

    // ─── Type axis ─────────────────────────────────────────────
    'type:shell': [
      'type:feature',
      'type:smart-ui',
      'type:ui',
      'type:data',
      'type:util',
      'type:model',
      specMayUseTesting,
    ],
    // Feature composes the presentational + data/util layers, plus OTHER
    // features only when they're shared (see featureMayUseSharedFeature). No
    // plain `sameTag`: same-domain feature composition is intra-module (one
    // <domain>/feature dir) and never checked, so the only cross-module
    // feature→feature we permit is a domain feature reusing @shared/feature.
    'type:feature': [
      featureMayUseSharedFeature,
      'type:smart-ui',
      'type:ui',
      'type:data',
      'type:util',
      'type:model',
      specMayUseTesting,
    ],
    // Smart UI: stateful presentational components. May touch the store
    // but still belong on the UI side. Pairs with strict-dumb type:ui.
    // Strict-leaf (no `sameTag`): a smart component composes dumb UI, never
    // another smart component — composition of stateful components is
    // orchestration and belongs in a type:feature. The grocery/tracking
    // edit-*-item-dialog wrappers (which compose category-input + item-edit-modal)
    // therefore live in <domain>/feature/, and categories-dialog is rendered by
    // those wrappers rather than nested inside category-input (sheriff-tighten §2).
    'type:smart-ui': [
      'type:ui',
      'type:data',
      'type:util',
      'type:model',
      specMayUseTesting,
    ],
    // Strict dumb: inputs in, events out, no store, no service injects
    // beyond pure helpers. Sheriff guarantees this mechanically.
    'type:ui': [sameTag, 'type:util', 'type:model', specMayUseTesting],
    'type:data': [sameTag, 'type:util', 'type:model', specMayUseTesting],
    'type:util': [sameTag, 'type:model', specMayUseTesting],
    'type:model': [sameTag, specMayUseTesting],

    // Test kit: may reach into any layer it exercises. The reverse is fenced
    // by the rule above (only *.spec.ts files may depend on type:testing).
    'type:testing': [anyTag],

    // ─── Domain axis ───────────────────────────────────────────
    'domain:*': [sameTag, 'domain:shared'],

    // No cross-domain bridges remain — every domain is sealed to the default
    // `domain:* → sameTag, domain:shared` rule:
    //   notifications knows no domain — tracking owns the tracking→notify
    //     coupling and dispatches the @shared notification write contract.
    //   barcode owns its own `barcode` slice (the SIGIL badge) — formerly a
    //     field inside office-time, which required a `barcode → office-time`
    //     bridge; that bridge is gone (sheriff-tighten §1).
    //   commlink is the super-app deck — it reads ONLY the eager @shared
    //     dashboard read-model (CQRS). Suppliers push telemetry via
    //     DashboardActions.report, so commlink imports no other domain.

    // Grocery bounded context: shopping/storage/products (+ the list-settings
    // page and the multi-list engine) now live in ONE `domain:groceries` folder,
    // so what used to be three cross-domain bridges (shopping↔storage,
    // shopping→products, storage→products) are intra-domain imports covered by
    // `sameTag`. `tasks` stays fully sealed (inherits the default `domain:*`
    // rule; it shares no data with groceries).
  },
};
