/* ─── why ─────────────────────────────────────────────────────────
 * Shape and placement, never presence. No rule can tell a file whose
 * decisions are non-derivable from one whose code already reads as
 * its own summary, so a missing header is never a finding — the
 * block's mere existence is the signal, and demanding one everywhere
 * would destroy exactly that signal.
 *
 * A directive is addressed to a tool, not to a reader, so it is
 * allowed in any position. But a directive is a KEYWORD PLUS THE
 * TOOL'S OWN SYNTAX, never a keyword plus prose: a paragraph opening
 * "eslint-disable naming that decision …" is a sentence, and matching
 * the keyword alone let it exempt itself, leaving a hole in the middle
 * of the paragraph around it. Where a tool honours the keyword in only
 * one comment shape, that shape is part of the syntax — measured,
 * `// eslint-disable no-var` suppresses nothing, so as a line comment
 * it is prose no matter what follows it.
 *
 * The `@ts-*` family is the exception that stays keyword-only:
 * TypeScript defines the tail as a free-text description, so there is
 * no syntax left to check and only a paragraph literally beginning
 * `@ts-expect-error` can slip through.
 *
 * A global list is comma-separated here even though ESLint also
 * tolerates bare whitespace, because "globals are shared state" parses
 * as three whitespace-separated names — the separator is the only
 * thing telling a declaration from a sentence.
 *
 * The trailing slot is the one position that stays anchored to the
 * token it describes, so it is the home of a LABEL — a cross-reference
 * the type system cannot carry, a domain fact about an opaque literal.
 * It is bounded because prettier never wraps a comment: unbounded, it
 * would simply absorb the own-line prose this rule bans.
 *
 * The banner dashes are U+2500 (─); a hyphen run looks the same at a
 * glance and is why the first/last line each get their own message.
 * Banner lines are split CRLF-tolerantly, so a correct banner is never
 * accused of a shape complaint over a line ending nobody can see.
 *
 * A file that is nothing but comments has no first code token, so it
 * is read as all header: there is no code for prose to sit below.
 *
 * JSDoc above the imports is reported as JSDoc rather than as a
 * malformed banner — it fails the shape either way, and that is the
 * accurate diagnosis of how it got there.
 *
 * No autofix. Deleting a comment is a judgement about whether its
 * content survives as a name, an extraction, a header line or a
 * paragraph in docs/ — four different edits, none mechanical.
 * ───────────────────────────────────────────────────────────────── */

import type { Rule } from 'eslint';

const BANNER_OPEN = /^\/\* ─{3} why ─+$/;
const BANNER_CLOSE = /^ \* ─+ \*\/$/;
const BANNER_INTERIOR = /^ \*( .*)?$/;
const LINE_BREAK = /\r?\n/;

const TRAILING_LABEL_MAX = 60;

const RULE_NAME = String.raw`@?[\w$-]+(?:\/[\w$-]+)*`;
const RULE_LIST = new RegExp(
  String.raw`^${RULE_NAME}(?:\s*,\s*${RULE_NAME})*$`
);
const GLOBAL_NAME = String.raw`[\w$]+(?:\s*:\s*\w+)?`;
const GLOBAL_LIST = new RegExp(
  String.raw`^${GLOBAL_NAME}(?:\s*,\s*${GLOBAL_NAME})*$`
);
const DESCRIPTION_SEPARATOR = /(?:^|\s)--(?=\s|$)/;

const SUPPRESSION =
  /^(?:eslint-disable-next-line|eslint-disable-line|eslint-disable|eslint-enable)(?![\w-])/;
const SUPPRESSION_NEEDING_BLOCK = /^eslint-(?:disable|enable)(?![\w-])/;
const RULE_SEVERITY_CONFIG = /^eslint\s+@?[\w$/-]+\s*:/;
const GLOBAL_DECLARATION = /^(?:globals?|exported|eslint-env)(?![\w-])/;
const TYPESCRIPT_DIRECTIVE =
  /^@ts-(?:expect-error|ignore|nocheck|check)(?![\w-])/;
