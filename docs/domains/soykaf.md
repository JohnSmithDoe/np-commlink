# SOYKAF — the recipe book

Settled decisions and scheduled work for this domain. Cross-cutting decisions are in
[decisions.md](../decisions.md); blocked work in [state.md](../state.md). Everything below the first
entry is **v2.0.0 scope** ([next-version.md](../next-version.md)).

- **The check is presence-only** ("in storage" / "missing"), never "you are 200 ml short" — storage
  counts packages while a recipe asks for a measure. That constraint shapes everything below.
- **Cook → subtract** ingredients from storage, missing ones pushed into `_shopping`. A product decision:
  it makes cooking mutate stock.
- **Base unit on `Product` + pack sizes.** Open **only if presence-only proves too weak**: making
  `StorageItem.quantity` a base-unit amount pools distinct packs into one number and so **destroys
  per-pack `bestBefore`**. Half the schema exists (`unit`, `packaging`, `packagingWeight?`, unread by the
  matcher).
- **Recipe photos** have a place to live: `notes/data/note-image.store.ts` keys each picture on its own
  and keeps the slice text-only. What is left is generalising it past notes — the store, its resolver and
  its collector are note-shaped.
