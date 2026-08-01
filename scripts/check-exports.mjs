#!/usr/bin/env node
/**
 * An `export` must have a reader outside its own file.
 *
 * `tsconfig.json` sets `noUnusedLocals`, and that flag cannot see an exported
 * declaration — so `export` is the one keyword that makes dead code invisible to
 * the compiler. Every symbol this gate unexports is handed to a check that
 * already exists; that is the point, and it is why this runs in CI rather than
 * being a cleanup someone remembers to do.
 *
 * It cannot be an eslint rule, for the reason `verify:testids` cannot either:
 * whether `foo`'s export is necessary is a fact about every OTHER file, and
 * eslint's model is per-file with a per-file cache. `knip` would cover this plus
 * unused dependencies, but `typescript` is already installed and its language
 * service resolves what a text scan cannot — the `loadChildren`/`loadComponent`
 * dynamic imports that are the only edge from the shell to eleven domains.
 *
 * Three directions, all decidable:
 *
 *   - **over-exported** — an exported declaration whose every reference is
 *     inside the declaring file. Drop the keyword.
 *   - **dead** — an exported declaration with no reference at all, not even a
 *     local one. Delete it.
 *   - **production-dead module** — a `src/` module no non-spec module imports.
 *     Its exports all have readers, so the two checks above stay quiet; the file
 *     is dead code with a green test in front of it. `grocery.guards.ts` was
 *     exactly this.
 *
 * A **spec-only** consumer is allowed, but only its own sibling — a white-box
 * unit test of the file it sits next to is the seam `type:testing` exists for
 * (`sheriff.config.ts` lets `*.spec.ts` reach any tag). A spec in a DIFFERENT
 * directory reaching for an internal is reported: the remedy is to move the
 * assertion beside its subject, not to widen the export. Four of those were
 * real, including a `groceries/data` spec unit-testing a `@shared/util` internal.
 *
 * What it deliberately does not decide: whether an export with several real
 * readers is at the right *altitude* — a `@shared/util` symbol two domains
 * import might still belong in one of them. Sheriff answers the legality of the
 * edge, not its wisdom, and neither does this.
 */
import { existsSync, globSync, readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const ROOT = process.cwd();

/**
 * `src/` and `e2e/`, the same scope `check-testids.mjs` walks. Root config files
 * (`sheriff.config.ts`, `vitest.config.ts`, …) are outside it on purpose: their
 * tool reads them rather than importing them, so every export there would be a
 * finding and every one would need an exemption. Nothing at the root imports
 * from `src/`, so leaving them out costs no resolution either.
 */
const files = [
  ...globSync('src/**/*.ts', { cwd: ROOT }),
  ...globSync('e2e/**/*.ts', { cwd: ROOT }),
]
  .map((file) => path.join(ROOT, file))
  .filter((file) => existsSync(file));

/**
 * Exempt, each with the reason here so the entry cannot outlive it. A file whose
 * only consumer is not an `import` at all belongs here; nothing else does.
 */
const EXEMPT_MODULES = new Map([
  [
    'src/environments/environment.prod.ts',
    "swapped in for environment.ts by angular.json's fileReplacements — the production build is its only importer",
  ],
]);

const isSpec = (file) => file.endsWith('.spec.ts');
const isE2e = (file) => path.relative(ROOT, file).startsWith('e2e' + path.sep);
const isTestKit = (file) => file.includes(`${path.sep}testing${path.sep}`);
const siblingSpecOf = (file) => file.replace(/\.ts$/, '.spec.ts');
const rel = (file) => path.relative(ROOT, file);

// `strict` is off and `types` empty: nothing here reads a diagnostic, only the
// binder's symbol resolution, and a full type-check would cost seconds for an
// answer no check uses.
const options = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ES2020,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  skipLibCheck: true,
  resolveJsonModule: true,
  baseUrl: ROOT,
  types: [],
};

const host = {
  getScriptFileNames: () => files,
  getScriptVersion: () => '1',
  getScriptSnapshot: (file) =>
    existsSync(file)
      ? ts.ScriptSnapshot.fromString(readFileSync(file, 'utf8'))
      : undefined,
  getCurrentDirectory: () => ROOT,
  getCompilationSettings: () => options,
  getDefaultLibFileName: (o) => ts.getDefaultLibFilePath(o),
  fileExists: ts.sys.fileExists,
  readFile: ts.sys.readFile,
  readDirectory: ts.sys.readDirectory,
  directoryExists: ts.sys.directoryExists,
  getDirectories: ts.sys.getDirectories,
  realpath: ts.sys.realpath,
};

const service = ts.createLanguageService(host, ts.createDocumentRegistry());
const program = service.getProgram();

/**
 * Top-level named exports only. `export default` carries no name to reference
 * and `export { x }` re-exports something already declared, so both would double
 * count what the declaration itself reports.
 */
