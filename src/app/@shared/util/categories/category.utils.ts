import { IBaseItem } from '../../model/base-item.types';
import { ICategory, TCategoryId } from '../../model/category.types';

// Display resolution for the id-referenced category model: items/txns carry
// category IDs, the owning list holds the {id,name} catalog, so rendering a
// category name is a join against the catalog. Kept pure + domain-blind here so
// every display site (pipe, directive, cash pages) resolves the same way.

export const categoryName = (
  id: TCategoryId | undefined,
  catalog: readonly ICategory[]
): string => (id ? (catalog.find((cat) => cat.id === id)?.name ?? '') : '');

// Same resolution, indexed once up front — for tables that resolve a name per
// row, where `categoryName`'s catalog scan would be quadratic.
export const categoryNameLookup = (
  catalog: readonly ICategory[]
): ((id: TCategoryId | undefined) => string) => {
  const nameById = new Map(catalog.map((cat) => [cat.id, cat.name]));
  return (id) => (id ? (nameById.get(id) ?? '') : '');
};

export const categoryNames = (
  item: IBaseItem | undefined,
  catalog: readonly ICategory[]
): string[] => categoryNamesVia(item, (id) => categoryName(id, catalog));

// The per-row form, over a lookup built once — same bargain as
// `categoryNameLookup`, and for callers that loop it is the only correct one:
// `categoryNames` rescans the catalog per id, so a search over N items with K
// ids each costs N×K×|catalog| comparisons.
const categoryNamesVia = (
  item: IBaseItem | undefined,
  nameOf: (id: TCategoryId | undefined) => string
): string[] =>
  (item?.categoryIds ?? [])
    .map((id) => nameOf(id))
    .filter((name) => name.length > 0);

// The same join asked as a question, which is all the cross-list search needs —
// so it allocates no name array per candidate either.
export const anyCategoryNameMatches = (
  item: IBaseItem | undefined,
  nameOf: (id: TCategoryId | undefined) => string,
  matches: (name: string) => boolean
): boolean => (item?.categoryIds ?? []).some((id) => matches(nameOf(id)));

/**
 * The catalog entry an id names.
 *
 * Exists so its reason has one home rather than two. A facade deleting a
 * category holds only the id, and the action takes the whole entity — so it
 * resolves the entry rather than passing `{ id }` with a stubbed name, because
 * inventing half an entity to satisfy a signature is the kind of lie that
 * survives until something reads the field. Both list facades that do this
 * carried that paragraph verbatim.
 */
export const categoryById = (
  catalog: readonly ICategory[],
  id: TCategoryId
): ICategory | undefined => catalog.find((entry) => entry.id === id);

// Resolve a list of category ids to their {id,name} objects (dropping ids not in
// the catalog). Used by the edit dialogs to render the selected-category chips.
export const categoriesByIds = (
  ids: readonly TCategoryId[] | undefined,
  catalog: readonly ICategory[]
): ICategory[] =>
  (ids ?? [])
    .map((id) => catalog.find((cat) => cat.id === id))
    .filter((cat): cat is ICategory => !!cat);
