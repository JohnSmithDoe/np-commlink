/* ─── why ─────────────────────────────────────────────────────────
 * A domain's i18n vocabulary belongs to the domain that owns the wording.
 *
 * Sheriff is structurally blind to this class: it checks import edges, and
 * a leak like `'household.a11y.back' | translate` inside a page that tasks
 * and cash also mount is a *string*, not an edge. It stays functionally
 * harmless — the key resolves — right up until a second domain reads the
 * first one's wording, which is the boundary the DDD re-domaining existed
 * to draw. One layer out it is a domain speaking another's vocabulary:
 * `barcode` shipped every user-visible string under
 * `officetime.page.settings.barcode.*` long after that settings page was
 * gone, and nothing caught it.
 *
 * One rule rather than the twelve generated `no-restricted-syntax` blocks
 * it replaces (one for @shared, one per domain), because a rule resolves
 * the owning folder from the filename itself — which also retires the
 * option-bag shadowing a per-domain block was exposed to.
 *
 * Both ASTs are visited: a quoted key is a `Literal` in TypeScript and a
 * `LiteralPrimitive` in an Angular template, and most of this class lived
 * in templates, so a `.ts`-only gate would never have fired.
 * ───────────────────────────────────────────────────────────────── */

import type { Rule } from 'eslint';
import { ALL_DOMAIN_PREFIXES, keyOwnershipFor } from '../i18n-owners.ts';
import type { TemplateLiteralPrimitive } from '../lib/template-ast.types.ts';

const NEUTRAL_NAMESPACES =
  'categories.*, item-list.*, list-header.*, toast.*, a11y.*';

interface LiteralLike {
  value?: unknown;
}

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'An i18n key belongs to the domain that owns its wording; @shared owns none of it.',
    },
    schema: [],
    messages: {
      sharedVocabulary: `Domain vocabulary in @shared. Use a neutral i18n namespace (${NEUTRAL_NAMESPACES}), or have the domain supply the key through the facade that mounts this surface.`,
      foreignVocabulary:
        "Another domain's i18n vocabulary. A key belongs to the domain that owns the wording — use this domain's own prefix, a neutral namespace (page-title.*, categories.*, item-list.*, toast.*, a11y.*), or receive the key from the owning domain through the contract that mounts this surface.",
    },
  },
  create(context) {
    const ownership = keyOwnershipFor(context.filename);
    if (!ownership) return {};

    const forbidden = ALL_DOMAIN_PREFIXES.filter(
      (prefix) => !ownership.owned.includes(prefix)
    );
    if (forbidden.length === 0) return {};

    const pattern = new RegExp(String.raw`^(${forbidden.join('|')})\.`);
    const messageId =
      ownership.kind === 'shared' ? 'sharedVocabulary' : 'foreignVocabulary';

    const check = (node: LiteralLike) => {
      const { value } = node;
      if (typeof value !== 'string' || !pattern.test(value)) return;
      context.report({ node: node as Rule.Node, messageId });
    };

    return {
      Literal: check,
      LiteralPrimitive: (node: TemplateLiteralPrimitive) => check(node),
    };
  },
};
