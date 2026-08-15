/* ─── why ─────────────────────────────────────────────────────────
 * One contract carried by a query-param name: the catalog facade writes
 * it, two domains read it, and the string used to be spelled out in all of
 * them with nothing linking them. Renaming it in the writer left the
 * readers silently finding nothing — the shape of a composed i18n key, and
 * just as invisible to every gate.
 *
 * It lives in `util/` rather than beside either side because both sides
 * are `data/`, and `data → util` is the only edge Sheriff allows between
 * them.
 * ───────────────────────────────────────────────────────────────── */

import { CategoryId } from '../../model/category.types';

export const CATEGORY_FILTER_PARAM = 'filter';

export const categoryFilterQueryParameters = (
  id: CategoryId
): Record<string, CategoryId> => ({ [CATEGORY_FILTER_PARAM]: id });
