/* ─── why ─────────────────────────────────────────────────────────
 * Hand-written because @angular-eslint/template-parser ships no node
 * types: its nodes are Angular *compiler* nodes decorated with
 * `type`/`loc`/`parent`, and the parser services arrive untyped off
 * `context.sourceCode.parserServices`. The old CommonJS rule set papered
 * over that with a `jsconfig.json` that turned checking off entirely;
 * these declarations are the narrow alternative — only the fields the
 * rules actually read.
 *
 * The parser strips an `attr.` prefix, so `[attr.aria-label]` arrives as a
 * bound attribute named plain `aria-label`: a check written against the
 * prefixed form matches nothing and passes everything.
 *
 * `TemplateNode` is deliberately open-ended — the descendant walk also
 * meets the block nodes (`@if`, `@for`, …), which hold their children one
 * level deeper than an element does.
 *
 * A quoted i18n key parses to a `Literal` in TypeScript and a
 * `LiteralPrimitive` in a template — same leak, two ASTs.
 * ───────────────────────────────────────────────────────────────── */

import type { AST, Rule } from 'eslint';

export interface TemplateAttribute {
  name: string;
  value: string;
  loc: AST.SourceLocation;
}

export interface TemplateBoundAttribute {
  name: string;
  loc: AST.SourceLocation;
}

export interface TemplateNode {
  type: string;
  [key: string]: unknown;
}

export interface TemplateElement extends TemplateNode {
  type: 'Element';
  name: string;
  attributes: TemplateAttribute[];
  inputs: TemplateBoundAttribute[];
}

export interface TemplateLiteralPrimitive extends TemplateNode {
  type: 'LiteralPrimitive';
  value: unknown;
  loc: AST.SourceLocation;
}

export interface TemplateParserServices {
  convertElementSourceSpanToLoc: (
    context: Rule.RuleContext,
    node: TemplateNode
  ) => AST.SourceLocation;
  convertNodeSourceSpanToLoc: (
    context: Rule.RuleContext,
    node: TemplateNode
  ) => AST.SourceLocation;
}
