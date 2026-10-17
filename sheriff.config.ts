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

const shellComposesSameLayer = (context: {
  from: string;
  to: string;
  fromModulePath: string;
}): boolean =>
  context.fromModulePath.includes('/src/app/shell/') &&
  context.from === context.to;

/**
 * Sheriff config — Hahnekamp two-axis tagging.
 *
 * Each module carries a `domain:*` tag (vertical) and a `type:*` tag
 * (horizontal). `shell` is a domain like any other, except that it is
 * the one allowed to compose the rest: `main.ts` reaches only the shell,
 * the shell reaches every domain, and on the type axis a shell layer
 * may reach the SAME layer of another domain — its routes load theirs,
 * its feature hosts theirs.
 *
 * Type axis:
 *   routes   → feature, data, util, model      (a domain's own route manifest)
 *   feature  → smart-ui, ui, data, util, model (+ shared feature only)
 *   smart-ui → ui, data, util, model           (stateful presentational, leaf)
 *   ui       → self, util, model               (strict — pure dumb)
 *   data     → self, util, model, vendor
 *   util     → self, model, vendor
 *   model    → self
 *   vendor   → self                         (generated clients, src/vendor)
 *
 * Domain axis: every domain sealed, the shell excepted.
 */
export const config: SheriffConfig = {
  entryFile: './src/main.ts',
  enableBarrelLess: true,
  modules: {
    'src/app/<domain>/<type>': ['domain:<domain>', 'type:<type>'],
    'src/vendor/<lib>': ['domain:@shared', 'type:vendor'],
  },

  depRules: {
    root: ['domain:shell'],

    // ─── Type axis ─────────────────────────────────────────────
    'type:routes': [
      shellComposesSameLayer,
      'type:feature',
      'type:data',
      'type:util',
      'type:model',
    ],
    'type:feature': [
      featureMayUseSharedFeature,
      shellComposesSameLayer,
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
    'domain:shell': [anyTag],
  },
};
