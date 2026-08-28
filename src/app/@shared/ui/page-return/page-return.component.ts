/* ─── why ─────────────────────────────────────────────────────────
 * `isProgram` outranks the page's own `route`, and that order is the whole
 * guard. A page names a parent it can see from where it is written; whether
 * it is still a child is a fact about `DECK_CATALOG`, which the deck edits
 * without touching a single page. So promoting a deep page to a program
 * withdraws its return row on the next boot, rather than leaving it pointing
 * at the sibling it used to hang under — the failure the static `backHref`
 * shipped with ([decisions.md](../../../../../docs/decisions.md)).
 *
 * The route comes from the page's OWN `ActivatedRoute` and is read once:
 * asking where the app is now makes a leaving page answer for its successor,
 * which is a live link on a page the user is watching slide away.
 * ───────────────────────────────────────────────────────────────── */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { chevronBackOutline } from 'ionicons/icons';
import { PROGRAM_RETURN } from '../../util/program-return.token';

const urlOf = (route: ActivatedRoute): string =>
  `/${route.snapshot.pathFromRoot
    .flatMap(({ url }) => url)
    .map(({ path }) => path)
    .join('/')}`;

@Component({
  selector: 'app-page-return',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-return.component.html',
  styleUrl: './page-return.component.scss',
  imports: [IonIcon, RouterLink, TranslatePipe],
})
export class PageReturnComponent {
  readonly #program = inject(PROGRAM_RETURN)(urlOf(inject(ActivatedRoute)));

  readonly route = input<string>();
  readonly label = input<string>();

  readonly #named = computed(() => {
    const route = this.route();
    const titleKey = this.label();
    return route && titleKey ? { route, titleKey } : undefined;
  });

  readonly target = computed(() =>
    this.#program.isProgram
      ? undefined
      : (this.#named() ?? this.#program.parent)
  );

  constructor() {
    addIcons({ chevronBackOutline });
  }
}
