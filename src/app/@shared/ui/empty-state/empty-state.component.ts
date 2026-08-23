/* ─── why ─────────────────────────────────────────────────────────
 * The one shape for "there is nothing here" that is NOT a list row. The
 * actionable row in `app-item-list-empty` stays what it is — inside a list
 * whose job is to be added to, the invitation belongs on a row that looks
 * like the rows it is standing in for. Everywhere else an empty state is
 * prose, and this is it. The icon NAME is the caller's to register, exactly
 * as `app-list-item`'s leading icon is.
 * ───────────────────────────────────────────────────────────────── */
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon],
})
export class EmptyStateComponent {
  readonly label = input.required<string>();
  readonly note = input<string>();
  readonly icon = input<string>();
}
