import type { Rule } from 'eslint';

// NgRx is a data-layer implementation detail.
//
// Every component/shell dispatch and read goes through a per-domain facade, so
// `Store` is injected in exactly one place per domain. This was two
// `no-restricted-imports` blocks — the ban and an `'off'` block re-enabling it
// for the sanctioned homes. It is one rule now, and the allowlist stays an
// `ignores:` glob list on the config block (configs.ts): ESLint already does glob
// matching, and doing it in here would mean shipping a matcher.
//
// `@ngrx` bare is deliberately not matched, mirroring the `['@ngrx/*',
// '@ngrx/*/**']` patterns this replaces — there is no such package.
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

    // The three forms `no-restricted-imports` itself covers. A re-export is an
    // import that also republishes, so leaving it out would make `export * from
    // '@ngrx/store'` the one legal way past the gate.
    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
    };
  },
};
