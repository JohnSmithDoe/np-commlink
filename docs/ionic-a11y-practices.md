# Ionic accessibility practices

What Ionic's own docs require of *us*, and what Ionic already does *for* us — so we neither skip a
rule nor re-implement a behaviour the framework ships. Every rule below is either quoted from the
Ionic API docs or verified against the installed source (`@ionic/angular 8.8.x` / `ionicons 7.2.x`);
where the two disagree, the source wins and the discrepancy is called out.

**Seven of the eight rules below are enforced**, by this project's own eslint rule set in
`eslint-rules/` — one rule per R-number, wired up in `eslint.config.js` (`docs/project-summary.md`
§10). They have to be ours: `angular-eslint`'s `templateAccessibility` set keys off *native* elements
and every control here is a custom element Ionic defines at runtime, so enabling that set alone
reported a clean pass over three genuinely unlabelled toolbar buttons. **R5 is the exception and
always will be** — see it for why.

A rule's message names its R-number, so a lint failure lands you in the right section here.

## Why "it looks labelled" is not a measurement

Ionic controls are web components. Three consequences drive every rule below:

- **A label you can see is not a label the control has.** An `ion-label` sitting next to an
  `ion-toggle` inside an `ion-item` is a sibling, not an association — `ion-item` wires no
  `aria-labelledby`. The control's name comes from its own `label` property, its own slotted text, or
  its own `aria-label`, and from nothing else.
- **A host attribute reaches the shadow root only if the component forwards it.** Each component
  declares its own inherit list (`inheritAriaAttributes` / `inheritAttributes(el, [...])`). An
  attribute outside that list is inert, silently.
- **The shadow DOM is not in our templates.** Grepping `src/**/*.html` cannot see what a component
  puts in its own shadow root — which is how a whole-app audit once "found" a missing live region
  that Ionic had been rendering all along (§12). Read the component source, or read the a11y tree.

---

## R1 — Every `ion-icon` is either hidden or named

