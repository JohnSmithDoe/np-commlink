/* ─── why ─────────────────────────────────────────────────────────
 * Shared readers over the `@angular-eslint/template-parser` AST. Every
 * helper here exists because one AST detail is easy to get wrong, and the
 * failure mode is a gate gone silently inert rather than loudly broken.
 *
 * A block (`@if`, `@for`, `@switch`, `@defer`) holds its children one
 * level deeper than an element does, so a walk that only follows
 * `children` stops at the first `@if` — and text inside one names its
 * surrounding element just as well as text outside it.
 *
 * Whitespace does not count as text: an indented multi-line element always
 * has Text children, so a bare "has a Text child" test exempts exactly the
 * icon-only elements these rules exist to catch. Interpolation (a
 * BoundText) does count — it is text we cannot read, not the absence of
 * text.
 *
 * The parser-services guard turns "`undefined` is not a function" thrown
 * from inside a rule into a message naming the parser that is missing,
 * which is what a template rule configured onto a TypeScript-parsed file
 * otherwise fails as.
 * ───────────────────────────────────────────────────────────────── */

import type { Rule } from 'eslint';
import type {
  TemplateAttribute,
  TemplateBoundAttribute,
  TemplateElement,
  TemplateNode,
  TemplateParserServices,
} from './template-ast.types.ts';

export const ACCESSIBLE_NAME_ATTRIBUTES = ['aria-label', 'aria-labelledby'];

const CHILD_KEYS = [
  'children',
  'branches',
  'cases',
  'empty',
  'placeholder',
  'loading',
  'error',
];

export const attributeNames = (element: TemplateElement): string[] => [
  ...element.attributes.map(({ name }) => name),
  ...element.inputs.map(({ name }) => name),
];

export const hasAttribute = (element: TemplateElement, name: string): boolean =>
  attributeNames(element).includes(name);

export const hasAnyAttribute = (
  element: TemplateElement,
  names: string[]
): boolean => attributeNames(element).some((name) => names.includes(name));

export const staticAttribute = (
  element: TemplateElement,
  name: string
): TemplateAttribute | undefined =>
  element.attributes.find((attribute) => attribute.name === name);

export const boundAttribute = (
  element: TemplateElement,
  name: string
): TemplateBoundAttribute | undefined =>
  element.inputs.find((input) => input.name === name);

export const hasAccessibleNameAttribute = (element: TemplateElement): boolean =>
  hasAnyAttribute(element, ACCESSIBLE_NAME_ATTRIBUTES);

export const descendants = function* (
  node: TemplateNode
): Generator<TemplateNode> {
  for (const key of CHILD_KEYS) {
    const value = node[key];
    for (const child of Array.isArray(value) ? value : [value]) {
      if (!child || typeof child !== 'object') continue;
      yield child as TemplateNode;
      yield* descendants(child as TemplateNode);
    }
  }
};

const isElement = (node: TemplateNode): node is TemplateElement =>
  node.type === 'Element';

export const hasOwnText = (element: TemplateElement): boolean => {
  for (const node of descendants(element)) {
    if (node.type === 'BoundText') return true;
    if (node.type === 'Text' && /\S/.test(String(node['value']))) return true;
  }
  return false;
};

export const hasChildInSlot = (
  element: TemplateElement,
  slot: string
): boolean => {
  for (const node of descendants(element)) {
    if (!isElement(node)) continue;
    if (staticAttribute(node, 'slot')?.value === slot) return true;
  }
  return false;
};

export const containsElement = (
  element: TemplateElement,
  name: string
): boolean => {
  for (const node of descendants(element)) {
    if (isElement(node) && node.name === name) return true;
  }
  return false;
};

export const templateParserServices = (
  context: Rule.RuleContext
): TemplateParserServices => {
  const services = context.sourceCode.parserServices as
    Partial<TemplateParserServices> | undefined;
  if (
    !services?.convertElementSourceSpanToLoc ||
    !services?.convertNodeSourceSpanToLoc
  ) {
    throw new Error(
      "This rule requires '@angular-eslint/template-parser' to be the configured parser for the files it lints."
    );
  }
  return services as TemplateParserServices;
};
