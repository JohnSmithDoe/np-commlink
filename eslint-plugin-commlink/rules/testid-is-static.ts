/* ─── why ─────────────────────────────────────────────────────────
 * A `data-testid` is never composed at the call site. This is the
 * invariant `scripts/check-testids.mjs` rests on and cannot check itself:
 * it decides "declared but never referenced" and "referenced but never
 * declared" by matching a STATIC LITERAL on both sides, so a composed id
 * (`data-testid="row-{{ item.id }}"`, `'row-' + id`) drops the declaration
 * out of the set and the dead-id half stops seeing it — a gate that
 * quietly narrows is worse than one that is absent. Composition also costs
 * the greppability the contract exists for: `'row-' + id` in a template
 * and `getByTestId('row-milk')` in a spec share no literal.
 *
 * The set differences themselves stay in that script rather than becoming
 * rules here. Both are whole-repo comparisons, the one shape a per-file
 * linter is worst at: answering them in a rule means a module-level cached
 * index, and with `cache: true` on the lint target a cross-file verdict
 * cached per file goes stale exactly when it matters.
 *
 * WHICH NAME a composed id arrives under was measured, not assumed,
 * because the first cut of this rule silently passed the most likely form.
 * Any composed form is a BoundAttribute and only a static one stays in
 * `attributes`; `[data-testid]`, `[attr.data-testid]` and
 * `attr.data-testid="{{…}}"` all arrive as `data-testid`, but plain
 * interpolation — `data-testid="row-{{ id }}"`, the one someone actually
 * writes — arrives as `testid`, because Angular strips the `data-` prefix
 * on that path alone. Matching one name catches half.
 * ───────────────────────────────────────────────────────────────── */

import type { Rule } from 'eslint';
import { boundAttribute, templateParserServices } from '../lib/template-ast.ts';
import type { TemplateElement } from '../lib/template-ast.types.ts';
import type { ObjectExpression } from '../lib/overlay-options.ts';
import { property } from '../lib/overlay-options.ts';

const TESTID = 'data-testid';
const INTERPOLATED_TESTID = 'testid';

const isStaticString = (node: { type: string }): boolean =>
  node.type === 'Literal';

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'A data-testid is a static literal, so the same string appears verbatim in the template and in the spec.',
    },
    schema: [],
    messages: {
      composedInTemplate:
        'A composed `data-testid` is invisible to scripts/check-testids.mjs, which matches static literals on both sides — the id drops out of the declared set and the dead-id check stops seeing it. Use a static id (a repeated row carries the same `list-row`) and pick the row in the spec by user-visible content instead.',
      composedInTypeScript:
        'A composed `data-testid` is invisible to scripts/check-testids.mjs, which matches static literals on both sides. Give it a string literal; if the id has to vary, that is a sign the spec should locate by content rather than by id.',
    },
  },
  create(context) {
    if (context.filename.endsWith('.html')) {
      const services = templateParserServices(context);
      return {
        Element(element: TemplateElement) {
          const offender =
            boundAttribute(element, TESTID) ??
            boundAttribute(element, INTERPOLATED_TESTID);
          if (!offender) return;
          context.report({
            loc:
              offender.loc ??
              services.convertElementSourceSpanToLoc(context, element),
            messageId: 'composedInTemplate',
          });
        },
      };
    }

    return {
      ObjectExpression(node) {
        const options = node as unknown as ObjectExpression;
        const testid = property(options, TESTID);
        if (!testid || testid.type !== 'Property') return;
        if (isStaticString(testid.value)) return;
        context.report({
          node: node as Rule.Node,
          messageId: 'composedInTypeScript',
        });
      },
    };
  },
};
