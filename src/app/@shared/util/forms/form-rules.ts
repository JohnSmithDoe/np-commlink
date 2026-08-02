import { SchemaPath, validate } from '@angular/forms/signals';
import dayjs from 'dayjs';
import { BaseItem } from '../../model/base-item.types';
import { matchesSearchExactly } from '../app.utils';

export const BLANK_TEXT = { kind: 'blankText' } as const;

const UNPARSEABLE_DATE = { kind: 'unparseableDate' } as const;

export function requireText(path: SchemaPath<string>): void {
  validate(path, ({ value }) =>
    value().trim().length === 0 ? BLANK_TEXT : null
  );
}

export function requireParseableDate(path: SchemaPath<string>): void {
  validate(path, ({ value }) =>
    dayjs(value()).isValid() ? null : UNPARSEABLE_DATE
  );
}

export const DUPLICATE_NAME = { kind: 'duplicateName' } as const;

export function requireUniqueName(
  path: SchemaPath<string>,
  siblings: () => readonly BaseItem[],
  editing: () => BaseItem | undefined
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
