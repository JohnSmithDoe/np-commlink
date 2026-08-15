/* ─── why ─────────────────────────────────────────────────────────
 * The completion is dispatched once the card has finished leaving, not
 * when the button is pressed — closing the day first would swap the screen
 * out from under the animation. `animationend` advances the flow, which is
 * why `ritual-offer--leaving` is shortened under reduced motion rather than
 * removed, and a timer backs it up because a hidden or backgrounded page
 * runs no animation at all. The two race deliberately and `cardGone` is
 * idempotent. The fallback only has to OUTLAST the stylesheet's duration,
 * not match it — an inequality, hence not derived from it.
 *
 * The card itself is inert. As a button its accessible name would be the
 * task text, so it would announce "Trink ein Glas Wasser, button" and never
 * say what pressing does — and the largest target on screen would close the
 * day. The undo toast is what replaces the confirm that used to guard it.
 * ───────────────────────────────────────────────────────────────── */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, settingsOutline } from 'ionicons/icons';
import { ConfettiComponent } from '../../../@shared/ui/confetti/confetti.component';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { RitualPageFacade } from '../../data';

const LEAVE_FALLBACK_MS = 800;

@Component({
  selector: 'app-page-ritual',
  templateUrl: './ritual.page.html',
  styleUrl: './ritual.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ConfettiComponent,
    PageHeaderComponent,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    RouterLink,
    TranslatePipe,
  ],
})
export class RitualPage {
  readonly #facade = inject(RitualPageFacade);

  readonly prompt = this.#facade.prompt;
  readonly count = this.#facade.count;
  readonly recentDays = this.#facade.recentDays;
  readonly todaysPrompt = this.#facade.todaysPrompt;

  protected readonly leaving = signal(false);
  readonly #bonus = signal(false);

  readonly showCard = computed(
    () => !this.#facade.dayClosed() || this.#bonus()
  );
  readonly recentDayCount = computed(
    () => this.recentDays().filter(Boolean).length
  );

  constructor() {
    addIcons({ checkmarkCircleOutline, settingsOutline });
  }

  complete(): void {
    if (this.leaving()) return;
    this.leaving.set(true);
    setTimeout(() => this.cardGone(), LEAVE_FALLBACK_MS);
  }

  cardGone(): void {
    if (!this.leaving()) return;
    const promptId = this.prompt().id;
    this.leaving.set(false);
    this.#bonus.set(false);
    this.#facade.complete(promptId);
  }

  reroll(): void {
    this.#facade.draw();
  }

  dismiss(): void {
    this.#facade.dismiss(this.prompt().id);
  }

  takeBonus(): void {
    this.#facade.draw();
    this.#bonus.set(true);
  }
}
