import type { Rule } from 'eslint';

// Readers over a `<controller>.create({ … })` call in TypeScript.
//
// Which overlay is being created is decided by the receiver's name rather than by
// its type: the check has to work in `@shared/util/present-modal.ts`, where the
// controller arrives as a parameter, and a name-based test needs no type
// information, so these rules stay usable on any config block. The cost is that
// a controller named something other than `<kind>Ctrl` / `<kind>Controller` is
// invisible to them — cheap to keep true, and it is already the app's convention.
const RECEIVER =
  /^(modal|alert|actionsheet|loading|toast|popover)(ctrl|controller)$/i;

type Node = Rule.Node;
export type CallExpression = Extract<Node, { type: 'CallExpression' }>;
// Derived from an *argument* rather than from `Rule.Node` directly: the union
// member carries `& NodeParentExtension`, which a nested value like
// `htmlAttributes: { … }` does not have, so the parent-bearing alias rejects the
// very nodes these helpers are handed.
export type ObjectExpression = Extract<
  CallExpression['arguments'][number],
  { type: 'ObjectExpression' }
>;
export type PropertyNode = ObjectExpression['properties'][number];

const receiverName = (node: unknown): string | undefined => {
  if (!node || typeof node !== 'object') return undefined;
  const candidate = node as Node;
  if (candidate.type === 'Identifier' || candidate.type === 'PrivateIdentifier')
    return candidate.name;
  if (candidate.type === 'MemberExpression')
    return receiverName(candidate.property);
  return undefined;
};

/** 'modal' | 'alert' | 'actionsheet' | 'loading' | 'toast' | 'popover' */
export const overlayKind = (calleeObject: unknown): string | undefined => {
  const name = receiverName(calleeObject);
  return name ? RECEIVER.exec(name)?.[1]?.toLowerCase() : undefined;
};

export const isCreateCall = (node: CallExpression): boolean =>
  node.callee.type === 'MemberExpression' &&
  !node.callee.computed &&
  node.callee.property.type === 'Identifier' &&
  node.callee.property.name === 'create';

export const propertyName = (property: PropertyNode): string | undefined => {
  if (property.type !== 'Property') return undefined;
  if (property.key.type === 'Identifier') return property.key.name;
  if (property.key.type === 'Literal') return String(property.key.value);
  return undefined;
};

export const property = (
  objectExpression: ObjectExpression,
  name: string
): PropertyNode | undefined =>
  objectExpression.properties.find(
    (candidate) => propertyName(candidate) === name
  );

export const hasProperty = (
  objectExpression: ObjectExpression,
  name: string
): boolean => property(objectExpression, name) !== undefined;

/** A spread makes every absence unprovable — the name may well be in there. */
export const isDecidable = (objectExpression: ObjectExpression): boolean =>
  objectExpression.properties.every(({ type }) => type === 'Property');

/** Does `htmlAttributes: { 'aria-label': … }` set a name?
 *
 * `htmlAttributes` is the seam for *any* ARIA attribute on a
 * controller-presented overlay; a spread or a variable makes the answer
 * unknowable, and unknown counts as named so the rule cannot cry wolf.
 */
export const setsAriaLabelViaHtmlAttributes = (
  options: ObjectExpression
): boolean => {
  const htmlAttributes = property(options, 'htmlAttributes');
  if (!htmlAttributes) return false;
  if (htmlAttributes.type !== 'Property') return true;
  if (htmlAttributes.value.type !== 'ObjectExpression') return true;
  return hasProperty(htmlAttributes.value, 'aria-label');
};
