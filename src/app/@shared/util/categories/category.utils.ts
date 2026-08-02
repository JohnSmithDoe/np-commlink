import { BaseItem } from '../../model/base-item.types';
import { Category, CategoryId } from '../../model/category.types';

export const categoryName = (
  id: CategoryId | undefined,
  catalog: readonly Category[]
): string => (id ? (catalog.find((cat) => cat.id === id)?.name ?? '') : '');

export const categoryNameLookup = (
  catalog: readonly Category[]
): ((id: CategoryId | undefined) => string) => {
  const nameById = new Map(catalog.map((cat) => [cat.id, cat.name]));
  return (id) => (id ? (nameById.get(id) ?? '') : '');
};

export const categoryNames = (
  item: BaseItem | undefined,
  catalog: readonly Category[]
): string[] => categoryNamesVia(item, (id) => categoryName(id, catalog));

const categoryNamesVia = (
  item: BaseItem | undefined,
  nameOf: (id: CategoryId | undefined) => string
): string[] =>
  (item?.categoryIds ?? [])
    .map((id) => nameOf(id))
    .filter((name) => name.length > 0);

export const anyCategoryNameMatches = (
  item: BaseItem | undefined,
  nameOf: (id: CategoryId | undefined) => string,
  matches: (name: string) => boolean
): boolean => (item?.categoryIds ?? []).some((id) => matches(nameOf(id)));

export const categoryById = (
  catalog: readonly Category[],
  id: CategoryId
): Category | undefined => catalog.find((entry) => entry.id === id);

export const categoriesByIds = (
  ids: readonly CategoryId[] | undefined,
  catalog: readonly Category[]
): Category[] =>
  (ids ?? [])
    .map((id) => catalog.find((cat) => cat.id === id))
    .filter((cat): cat is Category => !!cat);
