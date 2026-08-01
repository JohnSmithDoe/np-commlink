import type { Rule } from 'eslint';
import {
  staticAttribute,
  templateParserServices,
} from '../lib/template-ast.ts';
import type { TemplateElement } from '../lib/template-ast.types.ts';

// A component's element name is already a locator contract.
//
// `app-page-cash`, `app-tracking-item`, `app-text-item` are declared in
// `@Component({ selector })` and specs use them directly. A `data-testid` on top
// of one is a second name for the same element — one more thing to keep in sync,
// not more safety, and it splits "which elements do tests depend on" across two
// mechanisms for no gain.
//
// Only the `app-` prefix is checked, which is exactly the set
// `@angular-eslint/component-selector` already forces every component in this
// repo to use. An `ion-*` element is not a component of ours and legitimately
// needs an id, since its tag says something about iconography rather than
// identity.
//
// Composed ids are `testid-is-static`'s job — this reads only the static
// attribute, so an offending `[data-testid]` on an `app-*` element reports once,
// there, rather than twice.

const TESTID = 'data-testid';
const COMPONENT_PREFIX = 'app-';

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        "A component's element name is already a contract — it does not also carry a data-testid.",
    },
    schema: [],
    messages: {
      redundantTestid:
        '`<{{element}}>` is a component selector, which specs already locate by directly — it is a contract declared in `@Component`. A `data-testid` on it is a second name for the same element, one more thing to keep in sync. Drop the id and locate by the element name; add ids only where the thing located is not already named.',
    },
  },
  create(context) {
    const services = templateParserServices(context);
    return {
      Element(element: TemplateElement) {
        if (!element.name.startsWith(COMPONENT_PREFIX)) return;
        const testid = staticAttribute(element, TESTID);
        if (!testid) return;
        context.report({
          loc:
            testid.loc ??
            services.convertElementSourceSpanToLoc(context, element),
          messageId: 'redundantTestid',
          data: { element: element.name },
        });
      },
    };
  },
};
