/* ─── why ─────────────────────────────────────────────────────────
 * The one shape for "there is nothing here" that is NOT a list row. The
 * actionable row in `app-item-list-empty` is the DEFAULT and stays what it
 * is — inside a list whose job is to be added to, the invitation belongs on
 * a row that looks like the rows it is standing in for. A list page that
 * NAMES its own empty state has said the generic invitation cannot explain
 * what the list is for, and gets this instead.
 *
 * Prose only, deliberately: an optional glyph made every call site decide
 * again, three of fifteen said yes, and the icon-weight rule has no position
 * for one — `check-icons.mjs` reads a subject as `[leadingIcon]` alone.
 * ───────────────────────────────────────────────────────────────── */
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly label = input.required<string>();
  readonly note = input<string>();
}
