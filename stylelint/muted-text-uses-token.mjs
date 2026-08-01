// np-commlink — "muted text is a token, not the accent at an alpha".
//
// `color: rgba(var(--sr-amber-rgb), 0.9)` is a deck idiom that does not survive
// the theme flip: the plain accent is a corporate blue on a light surface, so the
// same declaration paints blue-on-white where it painted amber-on-slate, and
// every such site measured under AA the last time they were swept (the faintest,
// geist's telemetry at α .55, was 2.36:1). `--sr-text-dim` is the token that
// means "muted" in each theme's own terms — and in cyberpunk it *is* the amber at
// .85, so adopting it is visually a no-op there.
//
// That sweep converted eight sites and three grew back, which is the argument for
// a rule rather than a paragraph: the ratio is what fails, and a ratio is not
// visible in a diff.
//
// Scope is deliberately narrow — a TEXT colour. An accent at an alpha is the
// right answer for a tinted *fill* or *border* (`background`, `border-color`,
// `box-shadow`: five, one and many sites, all fine), because those carry no
// contrast requirement of their own. And a `--sr-*` custom property is exempt
// because defining what "muted" means per theme is precisely the theme layer's
// job: `--sr-text-dim` and `--sr-line` are declared this way in
// `src/theme/_shadowrun.scss`.
//
// Exceptions go through `/* stylelint-disable-next-line */` at the call site,
// like the type-scale rule beside it — local, greppable, and carrying the reason
// next to the value.

import stylelint from 'stylelint';

const ruleName = 'commlink/muted-text-uses-token';

const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected: (property, value) =>
    `Unexpected accent-with-alpha as a text colour: "${property}: ${value}". ` +
    `Dimming the accent is a cyberpunk idiom that does not survive the flip — ` +
    `the plain accent is a blue on a light surface, so this reads as ` +
    `blue-on-white and fails AA. Use var(--sr-text-dim), which means "muted" in ` +
    `each theme's own terms (amber at .85 under cyberpunk). An accent at an ` +
    `alpha is still right for a fill or a border.`,
});

// `rgba(var(--sr-<hue>-rgb), α)` in any spelling stylelint's other rules allow.
const ACCENT_ALPHA = /rgba?\(\s*var\(\s*--sr-[\w-]+-rgb\s*\)/;

const isTextColorProperty = (property) =>
  property === 'color' ||
  (property.startsWith('--') &&
    !property.startsWith('--sr-') &&
    property.endsWith('color'));

const ruleFunction = (primary) => (root, result) => {
  if (!stylelint.utils.validateOptions(result, ruleName, { actual: primary })) {
    return;
  }

  root.walkDecls((decl) => {
    if (!isTextColorProperty(decl.prop)) return;
    if (!ACCENT_ALPHA.test(decl.value)) return;

    stylelint.utils.report({
      result,
      ruleName,
      message: messages.rejected(decl.prop, decl.value.trim()),
      node: decl,
      word: decl.value.trim(),
    });
  });
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = {
  url: 'https://codeberg.org/Letothec0dem0nkey/np-commlink/src/branch/main/stylelint/muted-text-uses-token.mjs',
};

export default stylelint.createPlugin(ruleName, ruleFunction);
