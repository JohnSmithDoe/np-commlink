import { anyTag, sameTag, SheriffConfig } from '@softarc/sheriff-core';

// Spec files (only) may import the @shared/testing kit (type:testing) regardless
// of which layer they live in. Production (non-spec) modules importing
// type:testing stay blocked, because no production type lists type:testing as an
// allowed dependency. Appended to every layer's dep rule below.
const specMayUseTesting = (ctx: {
  to: string;
  fromFilePath: string;
}): boolean => ctx.to === 'type:testing' && /\.spec\.ts$/.test(ctx.fromFilePath);

/**
 * Sheriff config — Hahnekamp two-axis tagging.
 *
 * Each module carries a `domain:*` tag (vertical) and a `type:*` tag
 * (horizontal). The shell is special: it only carries `type:shell` so
 * the domain-axis doesn't restrict it.
 *
 * Type axis:
 *   shell    → feature, smart-ui, ui, data, util, model
 *   feature  → self, smart-ui, ui, data, util, model
 *   smart-ui → self, ui, data, util, model     (stateful presentational)
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
    'type:feature': [
      sameTag,
      'type:smart-ui',
      'type:ui',
      'type:data',
      'type:util',
      'type:model',
      specMayUseTesting,
    ],
    // Smart UI: stateful presentational components. May touch the store
    // but still belong on the UI side. Pairs with strict-dumb type:ui.
    // Strict-leaf: smart components compose dumb UI, not other smart UI.
    // Composition of smart components belongs in a feature/.
    // Relaxed from the original TT model (which forbade smart-ui→smart-ui):
    // kitchen-bot's grocery dialogs genuinely compose store-connected
    // sub-components (edit-*-item-dialog → category-input + item-edit-modal;
    // category-input → categories-dialog). Permitting smart-ui→smart-ui keeps
    // those at their natural layer instead of forcing them up to type:feature.
    'type:smart-ui': [
      'type:smart-ui',
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

    // Explicit cross-domain bridges, each documented:
    //   notifications knows no domain — tracking owns the tracking→notify
    //     coupling and dispatches the @shared notification write contract, so
    //     notifications inherits the default `domain:*` rule (no bridge).
    //   barcode display reads the image stored in office-time state
    //   commlink is the super-app deck — it reads ONLY the eager @shared
    //     dashboard read-model (CQRS). Suppliers push telemetry via
    //     DashboardActions.report, so commlink imports no other domain and
    //     inherits the default `domain:*` rule (no bridge).
    'domain:barcode': [sameTag, 'domain:shared', 'domain:office-time'],

    // Grocery bounded context: shopping/storage/products (+ the list-settings
    // page and the multi-list engine) now live in ONE `domain:groceries` folder,
    // so what used to be three cross-domain bridges (shopping↔storage,
    // shopping→products, storage→products) are intra-domain imports covered by
    // `sameTag`. `tasks` stays fully sealed (inherits the default `domain:*`
    // rule; it shares no data with groceries).
  },
};