function exportedDeclarations(source) {
  const found = [];
  const add = (name, kind) => {
    if (name && ts.isIdentifier(name))
      found.push({
        name: name.getText(source),
        pos: name.getStart(source),
        kind,
      });
  };

  for (const statement of source.statements) {
    const modifiers = ts.canHaveModifiers(statement)
      ? ts.getModifiers(statement)
      : undefined;
    const exported = modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
    );
    const isDefault = modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword
    );
    if (!exported || isDefault) continue;

    if (ts.isVariableStatement(statement))
      for (const declaration of statement.declarationList.declarations)
        add(declaration.name, 'const');
    else if (ts.isFunctionDeclaration(statement))
      add(statement.name, 'function');
    else if (ts.isClassDeclaration(statement)) add(statement.name, 'class');
    else if (ts.isInterfaceDeclaration(statement))
      add(statement.name, 'interface');
    else if (ts.isTypeAliasDeclaration(statement)) add(statement.name, 'type');
    else if (ts.isEnumDeclaration(statement)) add(statement.name, 'enum');
  }
  return found;
}

/**
 * Who imports whom, specs excluded as importers — which is what separates "dead"
 * from "only its own spec keeps it alive". Dynamic `import()` counts: it is the
 * single edge from `app.routes.ts` into a domain, so missing it would report all
 * eleven route manifests as dead.
 */
const importedByProduction = new Set();
for (const file of files) {
  if (isSpec(file)) continue;
  const source = program.getSourceFile(file);
  if (!source) continue;

  const specifiers = [];
  const collect = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    )
      specifiers.push(node.moduleSpecifier.text);
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    )
      specifiers.push(node.arguments[0].text);
    ts.forEachChild(node, collect);
  };
  collect(source);

  for (const specifier of specifiers) {
    const resolved = ts.resolveModuleName(specifier, file, options, ts.sys)
      .resolvedModule?.resolvedFileName;
    if (resolved && !resolved.includes('node_modules'))
      importedByProduction.add(path.resolve(resolved));
  }
}

// Entry points and ambient declarations are excluded structurally rather than
// exempted: nothing imports an entry point by definition, so an entry in the
// list above would be permanent and say nothing.
const ENTRY = /^src[/\\](?:main|polyfills)\.ts$|\.d\.ts$/;
const orphans = new Set(
  files
    .filter((file) => !isE2e(file) && !isSpec(file) && !isTestKit(file))
    .filter((file) => !ENTRY.test(rel(file)))
    .filter((file) => !EXEMPT_MODULES.has(rel(file)))
    .filter((file) => !importedByProduction.has(file))
);

const findings = [];
let scanned = 0;
let siblingOnly = 0;

for (const file of orphans)
  findings.push([
    'production-dead module',
    rel(file),
    'no non-spec module imports it — delete it, or wire it up',
  ]);

for (const file of files) {
  const source = program.getSourceFile(file);
  if (!source || source.isDeclarationFile) continue;
  if (EXEMPT_MODULES.has(rel(file))) continue;
  // Its exports being file-local is a CONSEQUENCE of the module being dead, not
  // a second thing to fix — reporting both makes one deletion read as two.
  if (orphans.has(file)) continue;

  for (const declaration of exportedDeclarations(source)) {
    scanned++;
    const references =
      service.getReferencesAtPosition(file, declaration.pos) ?? [];
    const where = `${rel(file)} :: ${declaration.kind} ${declaration.name}`;

    const external = [
      ...new Set(
        references
          .filter((reference) => reference.fileName !== file)
          .map((reference) => reference.fileName)
      ),
    ];

    if (external.length === 0) {
      // Compared by position, not by `isDefinition` — that field is OPTIONAL and
      // comes back undefined here, so filtering on it counted the declaration
      // itself as a use and made `dead` unreachable. Planting one is what said so.
      const localUses = references.filter(
        (reference) => reference.textSpan.start !== declaration.pos
      ).length;
      findings.push(
        localUses > 0
          ? [
              'over-exported',
              where,
              'every reference is in this file — drop the keyword',
            ]
          : ['dead', where, 'no reference anywhere — delete it']
      );
      continue;
    }

    // A test kit's whole job is to be imported by specs elsewhere, and an e2e
    // helper's by `*.e2e.ts`. Neither can have a sibling spec to be judged by.
    if (isTestKit(file) || isE2e(file)) continue;

    const nonSpec = external.filter(
      (consumer) => !isSpec(consumer) || isE2e(consumer)
    );
    if (nonSpec.length > 0) continue;

    const strays = external.filter(
      (consumer) => consumer !== siblingSpecOf(file)
    );
    if (strays.length === 0) {
      siblingOnly++;
      continue;
    }
    findings.push([
      'spec-reaches-across',
      where,
      `only specs read it, and ${strays.map(rel).join(', ')} is not its sibling — move the assertion beside its subject`,
    ]);
  }
}

// An exemption for a file that is imported normally now, or gone, is dead
// config — the same direction `verify:testids` checks for a declared id no spec
// references.
for (const [file, reason] of EXEMPT_MODULES) {
  const absolute = path.join(ROOT, file);
  if (!existsSync(absolute))
    findings.push([
      'stale exemption',
      file,
      `it is gone — drop the entry (${reason})`,
    ]);
  else if (importedByProduction.has(absolute))
    findings.push([
      'stale exemption',
      file,
      `something imports it now — drop the entry (${reason})`,
    ]);
}

for (const [kind, where, why] of findings)
  console.log(`${kind}  ${where}\n    ${why}`);

console.log(
  `\n${files.length} files · ${scanned} exports checked · ${siblingOnly} read only by their own spec · ${findings.length} to fix`
);
process.exitCode = findings.length > 0 ? 1 : 0;
