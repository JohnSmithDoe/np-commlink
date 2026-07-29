'use strict';

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

const receiverName = (node) => {
  if (!node) return undefined;
  if (node.type === 'Identifier' || node.type === 'PrivateIdentifier') {
    return node.name;
  }
  if (node.type === 'MemberExpression') return receiverName(node.property);
  return undefined;
};

/** 'modal' | 'alert' | 'actionsheet' | 'loading' | 'toast' | 'popover' */
const overlayKind = (calleeObject) => {
  const name = receiverName(calleeObject);
  return name ? RECEIVER.exec(name)?.[1].toLowerCase() : undefined;
};

const isCreateCall = (node) =>
  node.callee.type === 'MemberExpression' &&
  !node.callee.computed &&
  node.callee.property.type === 'Identifier' &&
  node.callee.property.name === 'create';

const propertyName = (property) => {
  if (property.type !== 'Property') return undefined;
  if (property.key.type === 'Identifier') return property.key.name;
  if (property.key.type === 'Literal') return String(property.key.value);
  return undefined;
};

const property = (objectExpression, name) =>
  objectExpression.properties.find(
    (candidate) => propertyName(candidate) === name
  );

const hasProperty = (objectExpression, name) =>
  property(objectExpression, name) !== undefined;

/** A spread makes every absence unprovable — the name may well be in there. */
const isDecidable = (objectExpression) =>
  objectExpression.properties.every(({ type }) => type === 'Property');

/** Does `htmlAttributes: { 'aria-label': … }` set a name?
 *
 * `htmlAttributes` is the seam for *any* ARIA attribute on a
 * controller-presented overlay; a spread or a variable makes the answer
 * unknowable, and unknown counts as named so the rule cannot cry wolf.
 */
const setsAriaLabelViaHtmlAttributes = (options) => {
  const htmlAttributes = property(options, 'htmlAttributes');
  if (!htmlAttributes) return false;
  if (htmlAttributes.value.type !== 'ObjectExpression') return true;
  return hasProperty(htmlAttributes.value, 'aria-label');
};

module.exports = {
  hasProperty,
  isCreateCall,
  isDecidable,
  overlayKind,
  property,
  propertyName,
  setsAriaLabelViaHtmlAttributes,
};
