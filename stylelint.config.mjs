// np-commlink — the style layer's gate. `.mjs` rather than `.stylelintrc.json`
// because every switched-off rule below is a decision, and JSON cannot hold the
// reason next to it (stylelint rejects unknown keys, so a "_comment" comes back
// as "Unknown rule").
//
// Why stylelint at all, when every other gate is an eslint rule: ESLint cannot
// read SCSS. `@eslint/css` is a CSS parser, and with `tolerant: false` all seven
// theme partials fail outright. `tolerant: true` hides that rather than fixing
// it — a trial rule saw 47 of 52 `font-size` declarations and reported zero
// errors, silently losing the whole of `_shadowrun.scss` because a `//` comment
// (not CSS at all) held prose css-tree choked on. postcss-scss understands `//`
// by design, so stylelint sees the file the compiler sees.

export default {
  extends: ['stylelint-config-standard-scss'],
  plugins: [
    './stylelint/comments-header-only.mjs',
    './stylelint/font-size-uses-scale.mjs',
    './stylelint/muted-text-uses-token.mjs',
  ],
  rules: {
    'commlink/comments-header-only': true,
    'commlink/font-size-uses-scale': true,
    'commlink/muted-text-uses-token': true,

    // Prettier owns formatting, and already runs on SCSS in the pre-commit hook
    // and as its own gate. Leaving these on means two tools with opinions about
    // blank lines, and prettier is the one that can fix them.
    'rule-empty-line-before': null,
    'at-rule-empty-line-before': null,
    'declaration-empty-line-before': null,
    'custom-property-empty-line-before': null,
    'comment-empty-line-before': null,
    'scss/double-slash-comment-empty-line-before': null,

    // Reconfigured, NOT disabled: the app is kebab-case BEM everywhere, and the
    // only four exceptions (the wordclock's camelCase corners) were renamed to
    // fit rather than exempted.
    'selector-class-pattern': [
      '^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$',
      {
        message:
          'Expected class selector to be kebab-case BEM: block__element--modifier',
      },
    ],

    // `rgba(var(--sr-amber-rgb), α)` is the app's one way of tinting an accent,
    // 42 sites deep and consistent. The modern `rgb(… / α)` spelling would be a
    // mass rewrite that reads no better against a `--*-rgb` custom property.
    'color-function-alias-notation': null,
    'color-function-notation': null,
    'alpha-value-notation': null,

    // Cannot tell a keyword from a proper noun inside a custom property: its
    // autofix rewrote `Arial` to `arial` in the --sr-sans stack.
    'value-keyword-case': null,

    // `(width >= 768px)` against the Android System WebView the APK ships into.
    'media-feature-range-notation': null,

    // A bare `//` is the paragraph break inside a `why` banner, which
    // `commlink/comments-header-only` requires to be one contiguous `//` run —
    // so this rule and that one cannot both be on.
    'scss/comment-no-empty': null,
  },
};
