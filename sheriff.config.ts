import { sameTag, SheriffConfig } from '@softarc/sheriff-core';

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
    ],
    'type:feature': [
      sameTag,
      'type:smart-ui',
      'type:ui',
      'type:data',
      'type:util',
      'type:model',
    ],
    // Smart UI: stateful presentational components. May touch the store
    // but still belong on the UI side. Pairs with strict-dumb type:ui.
    // Strict-leaf: smart components compose dumb UI, not other smart UI.
    // Composition of smart components belongs in a feature/.
    'type:smart-ui': ['type:ui', 'type:data', 'type:util', 'type:model'],
    // Strict dumb: inputs in, events out, no store, no service injects
    // beyond pure helpers. Sheriff guarantees this mechanically.
    'type:ui': [sameTag, 'type:util', 'type:model'],
    'type:data': [sameTag, 'type:util', 'type:model'],
    'type:util': [sameTag, 'type:model'],
    'type:model': [sameTag],

    // ─── Domain axis ───────────────────────────────────────────
    'domain:*': [sameTag, 'domain:shared'],

    // Explicit cross-domain bridges, each documented:
    //   notifications is a supporting subdomain reacting to tracking events
    //   barcode display reads the image stored in office-time state
    //   commlink is the super-app deck — its dashboard surfaces live
    //     telemetry (unread signals, office-day stats) from the programs it
    //     launches, so it reads those domains' selectors read-only.
    'domain:notifications': [sameTag, 'domain:shared', 'domain:tracking'],
    'domain:barcode': [sameTag, 'domain:shared', 'domain:office-time'],
    'domain:commlink': [
      sameTag,
      'domain:shared',
      'domain:notifications',
      'domain:office-time',
    ],
  },
};
