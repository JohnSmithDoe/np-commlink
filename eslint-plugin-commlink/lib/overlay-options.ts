/* ─── why ─────────────────────────────────────────────────────────
 * Readers over a `<controller>.create({ … })` call in TypeScript.
 *
 * Which overlay is being created is decided by the RECEIVER'S NAME rather
 * than by its type: the check has to work in `@shared/util/present-modal.ts`,
 * where the controller arrives as a parameter, and a name-based test needs
 * no type information, so these rules stay usable on any config block.
 *
 * The `ctrl`/`controller` suffix is OPTIONAL, and that is the load-bearing
 * part. It used to be required, on the reasoning that `<kind>Ctrl` was
 * already the app's convention — which stopped being true without anything
 * saying so. `#toast` in `trackplay/data/trackplay.effects.ts` and `#alerts`
 * in `@shared/data/errors/global-error-handler.ts` were both invisible, and
 * the first of those is the one place in the app that presents a toast with
 * a `handler` — the exact shape R6 exists to report. A naming regex is a
 * gate whose coverage decays silently as names drift, so this one matches
 * the kind alone and treats the suffix and a plural as decoration.
 *
 * `ObjectExpression` is derived from an *argument* rather than from
 * `Rule.Node` directly: that union member carries `& NodeParentExtension`,
 * which a nested value like `htmlAttributes: { … }` does not have, so the
 * parent-bearing alias rejects the very nodes these helpers are handed.
 *
 * A spread makes every absence unprovable, and an unreadable
 * `htmlAttributes` counts as NAMED — a gate that reports what it cannot
 * know trains people to disable it.
 * ───────────────────────────────────────────────────────────────── */

import type { Rule } from 'eslint';

const RECEIVER =
  /^(modal|alert|actionsheet|loading|toast|popover)(ctrl|controller)?s?$/i;

type Node = Rule.Node;
export type CallExpression = Extract<Node, { type: 'CallExpression' }>;
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

export const isDecidable = (objectExpression: ObjectExpression): boolean =>
  objectExpression.properties.every(({ type }) => type === 'Property');

export const setsAriaLabelViaHtmlAttributes = (
  options: ObjectExpression
): boolean => {
  const htmlAttributes = property(options, 'htmlAttributes');
  if (!htmlAttributes) return false;
  if (htmlAttributes.type !== 'Property') return true;
  if (htmlAttributes.value.type !== 'ObjectExpression') return true;
  return hasProperty(htmlAttributes.value, 'aria-label');
};
