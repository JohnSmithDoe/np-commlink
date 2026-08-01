import { SchemaPath, validate } from '@angular/forms/signals';
import dayjs from 'dayjs';
import { IBaseItem } from '../../model/base-item.types';
import { matchesSearchExactly } from '../app.utils';

/** What a field that must be filled in reports while it is not. */
export const BLANK_TEXT = { kind: 'blankText' } as const;

/** What a date field reports while its box holds something unparseable. */
const UNPARSEABLE_DATE = { kind: 'unparseableDate' } as const;

/**
 * Required, but whitespace-aware — the one rule every dialog in this app repeats.
 * The built-in `required()` counts `'   '` as present, while every `persist()`
 * here trims before it writes, so a space-only name would save as `''`.
 *
 * Naming the kind ourselves is the second reason: it is what lets a dialog
 * exclude "empty" from the errors that earn a visible note. An untouched field
 * disables the save; it does not complain.
 */
export function requireText(path: SchemaPath<string>): void {
  validate(path, ({ value }) =>
    value().trim().length === 0 ? BLANK_TEXT : null
  );
}

/**
 * The second rule every dated dialog repeats. Every date box in the app is
 * clearable, and `dayjs('').format()` returns the *string* `'Invalid Date'` —
 * which persists happily, sorts above every real date, buckets into a phantom
 * month in the report, and can never be reconciled. So a cleared box has to fail
 * validation rather than reach `persist()`.
 */
export function requireParseableDate(path: SchemaPath<string>): void {
  validate(path, ({ value }) =>
    dayjs(value()).isValid() ? null : UNPARSEABLE_DATE
  );
}

/** What a name field reports while another item in the list already has it. */
export const DUPLICATE_NAME = { kind: 'duplicateName' } as const;

/**
 * The list dialogs' name rule: filled in, and not already taken by a *sibling*.
 *
 * `siblings` must be the whole aggregate, not a page's filtered view of it — a
 * narrowed set silently narrows the rule. It and `editing` are **thunks**, not
 * signals, for two reasons that both bite: a schema is built once per dialog while
 * both change per open, so the rule has to read them when it runs; and `form()`
 * evaluates the schema *eagerly*, at field-initialization time, when the fields
 * they read may not exist yet — a thunk defers the property read past that, so the
 * rule cannot depend on the order a class happens to declare its fields in.
 *
 * Comparison is `matchesSearchExactly`, the same normalization the list's own
 * search uses, so "Milk" and " milk " count as the same name here exactly as they
 * do there. The item under edit is excluded by id, which is what lets a rename
 * that changes only capitalization save.
 */
export function requireUniqueName(
  path: SchemaPath<string>,
  siblings: () => readonly IBaseItem[],
  editing: () => IBaseItem | undefined
): void {
  requireText(path);
  validate(path, ({ value }) => {
    const twins = siblings().filter((item) =>
      matchesSearchExactly(item, value())
    );
    const editingId = editing()?.id;
    const taken = twins.some((twin) => twin.id !== editingId);
    return taken ? DUPLICATE_NAME : null;
  });
}
