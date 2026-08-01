# The deck catalog — one configurable list behind the grid AND the side menu

> Part of the np-commlink compendium. Index and §-to-file map:
> [project-summary.md](./project-summary.md). Section numbers are stable across the split.
>
> **Here:** §7.1 — `DECK_CATALOG`, why it belongs to `commlink`, the `IDeckEntry` shape, the
> three-id-list persisted config where **absence means default**, theme-keyed labels, and the
> SYSOP escape hatch. **See also:** the other features (§7.2, §7.4–7.6) →
> [features.md](./features.md) · theme label blocks (§8) → [theming.md](./theming.md) ·
> why keys are declared, not composed (§9) → [i18n.md](./i18n.md).

## 7.1 The deck catalog — one configurable list behind the grid AND the side menu

`DECK_CATALOG` (`commlink/model/deck.catalog.ts`) is every navigable destination: the 13 deck
programs plus two menu-only rows (the deck's own home link, `/groceries/list-settings`). `CommlinkPage`
and `app.component.html` both render from it via `DeckFacade`, neither holding a list of its own.

**It is `commlink`'s.** A domain owns the routes it _serves_; it has no opinion about appearing in
navigation, under what codename, at which grid position — `groceries` knows nothing about being
MARKET, seventh, with a cart icon. Per-domain entry manifests would also have forced the shell to
import all eleven domains eagerly, undoing the `loadChildren`-only seal. It costs no new coupling
either: the shell already imported exactly one domain (`DashboardFacade`). And the catalog is the
static twin of a read-model commlink already owns — the read-model is _what each program reports_,
the catalog is _which programs exist, in what order_.

```ts
type IDeckEntry = {
  id: TDeckEntryId;        // stable — persisted config references it; never renamed
  module: TAppModule;      // coarse: 'groceries'. NOT the per-aggregate telemetry `source`
  icon: string;
  route: string;
  titleKey: TMarker;       // the *page's* title — the toolbar's, not the menu row's
  labels: Record<TTheme, { nameKey: TMarker; descKey: TMarker }>;
  onDeck: boolean;         // false for menu-only entries
  source?: string;         // telemetry badge
  metric?: string;
  metricKey?: TMarker;     // the badge's accessible name
  status?: TProgramStatus;
  needsLanguageModel?: boolean;
};
```

`module` is a **foreign key, not a tree** — a nested catalog buys nothing `groupBy(module)` in the
config UI doesn't. Note the two granularities: telemetry `source` is per _aggregate_ (`shopping`,
`storage`), `module` per _domain_ (`groceries`) — which is why there must never be a second spelling
of `'groceries'` in the catalog.

**Persisted state (`npc-deck`, eager) is three id lists, and absence means default:**

```ts
interface IDeckState {
  order: TDeckEntryId[];
  hiddenEntries: TDeckEntryId[];
  hiddenModules: TAppModule[];
}
```

`order` is a **list, never an `order: number`** — a number is a denormalized sequence needing
renumbering on every drop, tolerating gaps, and letting two entries claim `3`. A list _is_ the order,
and `ion-reorder-group` hands over `from`/`to`, which is one array move. Nothing copies the catalog:
a new program missing from `order` is appended in catalog order, missing from `hiddenEntries` is
visible, and a removed program's stale id is ignored at read time — so growing or shrinking the
catalog needs **no migration hop at all**. The one change that would is _renaming_ an id.

**The module flag cascades at read time and is never written into children:**
`visible(entry) = !hiddenModules.has(entry.module) && !hiddenEntries.has(entry.id)`. Writing `false`
into children on a module toggle would flatten whatever the user configured underneath, and
re-enabling could not restore it.

**Labels — theme is an axis of the key.** Codenames change with the theme, so the catalog carries no
single label: each entry declares `labels: Record<TTheme, {nameKey, descKey}>` of `marker(...)`
literals that `resolveLabels` indexes by `ThemeService.theme`. Spelled out rather than composed,
because a composed key is invisible to `i18n:extract --clean` (§9) — and the `Record<TTheme, …>`
annotation makes a third theme a **compile error at all 15 entries** instead of a raw key on screen.

**Both** surfaces render the resolved `nameKey`, so a menu row and its tile can never disagree;
`titleKey` (`page-title.*`) stays the _page's_ title. Splitting them is what stops the menu listing
"Einstellungen" twice — `/settings` and `/groceries/list-settings` share a title but have distinct
names.

Reading the theme without importing `settings` (a Sheriff violation): `@shared/util/theme/theme.service`
exposes a readable `theme` signal beside the `apply()` that writes `<html data-theme>`. Settings
**drives** the theme; anyone may **read** it — the same arrangement as `LanguageModelService`. That
also rules out a `| deckLabel` pipe: a _pure_ pipe caches on input identity and wouldn't re-run when
only the theme signal changed, and an _impure_ one is the pre-signals idiom. `hex` stays a pipe — its
input is the index, which does change on reorder. It is display only: `$index | hex`, so the top tile
always reads `0x01`.

**Surfaces.** One `order`/`visible` pair drives grid and menu — hiding removes from both. Routes stay
reachable; hiding is a navigation choice, not access control. **The one exception is `SYSOP`:** it
stays an ordinary hideable entry, and the menu toolbar carries a **permanent settings icon button**
— without it, hiding SYSOP would hide the only door back to the page that un-hides it. **The status
strip keeps the full denominator** (`N / 13 PROGRAMS LOADED`, `DECK_SLOT_COUNT`): a hidden-but-online
program still counts, because hiding a program is not an uninstall.

Config page: `commlink/feature/deck-config-page/` at `/commlink/deck`, linked from `/settings` —
module toggles first, then the flat entry list with `ion-reorder-group`, rows dimmed while their
module is off.