> "Icons that serve a purely decorative purpose should be marked with `aria-hidden="true"`… if an
> icon is interactive, it must provide context through an `aria-label`. When an icon is nested within
> an interactive element like a button, the parent element should typically hold the `aria-label`
> while the icon itself remains hidden to prevent redundant announcements."
> — [ion-icon § Accessibility](https://ionicframework.com/docs/api/icon#accessibility)

```html
<!-- decorative -->
<ion-icon name="heart" aria-hidden="true" />
<!-- the whole affordance is the icon -->
<ion-button aria-label="Favorite"><ion-icon name="heart" aria-hidden="true" /></ion-button>
```

**Why a bare icon is a defect and not merely a missed opportunity.** `ion-icon` renders
`role="img"` on its host unconditionally and derives *no* name from `name`
(`ionicons/dist/collection/components/icon/icon.js` — `h(Host, { role: "img", … })`, and the only
inherited attribute is `aria-label`). So an icon with neither attribute is an image role with no
accessible name: axe-core's `role-img-alt` flags it, and what a reader announces is
implementation-defined. `aria-hidden="true"` is therefore the default, not an optimisation —
**there is no third state.**

## R2 — An icon-only button carries the name; a FAB always does

The name goes on the interactive parent (R1), which for `ion-button` means `aria-label` /
`aria-labelledby` or text of its own. Gated by `ionic-a11y/icon-only-control-has-name` — which checks
all three of the elements below, where the selector it replaced checked only `ion-button`.

`ion-fab-button` needs the same:

> "Because FABs often contain only icons, it is critical for developers to provide an `aria-label` on
> every `ion-fab-button` instance."
> — [ion-fab § Accessibility](https://ionicframework.com/docs/api/fab#accessibility)

The same applies to every other icon-only affordance Ionic does *not* name for us — most notably
`ion-item-option`, which renders a bare `<button>` (`item-option.js`) with no default name at all.

## R3 — Every form control has a name of its own

> "If no visible label is needed, developers should still supply an `aria-label` so the [control] is
> accessible to screen readers."
> — [ion-input § Labels](https://ionicframework.com/docs/api/input#labels),
> [ion-select § Labels](https://ionicframework.com/docs/api/select#labels)

Three sanctioned sources, in order of preference: the **`label` property**, the **`label` slot** (when
the label needs markup), or **`aria-label`** (when no visible label is wanted). `labelPlacement`
controls only where a visible label sits — it is not itself a label.

Verified per component, because the fallbacks differ:

| Control | Named by | Nameless when |
|---|---|---|
| `ion-input`, `ion-textarea` | `label`, slotted label (→ `aria-labelledby`), inherited `aria-label` | none of the three; `placeholder` alone is a last-resort accname fallback, not a label |
| `ion-select` | same three | same |
| `ion-checkbox`, `ion-toggle` | slotted text (→ `aria-labelledby`) or inherited `aria-label` | self-closing with no `aria-label` — the host is `role="checkbox"` / `role="switch"` with **no name** |
| `ion-range` | `label` / `aria-label` | neither |
| `ion-searchbar` | **nothing we control** — see R7 | always: the inner input is hardcoded `aria-label="search text"` |
| `ion-datetime` | composite; its inner columns and nav buttons name themselves | n/a (but see R7 — those names are English) |

## R4 — Overlays: label the ones Ionic can't label itself

Ionic assigns the roles; the *name* is ours whenever there is no header/message to derive one from.

| Overlay | Role Ionic sets | Name Ionic derives | We must supply |
|---|---|---|---|
| `ion-modal` | `role="dialog"` + `aria-modal="true"` on the shadow wrapper | **none** | `aria-label` (see below) |
| `ion-alert` | `alertdialog` with inputs/buttons, else `alert` | `aria-labelledby`/`-describedby` from `header`/`subHeader`/`message` | nothing, if a header is set |
| `ion-action-sheet` | | `aria-labelledby` from `header` | `header`, or `htmlAttributes['aria-label']` |
| `ion-loading` | `dialog` | `aria-labelledby` from `message` | `htmlAttributes['aria-label']` when there is no message |
| `ion-popover` | — | — | a name only if the popover is a dialog rather than a menu of `ion-item`s |
| `ion-toast` | `role="status"` + `aria-live="polite"` + `aria-atomic` on `.toast-content` | announces `header` + `message` | nothing — but see R6 |

**`ion-modal` takes `aria-label`, not `aria-labelledby`.** The docs suggest pointing
`aria-labelledby` at the modal's `ion-title`; in the installed version that cannot work.
`modal.js` sets `attributesToInherit = ['aria-label', 'role']` and puts `role="dialog"` on a wrapper
inside a **shadow** root — so an `aria-labelledby` on the host is neither forwarded nor able to
resolve an IDREF across the shadow boundary. Use `aria-label` (declarative) or
`htmlAttributes: { 'aria-label': … }` (via `ModalController`), and keep it in sync with the visible
`ion-title` — one translated key read by both.

For controller-presented overlays, `htmlAttributes` is the seam for *any* ARIA attribute:

```ts
const sheet = await this.#actionSheetCtrl.create({
  htmlAttributes: { 'aria-label': this.#translate.instant(marker('x.a11y.sheet')) },
});
```

## R5 — A gesture is never the only way

**The one rule with no lint rule, and it cannot have one.** Deciding it means knowing whether a
keyboard path to the *same* action exists somewhere in the app — an `ion-item-sliding` is perfectly
fine when a kebab popover elsewhere in the template dispatches what the swipe dispatches. That is not a
property of the template being linted, so a rule could only flag every swipe and be disabled everywhere.
It stays a review matter.

Neither `ion-item-sliding` nor `ion-reorder-group` ships keyboard support: the sliding options are
reachable only by a horizontal drag (and the `ion-reorder` handle is not focusable), so an action
that lives *only* behind a swipe or a drag is unreachable without a pointer — WCAG 2.1.1. Ionic's own
docs document these as gestures and offer no keyboard alternative, which makes the alternative ours
to build.

**The pattern already in this app** is `tracking-item`: a kebab `ion-button` opening an `ion-popover`
of `ion-item`s that dispatch the same actions the swipe does. `ion-popover` is fully keyboard-driven
by Ionic (Tab/Shift+Tab, Esc, Space/Enter, and arrow/Home/End over `ion-item`s), so the alternative
costs one button and no key handling of our own.

Reordering has no such fallback in the app; where order is a persisted user preference, the honest
options are an explicit move-up/move-down pair or accepting the gap as a recorded decision.

## R6 — A toast is for messages, an alert is for choices

> "The `ion-toast` component has `role='status'` and `aria-live='polite'`… This causes screen readers
> to only announce the toast message and header, **meaning buttons and icons will not be announced**.
> Since toasts are intended to be subtle notifications, `aria-live` should never be set to
> `'assertive'`; if developers need to interrupt the user with an important message, we recommend
> using an alert instead."
> — [ion-toast § Accessibility](https://ionicframework.com/docs/api/toast#accessibility)

So a toast that *carries the only path to an action* loses that path for screen-reader users. Read as
a rule: a toast whose buttons are dismiss-only is fine; a toast whose button is the affordance
(undo, reload, retry) either duplicates that affordance somewhere persistent or becomes an alert.

## R7 — Ionic's built-in strings are English, and mostly ours to override

For a bilingual app this is a real gap rather than a curiosity: Ionic hardcodes accessible names in
English, and only some of them can be overridden.

| Element | Hardcoded name | Overridable? |
|---|---|---|
| `ion-menu-button` | `"menu"` | **yes** — `aria-label` is inherited |
| `ion-back-button` | `"back"` (or `text`) | **yes** — `aria-label` is inherited |
| `ion-modal` drag handle | `"Activate to adjust the size of the dialog…"` | no |
| `ion-searchbar` inner input | `"search text"`; clear `"reset"` | **no** — searchbar inherits only `lang`/`dir` |
| `ion-input`/`ion-textarea` clear button | `"reset"` | no |
| `ion-datetime` nav + columns | `"Previous month"`, `"Select a year"`, … | no |

The overridable rows are worth doing; the rest are upstream and belong in a recorded decision, not in
a workaround.

## R8 — `aria-label` needs a role that permits a name

`aria-label` on a `<div>`/`<span>` with no role is **prohibited** by ARIA (the implicit `generic` role
does not support naming) and is flagged by axe-core's `aria-prohibited-attr` — the label is simply not
exposed. A styled non-semantic element that needs an accessible name needs a role too (`role="img"`
for a glyph or count, `role="status"` for a live value), or the name should be real text in a
visually-hidden span.

This is the one rule below that is not Ionic-specific; it is here because a themed HUD is exactly the
place where labels get attached to `<span>`s.

## What Ionic already handles — do not re-implement

- **Focus trapping in modals.** "When a modal is presented, focus will be trapped inside of the
  presented modal… For applications that present multiple stacked modals, focus will be trapped on
  the modal that was presented last." Only sheet modals whose backdrop is disabled via
  `backdropBreakpoint` are exempt.
- **Popover keyboard interaction** — Tab/Shift+Tab between focusables, Esc to close, Space/Enter to
  activate, and full arrow/Home/End support over `ion-item` children for dropdown-style popovers.
- **Toast live region** — `role="status"` + `aria-live="polite"` + `aria-atomic="true"` on
  `.toast-content`, plus an internal reveal flip on present so the message is announced as a change.
  A hand-rolled `aria-live` wrapper around a toast is redundant.
- **Alert / action-sheet / loading labelling**, whenever `header` (or `message`, for loading) is set.

## Review checklist

The `ionic-a11y/*` rule that enforces each one, from `eslint-rules/`. A rule reports what it can
*decide*: where a fact is unknowable from the source — options built by a helper, a spread — it passes
rather than guesses, because a gate that reports what it cannot know teaches people to disable it.

| # | Rule | Enforced by |
|---|---|---|
| R1 | every `ion-icon` has `aria-hidden="true"` or an `aria-label` | `icon-is-hidden-or-named` |
| R2 | icon-only `ion-button` / `ion-fab-button` / `ion-item-option` has an accessible name | `icon-only-control-has-name` |
| R3 | every `ion-input`/`ion-select`/`ion-textarea`/`ion-checkbox`/`ion-toggle`/`ion-range` has `label`, slotted text, or `aria-label` | `form-control-has-label` |
| R4 | every `ion-modal` has `aria-label`; every action sheet / loading has a header or `htmlAttributes` name | `overlay-has-name` (templates) + `overlay-options-have-name` (`*Ctrl.create({…})`) |
| R5 | no action reachable only by swipe or drag | **nothing — not decidable, see R5** |
| R6 | no toast button is the only path to its action | `no-actionable-toast-button` (flags a button with a `handler`) |
| R7 | `ion-menu-button` / `ion-back-button` names are translated | `builtin-name-is-translated` |
| R8 | no `aria-label` on a roleless `<div>`/`<span>` | `aria-label-needs-role` |

Sources: Ionic API docs for
[icon](https://ionicframework.com/docs/api/icon#accessibility),
[fab](https://ionicframework.com/docs/api/fab#accessibility),
[input](https://ionicframework.com/docs/api/input#labels),
[select](https://ionicframework.com/docs/api/select#labels),
[modal](https://ionicframework.com/docs/api/modal#accessibility),
[alert](https://ionicframework.com/docs/api/alert#accessibility),
[action-sheet](https://ionicframework.com/docs/api/action-sheet#accessibility),
[loading](https://ionicframework.com/docs/api/loading#accessibility),
[popover](https://ionicframework.com/docs/api/popover#accessibility) and
[toast](https://ionicframework.com/docs/api/toast#accessibility), retrieved 2026-07-29 via context7;
component behaviour verified against `node_modules/@ionic/core/dist/collection/components/*` and
`node_modules/ionicons/dist/collection/components/icon/icon.js`.
