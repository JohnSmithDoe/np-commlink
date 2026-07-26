# Dashboard customization — a configurable deck

The `/commlink` deck and the side menu stop being two hardcoded lists and become
two renderings of one user-configurable catalog: the user chooses **which**
programs appear and **in what order**, and the choice survives a restart.

Design settled in a drill session (2026-07-26); this doc is the rationale, not a
changelog. What was built is in the git log.

## Ownership — `commlink` is the navigation context

The catalog lives in `commlink`, not in each domain and not in `@shared`.

A domain owns the routes it **serves**; it has no opinion about whether it
appears in navigation, under what codename, at which grid position. `groceries`
knows nothing about being sixth on a grid with a cart icon called MARKET — that
is deck vocabulary. Putting an entry manifest in each `<domain>/routes/` would
therefore file presentation knowledge under the wrong context, and it would
force the shell to import all eleven domains eagerly, undoing the
`loadChildren`-only seal that keeps their data layers out of the initial chunk.

Three things make `commlink` the right home:

1. **It already speaks the language.** `CommlinkProgram`, hex, codename,
   `online`/`standby`/`offline` were always there.
2. **The catalog is the static twin of a read-model commlink already owns.** The
   dashboard read-model is *what each program reports*; the catalog is *which
   programs exist, in what order*. Same reader, same owner.
3. **It costs no new coupling.** `app.component.ts` imports exactly one domain
   (`DashboardFacade` from `./commlink/data`). `DeckFacade` sits beside it.

## Catalog — static, label-free

`commlink/model/deck.types.ts`. Fifteen entries: the thirteen deck programs plus
the two menu-only rows (`/commlink` home, `/groceries/list-settings`).

```ts
type IDeckEntry = {
  id: TDeckEntryId;      // stable — persisted config references it
  module: TAppModule;    // coarse: 'groceries'. NOT the per-aggregate telemetry `source`
  icon: string;
  route: string;
  titleKey: TMarker;     // menu row — the same `page-title.*` key the route's title uses
  onDeck: boolean;       // false for menu-only entries
  source?: string;       // telemetry badge, unchanged
  metric?: string;
  status?: TProgramStatus;
  needsLanguageModel?: boolean;
};
```

`module` is a **foreign key, not a tree**. A nested catalog would have bought
nothing that `groupBy(module)` in the config UI does not; normalized wins the
same way it wins in every NgRx slice.

Note the two granularities: telemetry `source` is per *aggregate*
(`shopping`, `storage`, `products`), `module` is per *domain* (`groceries`).
Deliberate, and the reason there must never be a second spelling of
`'groceries'` anywhere in the catalog.

## Persisted state — three id lists, absence means default

`npc-deck`, an eager slice merged into `commlinkContext`.

```ts
interface IDeckState {
  order: TDeckEntryId[];
  hiddenEntries: TDeckEntryId[];
  hiddenModules: TAppModule[];
}
```

**Order is a list, never an `order: number` on the entry.** A number is a
denormalized sequence: it needs renumbering on every drop, tolerates gaps, and
lets two entries claim `3`. A list *is* the order, and `ion-reorder-group` hands
over `from`/`to`, which is one array move.

**Nothing here copies the catalog.** Only ids are persisted, and absence carries
the default:

- a new program is missing from `order` → appended at the end, in catalog order;
- a new program is missing from `hiddenEntries` → visible;
- a removed program's stale id → ignored at read time.

So growing or shrinking the catalog needs **no migration hop at all**. The one
change that would is *renaming* an id — which is why ids are never renamed.

**The module flag cascades at read time and is never written into children:**

```
visible(entry) = !hiddenModules.has(entry.module) && !hiddenEntries.has(entry.id)
```

Writing `false` into the children on a module toggle would flatten whatever the
user had configured underneath, and re-enabling the module could not restore it.

## Labels — theme is an axis of the i18n key

Codenames change with the theme (MARKET under cyberpunk, plain wording under OK
Boomer), so the catalog carries **no label**. The deck renders

```
deck.<theme>.<id>.name      deck.cyberpunk.shopping.name = "MARKET"
deck.<theme>.<id>.desc      deck.cyberpunk.shopping.desc = "shopping list"
```

A third theme is then a new JSON block, not a code change. Two label fields on
the catalog would have gone stale against each other the first time one was
renamed.

The **menu keeps `titleKey`** (`page-title.*`) rather than a theme-scoped title:
a menu row and its page's title are the same string and should stay in sync.
Only what genuinely varies by theme lives under `deck.*`. Making the cyberpunk
menu read codenames too is a one-line template change plus no new keys — the
data is already there.

**Every theme must ship every label.** `translate` renders the raw key on a
miss, so an incomplete theme would put `deck.matrix.shopping.name` on screen. A
spec walks the catalog × `TTheme` and fails the build instead.

### Reading the theme without importing `settings`

`commlink → settings` is a Sheriff violation, so the theme is read from
`@shared/util/theme.service`, which gains a readable `theme` signal beside the
`apply()` that already writes `<html data-theme>`. Settings **drives** the
theme; anyone may **read** it — the same arrangement as `LanguageModelService`:
one capability signal in `@shared/util`, two unrelated readers.

That also rules out a `| deckLabel` pipe. A *pure* pipe caches on input identity,
so it would not re-run when only the theme signal changed; an *impure* one is the
pre-signals idiom. The label key is projected in `DeckFacade` as a `computed`
over the theme signal instead, which both surfaces read.

`hex` stays a pipe (`commlink/util/hex.pipe.ts`) — its input is the index, which
does change on reorder, so purity is correct there. It is display only now: the
top tile always reads `0x01`.

## Surfaces

One `order`/`visible` pair drives the deck grid **and** the side menu — hiding a
program removes it from both. Routes stay reachable; hiding is a navigation
choice, not an access control.

**The one exception is `SYSOP`.** It stays an ordinary, hideable entry, and the
menu grows a **permanent settings icon button** in its toolbar. Without it,
hiding SYSOP would hide the only door back to the page that un-hides it.

**The status strip keeps the full denominator.** `N / 13 PROGRAMS LOADED` counts
what the grid *has*, not what this user shows, so a hidden-but-online program
still counts — `8 / 13` above nine tiles is correct.

## Config page — `/commlink/deck`

`commlink/feature/deck-config-page/`, linked from `/settings`.

It cannot live in `settings/feature`: `settings → commlink` is a domain
violation. Nor can `settings.routes.ts` `loadComponent` it, for the same reason.
Mounting it at `/settings/deck` from the root table would reintroduce the
cross-domain path ordering `app.routes.ts` was cleaned of, so the page lives
under its owner's prefix and `/settings` links to it.

Layout: module toggles first, then the flat entry list — `ion-reorder-group` for
order, a toggle per row, rows dimmed while their module is off.

## Open

- Whether reordering is also reachable from the deck itself (long-press to
  rearrange in place), or stays config-page-only.