const PRETTIER_IGNORE = /^prettier-ignore(?:-start|-end|-attribute)?$/;
const TRIPLE_SLASH_REFERENCE = /^\/\s*<reference\s[^>]*\/>$/;
const VITE_IGNORE = /^@vite-ignore$/;
const WEBPACK_MAGIC = /^webpack[A-Z][A-Za-z]*\s*:\s*\S/;
const COVERAGE_IGNORE =
  /^(?:istanbul|c8|v8) ignore (?:next|if|else|file|start|stop|end)(?:\s+\d+)?(?:\s*(?::|--)[\s\S]*)?$/;

interface CommentLike {
  type: string;
  value: string;
  range?: [number, number];
  loc?: Rule.Node['loc'];
}

const beforeDescription = (payload: string): string =>
  (payload.split(DESCRIPTION_SEPARATOR)[0] ?? '').trim();

const isRuleList = (payload: string): boolean => {
  const listed = beforeDescription(payload);
  return listed === '' || RULE_LIST.test(listed);
};

const isSuppression = (comment: CommentLike, body: string): boolean => {
  const keyword = SUPPRESSION.exec(body);
  if (!keyword) return false;
  if (comment.type !== 'Block' && SUPPRESSION_NEEDING_BLOCK.test(body))
    return false;
  return isRuleList(body.slice(keyword[0].length));
};

const isGlobalDeclaration = (body: string): boolean => {
  const keyword = GLOBAL_DECLARATION.exec(body);
  return (
    keyword !== null && GLOBAL_LIST.test(body.slice(keyword[0].length).trim())
  );
};

const isBundlerMagic = (body: string): boolean =>
  VITE_IGNORE.test(body) || WEBPACK_MAGIC.test(body);

const isDirective = (comment: CommentLike): boolean => {
  const body = comment.value.trim();
  const inBlock = comment.type === 'Block';
  return (
    isSuppression(comment, body) ||
    (inBlock && RULE_SEVERITY_CONFIG.test(body)) ||
    (inBlock && isGlobalDeclaration(body)) ||
    (inBlock && isBundlerMagic(body)) ||
    TYPESCRIPT_DIRECTIVE.test(body) ||
    PRETTIER_IGNORE.test(body) ||
    COVERAGE_IGNORE.test(body) ||
    (comment.type === 'Line' && TRIPLE_SLASH_REFERENCE.test(body))
  );
};

const isHashbang = (comment: CommentLike): boolean =>
  comment.type === 'Shebang';

const isJsdocBlock = (comment: CommentLike): boolean =>
  comment.type === 'Block' && comment.value.startsWith('*');

