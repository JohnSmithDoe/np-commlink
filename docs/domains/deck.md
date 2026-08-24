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
- **One switch per program, and no module axis at all.** A module toggle gated the same visibility a
  program toggle already gated, so two controls answered one question and a hidden module had to disable
  its children's toggles to stay coherent. The module survives as a **label on the program row**, and
  only where it names a group — on a module of one it repeats the row's own title.
