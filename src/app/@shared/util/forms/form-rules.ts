import { computed, Signal } from '@angular/core';
import { SchemaPath, validate } from '@angular/forms/signals';
import dayjs from 'dayjs';
import { BaseItem } from '../../model/base-item.types';
import { isExactSearchMatch } from '../app.utils';

export const BLANK_TEXT = { kind: 'blankText' } as const;

type ErrorKind = { kind: string };
type ErrorBearingField = () => { errors: () => readonly ErrorKind[] };

export const errorKindPresent = (
  field: ErrorBearingField,
  error: ErrorKind
): Signal<boolean> => {
  return computed(() => {
    return field()
      .errors()
      .some(({ kind }) => kind === error.kind);
  });
};

export const otherErrorKindPresent = (
  field: ErrorBearingField,
  error: ErrorKind
): Signal<boolean> => {
  return computed(() => {
    return field()
      .errors()
      .some(({ kind }) => kind !== error.kind);
  });
};

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

export const isNameTaken = (
  siblings: readonly BaseItem[],
  name: string,
  editingId?: string
): boolean => {
  return siblings.some(
    (item) => isExactSearchMatch(item, name) && item.id !== editingId
  );
};

export function requireUniqueName(
  path: SchemaPath<string>,
  siblings: () => readonly BaseItem[],
  editing: () => BaseItem | undefined
): void {
  requireText(path);
  validate(path, ({ value }) =>
    isNameTaken(siblings(), value(), editing()?.id) ? DUPLICATE_NAME : null
  );
}
