# The deck — what ships on, and what is reachable

Settled decisions for this domain — do not re-flag as work. Cross-cutting decisions are in
[decisions.md](../decisions.md); blocked work in [state.md](../state.md); the next major's scope in
[next-version.md](../next-version.md).

- **A cold install ships an empty deck** — no entry listed, one `@empty` node pointing at
  `/commlink/deck`. The curated four it replaced were not wrong, they were unmaintainable in a specific
  way: every new feature re-opened "does this one belong in the default?", a question with no checkable
  answer, paid for by whoever adds the next module. Empty is a rule instead of a list. **No entry is ever
  added back as a special case.**
- **The deck stores what is VISIBLE, and absence means HIDDEN.** Held the other way round, "a cold
  install ships an empty deck" was a RULE in the prose and a LIST in the code — the whole catalog
  restated — so the one invariant the deck has was maintained by copying. Three things fall out of the
  polarity and none needed arguing separately: an entry nobody has seen arrives OFF, renaming an id can
  no longer switch a program on for everyone, and `initialDeck` is `[]`.
- **Legal only because nothing is stranded — re-check before any entry claims to be reachable "from the
  deck".** Two unconditional entrances: the drawer's static `/settings` button and the grid's `@empty`
  link. An `onDeck: false` entry is why they are needed.
- **Past 992px the drawer stays open as a pane, and Ionic's own default is the breakpoint.** The catalog
  behind the drawer already served both surfaces, so nothing about the navigation model changed — only
  whether the surface is modal. `when` is deliberately unwritten: `lg` IS Ionic's default, and a copied
  default is a value that can silently diverge from the framework's. Two facts make it cheap where
  [state.md](../state.md) predicted reach. The page header needed no edit at all — an `ion-menu-button`
  hides itself once its menu sits in a visible pane — and `[autoHide]="false"` on the three
  `ion-menu-toggle`s is Ionic's **documented** override for the same rule, which otherwise blanks every
  row the pane exists to show. Without it the open pane is a wordmark over an empty column, measured
  rather than reasoned. What it costs is two desktop assertions restated, both premise rather than
  product: the menu-button claim is made at 980 because above the breakpoint there is no button, and
  gutters are measured against `#main-content` because the content no longer starts at x=0. The width is
  **300px measured, and `--side-max-width` is the property that sets it** — Ionic's default for it is
  `28%`, which is what made the pane 392px at 1400, so `--side-width` is not the knob it reads like and
  setting it changes nothing. A 300px pane puts the content area under `$content-wide` at every common
  desktop width, so a list runs full-bleed there exactly as it does on a phone.
- **The catalog's glyph reaches the page header through a token, and the header keeps `icon` as an
  override.** `@shared/ui` may import no domain, so the header cannot read `DECK_CATALOG` however the data
  is shaped — that edge, not the app shell's, is what forces the inversion. `PROGRAM_ICON` is the port
  (`@shared/util`, empty-defaulted); `commlink/data` fulfils it as the longest catalog route prefixing
  `selectUrl`. A route→glyph map in `@shared` would settle the lookup but not the URL, which only `data/`
  may read, and it would make `@shared` name every domain's routes. Registration needs nothing: `DeckIcon`
  is `keyof typeof DECK_ICONS` and the root component registers that map, so a catalog entry cannot name a
  glyph nobody registered — and deleting the registration turns `verify:icons` red rather than blanking
  eighteen headers quietly. The consequence accepted with it: a page inside a program now wears the
  program's glyph, so adding a route to the catalog changes a header with no edit to that page.
  **The override survives in exactly one shape — a component rendered under a route the catalog does not
  cover.** The I Ching pages are the case: `/vitals/iching` and `/vitals/iching/cast` are entries, their
  `/vitals/profile/:id/…` twins are not and do not prefix-match either, so dropping `icon` would give one
  component two glyphs depending on how it was reached. **Picking a different glyph cannot fix that** —
  the disagreement is between two ROUTES, so a new icon only changes which two disagree; the sole
  agreeing choice is BIOMON's own `pulse-outline`, which puts two identical tiles on a grid meant to be
  scanned by glyph. Where a component has one route and that route is an entry, the input is a second
  copy of the catalog's answer and goes.
- **The module axis is a bulk ACTION, never a second gate.** It was rejected outright while every module
  held one program: a stored module flag gated what a program toggle already gated, and a hidden module
  had to disable its children to stay coherent. Sub-page programs changed the premise, not the argument
  — the group header switches its children and reads its state back from them, so `visibleEntries` is
  still the only stored answer and there is nothing to keep coherent. A module of one renders no group
  at all; it stays the plain row it was.
- **Grouping and ordering are two questions, so the config page has two lenses, not one list.**
  `ion-reorder-group` needs a flat list and `DeckState.order` is global, and every fusion costs
  something real: nesting the drag forces a module's programs to stay contiguous on the deck, splitting
  the page by on/off scatters a module across two sections. An `ion-segment` picks between them —
  **programs** (grouped, the default) and **order**. The lens is component state, never persisted: a
  lens is not a preference.
- **The order lens lists only what is ON.** A hidden entry's position is unobservable, so offering to
  drag one was a control that changed nothing — and the same reasoning says it needs no toggle here,
  because switching off belongs where you can see what you are switching off. `ion-split-pane` is what
  makes the drag worth keeping at all: the drawer beside it renders the same list in the same order, so
  a drag is watched live rather than confirmed by navigating away.
- **This is the one list on the page that can be empty**, which is why it carries `app-empty-state`
  where the catalog beside it never can.
