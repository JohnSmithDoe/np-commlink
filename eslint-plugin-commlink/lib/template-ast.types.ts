import type { AST, Rule } from 'eslint';

// Hand-written because @angular-eslint/template-parser ships no node types: its
// nodes are Angular *compiler* nodes decorated with `type`/`loc`/`parent`, and
// the parser services arrive untyped off `context.sourceCode.parserServices`.
// The old CommonJS rule set papered over that with a `jsconfig.json` that turned
// checking off entirely; these declarations are the narrow alternative — only
// the fields the rules actually read.

export interface TemplateAttribute {
  name: string;
  value: string;
  loc: AST.SourceLocation;
}

/** `[foo]="bar"`. The parser strips an `attr.` prefix, so `[attr.aria-label]`
 * arrives here named plain `aria-label` — a check written against the prefixed
 * form matches nothing and passes everything. */
export interface TemplateBoundAttribute {
  name: string;
  loc: AST.SourceLocation;
}

/** Anything the descendant walk may encounter — elements, text, and the block
 * nodes (`@if`, `@for`, …) that hold their children one level deeper. */
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

/** A quoted i18n key parses to a `Literal` in TypeScript and a
 * `LiteralPrimitive` in an Angular template — same leak, two ASTs. */
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
