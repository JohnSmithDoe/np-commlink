# SIGIL — notes

Settled decisions for this domain — do not re-flag as work. Cross-cutting decisions are in
[decisions.md](../decisions.md); blocked work in [state.md](../state.md); the next major's scope in
[next-version.md](../next-version.md).

- **One note type, never two.** "Image note" and "text note" would need a discriminator, a convert action
  and a branch in every renderer, to describe the difference "this one has no body". The distinction it
  draws is in the CREATE affordance, not in the data.
- **`items` is one array and the two sections are a partition of it.** Pinning is therefore a one-field
  change and never a move between collections, and a reorder writes a section's new order back into the
  slots that section already occupied. It REFUSES an order shorter than its section, because that is
  exactly what a drag under an armed search would send.
- **The editor has no save button.** Every keystroke is a candidate write and a write serialises the whole
  slice, images included, so the facade debounces and flushes on destroy. Destroy is also why the note id
  is captured on the way IN: by the time the page is torn down the router has moved on and a route-derived
  note reads as undefined — which is how the discard-a-blank-note path first failed.
- **A picked image is re-encoded to a 1600px JPEG before it is stored.** The budget is about the write,
  not the display: the whole slice is rewritten on each save, so one untouched camera photo would be paid
  for again on every keystroke of the body beneath it.
- **Reorder is pointer-only, and that is a known R5 gap.** `ion-reorder-group` ships no keyboard support
  and nothing else offers "move this note up". Here it is cosmetic — every note stays reachable,
  searchable and openable without a drag — where in `cash-rules` the same gap sits on a *semantic* order.
