'use strict';

// Shared readers over the @angular-eslint/template-parser AST. Every helper here
// exists because one AST detail is easy to get wrong in a way that makes a gate
// silently inert rather than loudly broken.

const ACCESSIBLE_NAME_ATTRIBUTES = ['aria-label', 'aria-labelledby'];

// A block (`@if`, `@for`, `@switch`, `@defer`) holds its children one level
// deeper than an element does, so a walk that only follows `children` stops at
// the first `@if` — and text inside one names its surrounding element just as
// well as text outside it.
const CHILD_KEYS = [
  'children',
  'branches',
  'cases',
  'empty',
  'placeholder',
  'loading',
  'error',
];

/** Every attribute name on an element, static and bound alike.
 *
 * The parser strips the `attr.` prefix: `[attr.aria-label]` arrives as a
 * BoundAttribute named plain `aria-label`, so a check written against
 * `attr.aria-label` matches nothing and the rule passes everything.
 */
const attributeNames = (element) => [
  ...element.attributes.map(({ name }) => name),
  ...element.inputs.map(({ name }) => name),
];

const hasAttribute = (element, name) => attributeNames(element).includes(name);

const hasAnyAttribute = (element, names) =>
  attributeNames(element).some((name) => names.includes(name));

const staticAttribute = (element, name) =>
  element.attributes.find((attribute) => attribute.name === name);

const boundAttribute = (element, name) =>
  element.inputs.find((input) => input.name === name);

const hasAccessibleNameAttribute = (element) =>
  hasAnyAttribute(element, ACCESSIBLE_NAME_ATTRIBUTES);

const descendants = function* (node) {
  for (const key of CHILD_KEYS) {
    const value = node[key];
    for (const child of Array.isArray(value) ? value : [value]) {
      if (!child || typeof child !== 'object') continue;
      yield child;
      yield* descendants(child);
    }
  }
};

/** Text of the element's own, anywhere inside it.
 *
 * Whitespace does not count: an indented multi-line element always has Text
 * children, so a bare "has a Text child" test exempts exactly the icon-only
 * elements these rules exist to catch. Interpolation (`{{ … }}`, a BoundText)
 * counts — it is text we cannot read, not the absence of text.
 */
const hasOwnText = (element) => {
  for (const node of descendants(element)) {
    if (node.type === 'BoundText') return true;
    if (node.type === 'Text' && /\S/.test(node.value)) return true;
  }
  return false;
};

const hasChildInSlot = (element, slot) => {
  for (const node of descendants(element)) {
    if (node.type !== 'Element') continue;
    if (staticAttribute(node, 'slot')?.value === slot) return true;
  }
  return false;
};

const containsElement = (element, name) => {
  for (const node of descendants(element)) {
    if (node.type === 'Element' && node.name === name) return true;
  }
  return false;
};

/** The parser services, or a message naming the parser that is missing.
 *
 * Without this, a template rule configured onto a file the TypeScript parser
 * owns fails with `undefined is not a function` from inside the rule.
 */
const templateParserServices = (context) => {
  const services = context.sourceCode.parserServices;
  if (
    !services?.convertElementSourceSpanToLoc ||
    !services?.convertNodeSourceSpanToLoc
  ) {
    throw new Error(
      "This rule requires '@angular-eslint/template-parser' to be the configured parser for the files it lints."
    );
  }
  return services;
};

module.exports = {
  ACCESSIBLE_NAME_ATTRIBUTES,
  attributeNames,
  boundAttribute,
  containsElement,
  descendants,
  hasAccessibleNameAttribute,
  hasAnyAttribute,
  hasAttribute,
  hasChildInSlot,
  hasOwnText,
  staticAttribute,
  templateParserServices,
};
