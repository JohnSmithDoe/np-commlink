// np-commlink — where a comment may sit in a stylesheet. The SCSS half of
// `commlink/comments-header-only`, whose TypeScript half is an eslint rule; the
// convention is one, stated once in CLAUDE.md.
//
// Shape and placement, never presence — same argument as the TS rule. No gate
// can tell a stylesheet whose decisions are non-derivable from one whose
// selectors already read as their own summary, so a missing banner is never a
// finding and the banner's mere existence is the signal.
//
// Nothing upstream expresses PLACEMENT, which is the whole rule, so this is
// step 2 of the ladder rather than step 1. Surveyed at stylelint 17.14.1 +
// stylelint-scss 7.2.0: `comment-pattern` polices shape but tests EVERY comment
// wherever it sits; `scss/double-slash-comment-inline` is all-or-nothing on
// trailing comments and carries no length bound; `scss/comment-no-loud`,
// `comment-empty-line-before`, `scss/double-slash-comment-empty-line-before`,
// `comment-whitespace-inside`, `comment-no-empty` and `comment-word-disallowed-list`
// are form, formatting or vocabulary. Eleven comment rules across the two
// packages, not one of which can see a comment's position relative to the code.
//
// The banner is a `//` RUN here and a `/* */` block in TypeScript — the inverse
// decision, and deliberate. SCSS already wrote 313 `//` against 42 loud,
// `scss/comment-no-loud` is upstream's expression of the same preference, and a
// bare `//` is a legal paragraph break inside the run (which is why
// `scss/comment-no-empty` stays off in the config). Emitted output is NOT the
// reason: the production bundle carries zero comments either way.
//
// A directive is addressed to a tool, so it is allowed in any position — but a
// directive is a KEYWORD PLUS THE TOOL'S OWN GRAMMAR, never a keyword plus
// prose. Matching the keyword alone let a paragraph opening "eslint-disable
// naming that decision …" exempt itself on the TS side, a real hole in the
// middle of a real banner. Unlike eslint, stylelint honours BOTH comment shapes
// (measured: `// stylelint-disable-next-line commlink/font-size-uses-scale`
// suppresses), so the shape is not part of the grammar here.
//
// The trailing slot is the one position anchored to the token it describes, so
// it is the home of a LABEL — `// unlit / dim default`, `// rgb mirror of
// --sr-bg (plain)`. It is bounded because prettier never wraps a comment:
// unbounded, the slot would simply absorb the own-line prose this rule bans.
//
// No autofix. Deleting a comment is a judgement about whether its content
// survives as a selector name, a token name, a banner line or a paragraph in
// docs/ — four different edits, none mechanical.

import stylelint from 'stylelint';

const ruleName = 'commlink/comments-header-only';

const TRAILING_LABEL_MAX = 60;

const messages = stylelint.utils.ruleMessages(ruleName, {
  commentInBody:
    'A comment below the first non-comment node has nowhere to be right. If it ' +
    'explains HOW, the selector, token or mixin name has to say that itself. If ' +
    "it explains WHY and is about this file, move it into the file's `why` " +
    'banner above the first `@use`. If it generalises past this file, it is a ' +
    'paragraph in docs/, said once. Down here only a stylelint directive or a ' +
    `\`//\` label of at most ${TRAILING_LABEL_MAX} characters trailing a line of code may sit.`,
  headerIsBlockComment:
    'The header is a run of `//` lines, not a `/* … */` block — the inverse of ' +
    'the TypeScript half, because SCSS already writes `//` almost everywhere ' +
    'and a bare `//` is a legal paragraph break inside the run.',
  multipleHeaderRuns:
    'A file gets ONE header run. A blank line splits it in two, which means the ' +
    "first is not the list of this file's non-obvious decisions any more — " +
    'merge them, or move the general half into docs/ where it is said once. A ' +
    'paragraph break inside the banner is a bare `//` line.',
  bannerFirstLine:
    'The header run must open with exactly `// ─── why ─────…` (U+2500 ' +
    'box-drawing dashes, not hyphens) on its own line. The word `why` is the ' +
    'contract: this run lists decisions, not what the file contains.',
  bannerLastLine:
    'The header run must close with a rule line — `// ─────…` (U+2500 dashes) ' +
    'on its own line.',
  bannerInteriorLine:
    'Every interior line of the header run is `// ` plus text, or a bare `//` ' +
    'as a paragraph break. Anything else means the run has grown a second shape.',
  trailingCommentIsBlock:
    'A comment sharing a line with code is a `//` label, never a `/* … */` ' +
    'block. The block form carries no end-of-line, so it can grow into the ' +
    'paragraph the trailing slot exists to keep out.',
  trailingCommentTooLong:
    `A trailing comment is a LABEL, not a paragraph: at most ${TRAILING_LABEL_MAX} ` +
    'characters after `//`. Prettier never wraps a comment, so unbounded this ' +
    'slot would absorb the own-line prose this rule bans. Keep the anchored ' +
    'cross-reference (`// unlit / dim default`, `// none in plain`) and move the ' +
    "sentence to this file's `why` banner or to docs/.",
  trailingCommentNotAlone:
    'One label per line. A second comment sharing a line with code is not ' +
    'anchored to a single token any more, so it is prose in a slot that only ' +
    'looks like a label.',
});

