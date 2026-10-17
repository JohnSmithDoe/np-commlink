import { RuleTester } from 'eslint';
import { rule as commentsHeaderOnly } from './comments-header-only.ts';

const typescript = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

const RULE = ` * ${'─'.repeat(65)} */`;

const banner = (...lines: string[]): string => {
  return [
    `/* ─── why ${'─'.repeat(55)}`,
    ...lines.map((line) => (line ? ` * ${line}` : ' *')),
    RULE,
  ].join('\n');
};

const CODE = "import { inject } from '@angular/core';\nexport const x = 1;";

typescript.run('comments-header-only', commentsHeaderOnly, {
  valid: [
    { code: CODE },
    { code: `${banner('A decision.', '', 'Another one.')}\n\n${CODE}` },
    { code: `#!/usr/bin/env node\n${banner('Runs from a shell.')}\n${CODE}` },
    { code: `${CODE}\nconst saturday = 6; // a Saturday` },
    {
      code: `${CODE}\n// eslint-disable-next-line no-console\nconsole.log(x);`,
    },
    { code: `${CODE}\n/* eslint-disable no-var, no-console -- legacy */` },
    { code: `${CODE}\n/* eslint-enable */` },
    { code: `${CODE}\n// @ts-expect-error the vendor type is wrong\nfoo(x);` },
    { code: `${CODE}\n// prettier-ignore\nconst m = [1,0, 0,1];` },
    { code: `${CODE}\n/* global window, document: readonly */` },
    { code: `${CODE}\n/* istanbul ignore next */\nfoo();` },
    { code: `${CODE}\nawait import(/* @vite-ignore */ url);` },
    { code: `/// <reference types="vitest/globals" />\n${CODE}` },
  ],
  invalid: [
    {
      code: `${CODE}\n// Load the account first.\nfoo();`,
      errors: [{ messageId: 'commentInBody', data: { max: '60' } }],
    },
    {
      code: `${CODE}\n/** Returns the account. */\nfunction account() {}`,
      errors: [{ messageId: 'jsdocComment' }],
    },
    {
      code: `/** The account page. */\n${CODE}`,
      errors: [{ messageId: 'jsdocComment' }],
    },
    {
      code: `${banner('One.')}\n${banner('Two.')}\n${CODE}`,
      errors: [{ messageId: 'multipleHeaderComments' }],
    },
    {
      code: `// The account page.\n${CODE}`,
      errors: [{ messageId: 'headerIsLineComment' }],
    },
    {
      code: `/* --- why ---------------\n * A decision.\n${RULE}\n${CODE}`,
      errors: [{ messageId: 'bannerFirstLine' }],
    },
    {
      code: `/* ─── why ${'─'.repeat(55)}\n * A decision.\n * -------------- */\n${CODE}`,
      errors: [{ messageId: 'bannerLastLine' }],
    },
    {
      code: `/* ─── why ${'─'.repeat(55)}\n * A decision.\n   stray\n${RULE}\n${CODE}`,
      errors: [{ messageId: 'bannerInteriorLine' }],
    },
    {
      code: `${banner(...Array.from({ length: 31 }, (_, index) => `Line ${index}.`))}\n${CODE}`,
      errors: [
        { messageId: 'bannerTooLong', data: { lines: '33', max: '32' } },
      ],
    },
    {
      code: `${CODE}\nconst saturday = 6; /* a Saturday */`,
      errors: [{ messageId: 'trailingCommentIsBlock' }],
    },
    {
      code: `${CODE}\nconst saturday = 6; // ${'a'.repeat(61)}`,
      errors: [{ messageId: 'trailingCommentTooLong', data: { max: '60' } }],
    },
    {
      code: `${CODE}\nconst s = f(/* a */ 6); // b`,
      errors: [
        { messageId: 'trailingCommentIsBlock' },
        { messageId: 'trailingCommentNotAlone' },
      ],
    },
    {
      code: `${CODE}\n// eslint-disable no-var\nvar y = 1;`,
      errors: [{ messageId: 'commentInBody' }],
    },
    {
      code: `${CODE}\n/* prettier-ignore the table below */`,
      errors: [{ messageId: 'commentInBody' }],
    },
    {
      code: `${CODE}\n/* istanbul ignore next because it is unreachable */\nfoo();`,
      errors: [{ messageId: 'commentInBody' }],
    },
    {
      code: `${CODE}\n/* globals are shared state */`,
      errors: [{ messageId: 'commentInBody' }],
    },
  ],
});
