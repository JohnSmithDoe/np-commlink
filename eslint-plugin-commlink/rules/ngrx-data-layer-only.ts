/* ─── why ─────────────────────────────────────────────────────────
 * NgRx is a data-layer implementation detail: every component/shell
 * dispatch and read goes through a per-domain facade, so `Store` is
 * injected in exactly one place per domain.
 *
 * This was two `no-restricted-imports` blocks — the ban, and an `'off'`
 * block re-enabling it for the sanctioned homes. The allowlist stays an
 * `ignores:` glob list on the config block (configs.ts) because ESLint
 * already does glob matching, and doing it in here would mean shipping a
 * matcher.
 *
 * Bare `@ngrx` is deliberately not matched, mirroring the subpath-only
 * patterns this replaces — there is no such package. A re-export is
 * checked as well as an import: leaving it out would make an
 * `export ... from '@ngrx/store'` the one legal way past the gate.
 * ───────────────────────────────────────────────────────────────── */

import type { Rule } from 'eslint';

const NGRX_SUBPATH = /^@ngrx\/.+/;

interface WithSource {
  source?: { value?: unknown } | null;
}

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'NgRx is imported only in the data layer — everywhere else goes through a domain facade.',
    },
    schema: [],
    messages: {
      ngrxOutsideDataLayer:
        'NgRx is data-layer only — dispatch/read through a domain facade, not Store directly.',
    },
  },
  create(context) {
    const check = (node: WithSource) => {
      const specifier = node.source?.value;
      if (typeof specifier !== 'string' || !NGRX_SUBPATH.test(specifier))
        return;
      context.report({
        node: node.source as unknown as Rule.Node,
        messageId: 'ngrxOutsideDataLayer',
      });
    };

    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
    };
  },
};
