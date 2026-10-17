import { anyTag, sameTag, SheriffConfig } from '@softarc/sheriff-core';

const specMayUseTesting = (context: {
  to: string;
  fromFilePath: string;
}): boolean =>
  context.to === 'type:testing' && context.fromFilePath.endsWith('.spec.ts');

const featureMayUseSharedFeature = (context: {
  to: string;
  toModulePath: string;
}): boolean =>
  context.to === 'type:feature' && context.toModulePath.includes('/@shared/');

/**
 * Sheriff config — Hahnekamp two-axis tagging.
 *
 * Each module carries a `domain:*` tag (vertical) and a `type:*` tag
 * (horizontal). The shell is special: it only carries `type:shell` so
 * the domain-axis doesn't restrict it.
 *
 * Type axis:
 *   shell    → routes, feature, ui, data, util, model
 *   routes   → feature, data, util             (a domain's own route manifest)
 *   feature  → smart-ui, ui, data, util, model (+ shared feature only)
 *   smart-ui → ui, data, util, model           (stateful presentational, leaf)
 *   ui       → self, util, model               (strict — pure dumb)
 *   data     → self, util, model, vendor
 *   util     → self, model, vendor
 *   model    → self
 *   vendor   → self                         (generated clients, src/vendor)
 *
 * Domain axis: every domain sealed.
 */
export const config: SheriffConfig = {
  entryFile: './src/main.ts',
  enableBarrelLess: true,
  modules: {
    'src/app': ['type:shell'],
    'src/app/<domain>/<type>': ['domain:<domain>', 'type:<type>'],
    'src/vendor/<lib>': ['domain:@shared', 'type:vendor'],
  },

  depRules: {
    root: ['type:shell'],

    // ─── Type axis ─────────────────────────────────────────────
    'type:shell': [
      'type:routes',
      'type:feature',
      'type:ui',
      'type:data',
      'type:model',
      'type:util',
      specMayUseTesting,
    ],
    'type:routes': ['type:feature', 'type:data', 'type:util'],
    'type:feature': [
      featureMayUseSharedFeature,
      'type:smart-ui',
      'type:ui',
      'type:data',
      'type:util',
      'type:model',
      specMayUseTesting,
    ],
    'type:smart-ui': [
      'type:ui',
      'type:data',
      'type:util',
      'type:model',
      specMayUseTesting,
    ],
    'type:ui': [sameTag, 'type:util', 'type:model', specMayUseTesting],
    'type:data': [
      sameTag,
      'type:util',
      'type:model',
      'type:vendor',
      specMayUseTesting,
    ],
    'type:util': [sameTag, 'type:model', 'type:vendor', specMayUseTesting],
    'type:vendor': [sameTag],
    'type:model': [sameTag, specMayUseTesting],
    'type:testing': [anyTag],

    // ─── Domain axis ───────────────────────────────────────────
    'domain:*': [sameTag, 'domain:@shared'],
  },
};