const bannerLines = (comment: CommentLike): string[] =>
  `/*${comment.value}*/`.split(LINE_BREAK);

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'A file carries at most one comment — a `why` banner above the first code token, listing what is not derivable from the code — plus short `//` labels trailing a line of code.',
    },
    schema: [],
    messages: {
      commentInBody:
        "A comment below the first code token has nowhere to be right. If it explains HOW, the code has to say that itself — extract the block into a named function. If it explains WHY and is about this file, move it into the file's `why` banner above the imports. If it generalises past this file, it is a paragraph in docs/, said once. Down here only a tool directive (eslint-disable, @ts-expect-error, prettier-ignore, …) or a `//` label of at most {{max}} characters trailing a line of code may sit.",
      jsdocComment:
        "JSDoc restates a signature the compiler already has, in a second place that drifts. Types carry the contract; names carry the intent. Whatever is left — a decision a reader could not derive — goes in the file's `why` banner above the first import, and anything true beyond this file goes in docs/.",
      multipleHeaderComments:
        "A file gets ONE header block. A second one means the first is not the list of this file's non-obvious decisions any more — merge them, or move the general half into docs/ where it is said once.",
      headerIsLineComment:
        'The header is a single `/* … */` block, not a run of `//` lines. The shape is what makes the block visible as one thing and machine-checkable; a run of line comments grows one line at a time into a summary of the file.',
      bannerFirstLine:
        'The header block must open with exactly `/* ─── why ─────…` (U+2500 box-drawing dashes, not hyphens) on its own line. The word `why` is the contract: this block lists decisions, not what the file contains.',
      bannerLastLine:
        'The header block must close with a rule line — ` * ─────… */` (U+2500 dashes) on its own line.',
      bannerInteriorLine:
        'Every interior line of the header block starts with ` * `. Nothing else is a header line, so a stray line means the block has grown a second shape.',
      trailingCommentIsBlock:
        'A comment sharing a line with code is a `//` label, never a `/* … */` block. The block form carries no end-of-line, so it can grow into the paragraph the trailing slot exists to keep out — and it can sit mid-expression, where it is no longer a label for anything a reader can point at.',
      trailingCommentTooLong:
        "A trailing comment is a LABEL, not a paragraph: at most {{max}} characters after `//`. Prettier never wraps a comment, so unbounded this slot would simply absorb the own-line prose this rule bans. Keep the cross-reference the types cannot carry (`// -> GameType.id`, `// a Saturday`, `// R4`) and move the sentence to this file's `why` banner or to docs/.",
      trailingCommentNotAlone:
        'One label per line. A second comment sharing a line with code is not anchored to a single token any more, so it is prose in a slot that only looks like a label — keep the one that names what the code cannot, and move the rest up into the `why` banner.',
    },
  },
  create(context) {
    const { sourceCode } = context;
    const comments = sourceCode.getAllComments() as unknown as CommentLike[];
    if (comments.length === 0) return {};

    const tokens = sourceCode.ast.tokens ?? [];
    const codeStartsAt = tokens[0]?.range?.[0] ?? Number.POSITIVE_INFINITY;

    const firstCodeEndByLine = new Map<number, number>();
    for (const token of tokens) {
      const line = token.loc?.end.line ?? 0;
      if (!firstCodeEndByLine.has(line))
        firstCodeEndByLine.set(line, token.range[1]);
    }

    const trailsCode = (comment: CommentLike): boolean =>
      (firstCodeEndByLine.get(comment.loc?.start.line ?? 0) ??
        Number.POSITIVE_INFINITY) <= (comment.range?.[0] ?? 0);

    const trailingPerLine = new Map<number, number>();
    for (const comment of comments) {
      if (!trailsCode(comment)) continue;
      const line = comment.loc?.start.line ?? 0;
      trailingPerLine.set(line, (trailingPerLine.get(line) ?? 0) + 1);
    }

    const report = (comment: CommentLike, messageId: string) => {
      if (!comment.loc) return;
      context.report({
        loc: comment.loc,
        messageId,
        data: { max: String(TRAILING_LABEL_MAX) },
      });
    };

    const checkTrailingLabel = (comment: CommentLike) => {
      if (comment.type !== 'Line') {
        report(comment, 'trailingCommentIsBlock');
        return;
      }
      if ((trailingPerLine.get(comment.loc?.start.line ?? 0) ?? 0) > 1) {
        report(comment, 'trailingCommentNotAlone');
        return;
      }
      if (comment.value.trim().length > TRAILING_LABEL_MAX)
        report(comment, 'trailingCommentTooLong');
    };

    const checkBanner = (comment: CommentLike) => {
      const lines = bannerLines(comment);
      const last = lines.length - 1;
      if (!BANNER_OPEN.test(lines[0] ?? '')) {
        report(comment, 'bannerFirstLine');
        return;
      }
      if (last === 0 || !BANNER_CLOSE.test(lines[last] ?? '')) {
        report(comment, 'bannerLastLine');
        return;
      }
      const stray = lines
        .slice(1, last)
        .some((line) => !BANNER_INTERIOR.test(line));
      if (stray) report(comment, 'bannerInteriorLine');
    };

    const checkHeader = (comment: CommentLike, index: number) => {
      if (index > 0) {
        report(comment, 'multipleHeaderComments');
        return;
      }
      if (comment.type !== 'Block') {
        report(comment, 'headerIsLineComment');
        return;
      }
      if (isJsdocBlock(comment)) {
        report(comment, 'jsdocComment');
        return;
      }
      checkBanner(comment);
    };

    return {
      'Program:exit'() {
        let headerIndex = 0;
        for (const comment of comments) {
          if (isHashbang(comment) || isDirective(comment)) continue;
          if (trailsCode(comment)) {
            checkTrailingLabel(comment);
            continue;
          }
          if ((comment.range?.[0] ?? 0) < codeStartsAt) {
            checkHeader(comment, headerIndex);
            headerIndex += 1;
            continue;
          }
          report(
            comment,
            isJsdocBlock(comment) ? 'jsdocComment' : 'commentInBody'
          );
        }
      },
    };
  },
};
