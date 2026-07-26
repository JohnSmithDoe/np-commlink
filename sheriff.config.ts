import { anyTag, sameTag, SheriffConfig } from '@softarc/sheriff-core';

const specMayUseTesting = (ctx: {
  to: string;
  fromFilePath: string;
}): boolean =>
  ctx.to === 'type:testing' && ctx.fromFilePath.endsWith('.spec.ts');

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
 *   shell    → routes, feature, data, util, model
 *   routes   → feature, data, util             (a domain's own route manifest)
 *   feature  → smart-ui, ui, data, util, model (+ shared feature only)
 *   smart-ui → ui, data, util, model           (stateful presentational, leaf)
 *   ui       → self, util, model               (strict — pure dumb)
 *   data     → self, util, model
 *   util     → self, model
 *   model    → self
 *
 * Domain axis: every domain sealed.
 */
export const config: SheriffConfig = {
  entryFile: './src/main.ts',
  enableBarrelLess: true,
  modules: {
    'src/app': ['type:shell'],
    'src/app/<domain>/<type>': ['domain:<domain>', 'type:<type>'],
  },

  depRules: {
    root: ['type:shell'],

    // ─── Type axis ─────────────────────────────────────────────
    'type:shell': [
      'type:routes',
      'type:feature',
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
    'type:data': [sameTag, 'type:util', 'type:model', specMayUseTesting],
    'type:util': [sameTag, 'type:model', specMayUseTesting],
    'type:model': [sameTag, specMayUseTesting],
    'type:testing': [anyTag],

    // ─── Domain axis ───────────────────────────────────────────
    'domain:*': [sameTag, 'domain:@shared'],
  },
};
