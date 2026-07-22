import { IBaseItem, ICategory, TCategoryId } from '../types';

// Display resolution for the id-referenced category model: items/txns carry
// category IDs, the owning list holds the {id,name} catalog, so rendering a
// category name is a join against the catalog. Kept pure + domain-blind here so
// every display site (pipe, directive, cash pages) resolves the same way.

export const categoryName = (
  id: TCategoryId | undefined,
  catalog: readonly ICategory[]
): string => (id ? (catalog.find((cat) => cat.id === id)?.name ?? '') : '');

export const categoryNames = (
  item: IBaseItem | undefined,
  catalog: readonly ICategory[]
): string[] =>
  (item?.categoryIds ?? [])
    .map((id) => categoryName(id, catalog))
    .filter((name) => name.length > 0);

// Resolve a list of category ids to their {id,name} objects (dropping ids not in
// the catalog). Used by the edit dialogs to render the selected-category chips.
export const categoriesByIds = (
  ids: readonly TCategoryId[] | undefined,
  catalog: readonly ICategory[]
): ICategory[] =>
  (ids ?? [])
    .map((id) => catalog.find((cat) => cat.id === id))
    .filter((cat): cat is ICategory => !!cat);
