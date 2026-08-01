// np-commlink — the type-scale gate, as a stylelint rule.
//
// Why stylelint and not eslint-plugin-commlink, where every other gate lives:
// ESLint cannot read SCSS. `@eslint/css` is a CSS parser (css-tree), and with
// `tolerant: false` all seven theme partials fail outright. `tolerant: true`
// does not fix that — it hides it: a trial run saw 47 of 52 declarations and
// reported zero errors, silently losing the whole of `_shadowrun.scss` because
// a `//` comment (not CSS at all) contained prose it choked on. A gate blind to
// the file that defines the scale is worse than no gate. stylelint parses SCSS
// through postcss-scss, which understands `//` comments by design.
//
// Exceptions are `/* stylelint-disable-next-line */` at the call site rather
// than a path allowlist in the config: local, greppable, and it carries the
// reason next to the value instead of in a file nobody opens.

import fs from 'node:fs';
import path from 'node:path';
import stylelint from 'stylelint';

const ruleName = 'commlink/font-size-uses-scale';

const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected: (value, rungs) =>
    `Unexpected font-size literal "${value}". Use a rung from the type scale ` +
    `(${rungs}). If none fits, add a step to the scale in ` +
    `src/theme/_shadowrun.scss rather than inventing a value here.`,
});

const SCALE_FILE = 'src/theme/_shadowrun.scss';

/** Read the rung names off the scale itself, so the message cannot drift from
 *  the tokens. Memoised — one read per lint run, not per file. */
let rungs;
const readRungs = () => {
  if (rungs) return rungs;
  const source = fs.readFileSync(path.resolve(SCALE_FILE), 'utf8');
  rungs = [...source.matchAll(/^\s*(--fs-[\w-]+):/gm)]
    .map((match) => match[1])
    .join(' · ');
  return rungs;
};

const ruleFunction = (primary) => (root, result) => {
  if (!stylelint.utils.validateOptions(result, ruleName, { actual: primary })) {
    return;
  }

  root.walkDecls('font-size', (decl) => {
    const value = decl.value.trim();
    if (value.startsWith('var(--fs-')) return;
    if (value.startsWith('$')) return; // a mixin parameter; the caller passes a rung

    stylelint.utils.report({
      result,
      ruleName,
      message: messages.rejected(value, readRungs()),
      node: decl,
      word: value,
    });
  });
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = {
  url: 'https://codeberg.org/Letothec0dem0nkey/np-commlink/src/branch/main/stylelint/font-size-uses-scale.mjs',
};

export default stylelint.createPlugin(ruleName, ruleFunction);