const LINE_BREAK = /\r?\n/;

const BANNER_OPEN = /^\/\/ ─{3} why ─+$/;
const BANNER_CLOSE = /^\/\/ ─+$/;
const BANNER_INTERIOR = /^\/\/( .*)?$/;

const DIRECTIVE_KEYWORD =
  /^stylelint-(?:disable|enable)(?:-next-line|-line)?(?![\w-])/;
const RULE_NAME = String.raw`@?[\w$-]+(?:\/[\w$-]+)*`;
const RULE_LIST = new RegExp(
  String.raw`^${RULE_NAME}(?:\s*,\s*${RULE_NAME})*$`
);
const DESCRIPTION_SEPARATOR = /(?:^|\s)--(?=\s|$)/;

// postcss-scss flags a `//` comment as inline; a loud comment carries no flag.
const isLineComment = (comment) => comment.raws.inline === true;

const isDirective = (comment) => {
  const body = comment.text.trim();
  const keyword = DIRECTIVE_KEYWORD.exec(body);
  if (!keyword) return false;
  const listed = (
    body.slice(keyword[0].length).split(DESCRIPTION_SEPARATOR)[0] ?? ''
  ).trim();
  return listed === '' || RULE_LIST.test(listed);
};

const lineRange = (from, to) =>
  Array.from({ length: Math.max(0, to - from) }, (_, step) => from + step);

const splitIntoRuns = (comments, isSkippableLine) => {
  const runs = [];
  let previous;
  for (const comment of comments) {
    const continuesRun =
      previous !== undefined &&
      lineRange(previous.source.end.line + 1, comment.source.start.line).every(
        (line) => isSkippableLine(line)
      );
    if (continuesRun) runs.at(-1).push(comment);
    else runs.push([comment]);
    previous = comment;
  }
  return runs;
};

const ruleFunction = (primary) => (root, result) => {
  if (!stylelint.utils.validateOptions(result, ruleName, { actual: primary })) {
    return;
  }

  const sourceLines = (root.source?.input.css ?? '').split(LINE_BREAK);
  const sourceLine = (line) => (sourceLines[line - 1] ?? '').trimEnd();

  const comments = [];
  root.walkComments((comment) => comments.push(comment));
  if (comments.length === 0) return;

  const report = (comment, message) =>
    stylelint.utils.report({ result, ruleName, message, node: comment });

  const trailsCode = (comment) =>
    sourceLine(comment.source.start.line)
      .slice(0, comment.source.start.column - 1)
      .trim() !== '';

  const trailingPerLine = new Map();
  for (const comment of comments) {
    if (!trailsCode(comment)) continue;
    const line = comment.source.start.line;
    trailingPerLine.set(line, (trailingPerLine.get(line) ?? 0) + 1);
  }

  const directiveLines = new Set();
  for (const comment of comments) {
    if (!isDirective(comment)) continue;
    for (const line of lineRange(
      comment.source.start.line,
      comment.source.end.line + 1
    ))
      directiveLines.add(line);
  }

  const checkTrailingLabel = (comment) => {
    if (!isLineComment(comment)) {
      report(comment, messages.trailingCommentIsBlock);
      return;
    }
    if ((trailingPerLine.get(comment.source.start.line) ?? 0) > 1) {
      report(comment, messages.trailingCommentNotAlone);
      return;
    }
    if (comment.text.trim().length > TRAILING_LABEL_MAX)
      report(comment, messages.trailingCommentTooLong);
  };

  const checkBannerShape = (run) => {
    const lines = run.map((comment) => sourceLine(comment.source.start.line));
    const last = lines.length - 1;
    if (!BANNER_OPEN.test(lines[0])) {
      report(run[0], messages.bannerFirstLine);
      return;
    }
    if (last === 0 || !BANNER_CLOSE.test(lines[last])) {
      report(run[last], messages.bannerLastLine);
      return;
    }
    const strayIndex = lines.findIndex(
      (line, index) => index > 0 && index < last && !BANNER_INTERIOR.test(line)
    );
    if (strayIndex !== -1) report(run[strayIndex], messages.bannerInteriorLine);
  };

  const checkHeader = (header) => {
    const loud = header.find((comment) => !isLineComment(comment));
    if (loud) {
      report(loud, messages.headerIsBlockComment);
      return;
    }
    const runs = splitIntoRuns(header, (line) => directiveLines.has(line));
    if (runs.length > 1) {
      report(runs[1][0], messages.multipleHeaderRuns);
      return;
    }
    checkBannerShape(runs[0]);
  };

  const firstCodeLine =
    root.nodes.find((node) => node.type !== 'comment')?.source?.start?.line ??
    Number.POSITIVE_INFINITY;

  const header = [];
  for (const comment of comments) {
    if (isDirective(comment)) continue;
    if (trailsCode(comment)) {
      checkTrailingLabel(comment);
      continue;
    }
    if (comment.source.start.line < firstCodeLine) header.push(comment);
    else report(comment, messages.commentInBody);
  }
  if (header.length > 0) checkHeader(header);
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = {
  url: 'https://github.com/JohnSmithDoe/np-commlink/blob/main/stylelint/comments-header-only.mjs',
};

export default stylelint.createPlugin(ruleName, ruleFunction);
