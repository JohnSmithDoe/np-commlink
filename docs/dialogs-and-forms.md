# Dialogs & forms — a signal host, two bases, Signal Forms

The layers these live in → [architecture.md](./architecture.md) · the `LIST_FACADE` contract the list
dialogs sit behind → [cross-feature-communication.md](./cross-feature-communication.md).

## Dialogs — a signal host, not a store slice

**No dialog state lives in NgRx.** The draft is a component-local `linkedSignal` in the wrapper, and
the _open-command_ (which item, which list, which mode) is one nullable signal on the root
`ItemDialogService` (`@shared/util/item-lists/item-dialog.service.ts` — no `@ngrx` import, which is
why it sits in `util`).

It used to be the eager `itemDialogs` slice, and the store charged rent for transient,
never-persisted state: a duplicated `listId` guard in **every** lazy orchestrator effect (effects are
never torn down, so each saw every sibling's dialog actions), a two-hop action round-trip per open
whose only output was two label strings, and a per-domain selector + facade signal purely to cast
`BaseItem` back to a domain type. Every open path already started in a facade method holding its list
state as a signal, so the seed item is now built synchronously there and the three
`*-item-dialogs.effects.ts` files are gone, guards and all. `open()` **copies** the item, which is
what makes the `linkedSignal` draft reseed when a row is reopened after an aborted edit.

> **Pattern — pick the primitive by lifetime, not by habit.** A global store earns its keep for state
> that is shared, persisted or replayed. `signal` + `computed` was the whole requirement here.

**Two dialog lifetimes → two sibling bases in `@shared/feature/`:**

| | `BaseEditItemDialog` | `BaseModalDialog` |
| --- | --- | --- |
| Opened | declaratively — always mounted, `[isOpen]` off the host | imperatively — `ModalController.create()` |
| Draft | `T` (never absent; "closed" is `isOpen` alone) | `TForm`, a **view-model**, only exists while open |
| Seeded from | the host's open-command | a `componentProps` id → `existing` lookup |
| Used by | the list-item dialogs (household / tasks / tracking) | cash + trackplay (7 subclasses) |

Forcing both through one base would mean `Partial<TForm | undefined>` to save six trivial lines.
`BaseModalDialog` removed the skeleton nine components had each hand-written; its id is a **signal**
behind a domain-named setter (Ionic's `componentProps` does a plain property write), which makes
`existing`/`draft` reactive and means **no dialog implements `OnInit`**. Its `TForm` is deliberately a
view-model, not the entity — these dialogs edit mapped fields (a signed amount as magnitude +
direction), so the subclass supplies `toForm` in and `persist` out.

## Signal Forms

**Every dialog in the app is on them.** For the list dialogs the **base owns the field tree**:
`BaseEditItemDialog` declares `form(this.draft, …)` carrying `requireUniqueName`, and the six wrappers
supply only a `blank()` plus the `siblings` the rule compares against. **An invariant every subclass
must hold is not a subclass's decision** — six wrappers each declaring their own `form()` meant a
seventh that omitted it would have _compiled_, permanently saveable. Two consequences: a generic `T`
defers the mapped path type, so the base narrows `path` once via `T extends BaseItem`; and an
`extraRules` hook would have to be a prototype **method**, since a field wouldn't exist when `form()`
evaluates its schema eagerly. `blank()` delegates to the domain factory (`createRecipe('')`, …) rather
than re-listing defaults — two of the six hand-written copies had already drifted.

**The `siblings` a name rule reads must be the whole aggregate, never a page's view of it.** Four
wrappers fed it `select*ListItems`, which apply the page's search query and category filter — so a
search term left in the box shrank the sibling set and a duplicate saved. Each list now publishes an
aggregate read beside its page view (`selectStorageItems`, `selectProductItems`, `selectTaskItems`, …)
and the vestigial per-list page-view selectors are deleted.

**The facade member is `allItems`, and the name is the guard.** A page injects both its aggregate
facade and the route-keyed engine, so `allItems` (the aggregate) and `items` (the engine's filtered
page view) are in scope in one file — naming the aggregate one `items` too would put the original bug
back within reach of a single autocomplete. Types only half-help: `siblings` is
`Signal<readonly T[]>`, so wiring the engine's `Signal<BaseItem[] | undefined>` fails to compile, but
nothing stops a _page_ reaching for the wrong `items()`. `ShoppingFacade`, `StorageFacade`,
`ProductsFacade`, `TasksListPageFacade` and `TrackingListPageFacade` all spell it `allItems`.

That retired the app's **last reactive-forms usage**. `app-item-name-input` is now a
`FormValueControl<string>` rendering whatever the bound field reports, and the shared modal shell
takes `[nameField]` + a **required** `[canSave]` (optional-with-`false` would turn a forgotten binding
into a permanently dead Save button instead of a compile error). Its message is an
`<ion-note class="sr-field-note">` of its own, **not** `ion-input`'s `errorText`: Ionic renders that
only while the host carries `ion-invalid ion-touched`, and those classes come exclusively from
`@ionic/angular`'s `ValueAccessor`, which needs an `NgControl` on the `ion-input` itself. A custom
control also reports `touched` only through an output literally named **`touchedChange`**.

The `BaseModalDialog` subclasses declare `form(this.draft, <slice>Rules)` — which _projects_ the draft
signal instead of copying it, so the base's reseed still reaches validity — and the base derives
**`canSave = form().valid()`**, so no dialog re-states its schema in a hand-written conjunction.
Controls bind `[formField]` through the CVA every `@ionic/angular` control ships; the app's three
custom widgets (`app-money-input`, `cash-category-picker`, `app-date-input`) are `FormValueControl`s
exposing state as a `value` **model** — that name _is_ what `[formField]` writes through, and an
`input()`/`output()` pair instead makes `FormField.ɵngControlCreate` throw `NG1914`. Money is never a
form string: `app-money-input` is a `FormValueControl<number | null>` over integer **cents** using
`transformedValue({parse, format})`, which sets the model _before_ writing raw text back, so the box is
never reformatted mid-keystroke. One field stays imperative (`patch()`): the rule builder's field
select, which drives two at once.

Three rules are shared in `@shared/util/forms/form-rules.ts`: **`requireText`** (whitespace-aware — the
built-in `required()` counts `'   '` as present while every `persist()` trims), **`requireUniqueName`**
(takes `siblings`/`editing` as **thunks**, because `form()` evaluates a schema eagerly, before the
fields they read exist) and **`requireParseableDate`** (a cleared date box would otherwise persist the
_string_ `'Invalid Date'`, which sorts above every real date and can never be reconciled).

Left on plain `ModalController`: `cash/…/reconcile-modal`, `cash/…/import-preview-modal` and
`trackplay/…/game-settings-popover` — confirm/preview/popover surfaces with no entity to edit.

## The emoji picker

**Desktop-only**, gated on Ionic's `Platform.is('desktop')`: every mobile keyboard already has an
emoji picker, and ours would be a second, worse one. This is *not* the `Capacitor.isNativePlatform()`
gate the camera scanner uses — that asks "can this device do the thing at all"; this one asks "does
the user already have a better way", and the PWA on a phone is not native yet still has the OS
keyboard. Both the trigger **and the `<app-emoji-picker>` element** sit behind the gate rather than
the picker being merely hidden: an always-mounted overlay makes every element-name locator for that
overlay ambiguous app-wide.

That gate is why `playwright.config.ts` grew a **second project**. The suite mirrors the
Capacitor/Android target, so everything runs on an emulated Pixel 5 — where this trigger does not
render at all. `e2e/desktop/**` is the only path `desktop-chromium` matches and the only one
`mobile-chromium` ignores, so the two partition by file rather than the suite running twice. The
mirror image (the trigger being *absent* on a phone) is asserted from the mobile project.

`app-item-name-input` carries a smiley button in `ion-input`'s **`end` slot** — Ionic 8's documented
place for one, though the slots are *simulated* rather than native and flagged experimental. The docs'
own rule is why it is an `ion-button` and not a bare icon: interactive slot content has to be wrapped
in a button to be tabbable, and the icon inside takes `aria-hidden="true"`.

It opens **`app-emoji-picker`** (`@shared/ui/emoji-picker/`), nested *directly inside* the name input
rather than hoisted into the six feature wrappers the way `categories-dialog` had to be. The
difference is what each needs: the category picker needs a domain's catalog and its
add/rename/delete commands, so it must be composed where a facade is reachable; the emoji picker needs
nothing any domain owns, so `type:ui → sameTag` covers it and **all six wrappers are untouched**.
Picking splices the glyph in **at the caret** (`insertAt`), so an emoji can go in front of a name
already typed; the caret comes off the native element via `IonInput.getInputElement()` and is absent
exactly when appending is right. The write goes through the `value` model, never the DOM, which keeps
Signal Forms in the loop so `requireUniqueName` re-runs on the new name.

**`mode` decides what a pick means, and the picker owns it — not the host.** `single` closes on the
first pick; `multiple` keeps the dialog up so a name can be built from several glyphs ("🥛 Milch 🌾"),
and only the header button closes it. A host that closed in its own `picked` handler would silently
contradict `multiple`, so the picker emits `closed` itself. Three consequences, each pinned by e2e:

- **The selection is advanced without focusing.** The modal is still presented and owns focus, so the
  next pick has to find the caret where the last one left it — re-reading a stale position spells
  `🌾🥛`. Focus returns to the field on **`didDismiss`**, not on the close click: an `ion-modal` traps
  focus while presented, so focusing underneath it mid-dismissal races its own restore.
- **The query resets on open, not on pick** (a `linkedSignal` over `isOpen`). Clearing it on a pick
  would pull the result set out from under someone taking a second glyph from it.
- **The tab deliberately survives a close** — it is a browsing preference, not transient state.

**The catalog is generated, not authored.** `scripts/build-emoji-data.mjs` (`pnpm run emoji:build`)
reads Unicode CLDR through the `emojibase-data` devDependency and writes one committed module per UI
language — 1644 emoji in eight groups, flags and skin-tone components dropped. Its predecessor was a
hand-assembled service whose names were *misaligned with their glyphs* from `animals[9]` onward (🐨
labelled "Tiger Face", 🦁 "Cow Face"); names that lie are worse than no names, so the generator looks
each label up **by** its glyph and no shift can be introduced. `tags` carries only the synonyms the
label does not already contain, because the matcher is `matcherFor` — substring — so "hund" finds
"Hundegesicht" unaided.

Both language modules sit behind `import()` in their own chunks (`emoji-data-de` 31.4 kB transfer,
`emoji-data-en` 26.6 kB), fetched when the picker first opens and only for the active language. The
initial bundle grows **2.18 kB**, measured against a baseline build, and that is the eager `settings`
touchpoints rather than the names. A packed one-string-per-group encoding was tried and dropped: it
saved ~11% gzip (32.1 vs 35.9 kB) and cost a decode step, a `\t`/`|` separator convention and an
assertion that no CLDR string could ever contain them.

**Recents live on the app-global `settings` slice**, not a service's own storage key — a cross-cutting
preference with no owning domain, exactly like the theme and the language, and `settingsReducer`
already merges a stored doc over `initialSettings` so `recentEmojis?: string[]` needs no migration
hop. Both directions are patterns the app already runs, because the picker is `@shared/ui` and may
reach neither `type:data` nor `domain:settings`: the **write** is a third write-only contract in
`@shared/data/emoji/` (`EmojiActions.used`, dispatched through a facade so `@shared/feature` never
injects `Store`) — the same inversion as `NotificationsActions`; the **read** is
`SettingsEffects.publishRecentEmojis$` mirroring the selector onto `EmojiRecentsService`, the same
arrangement as `ThemeService.theme`. The write originates in `BaseEditItemDialog.confirm()` from the
**saved name** rather than from the tap, which spares every wrapper a pass-through output and is the
better rule anyway: an emoji picked and then deleted was never used.
