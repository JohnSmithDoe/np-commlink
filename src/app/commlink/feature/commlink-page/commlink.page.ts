import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonRouterLinkWithHref,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  barcodeOutline,
  businessOutline,
  cartOutline,
  checkboxOutline,
  diceOutline,
  fileTrayStackedOutline,
  hardwareChipOutline,
  notificationsOutline,
  pricetagsOutline,
  restaurantOutline,
  settingsOutline,
  sparklesOutline,
  timerOutline,
  walletOutline,
} from 'ionicons/icons';
import dayjs from 'dayjs';
import { interval, map, startWith } from 'rxjs';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import {
  LanguageModelService,
  TLanguageModelAvailability,
} from '../../../@shared/util/language-model.service';
import { ThemeService } from '../../../@shared/util/theme.service';
import { DashboardFacade, DeckFacade } from '../../data';
import { IDeckEntry, TProgramStatus } from '../../model/deck.types';
import { currencyLabel } from '../../util/currency-label.utils';
import { HexPipe } from '../../util/hex.pipe';

/**
 * How the on-device model's availability reads as a tile status: ready to answer
 * is the only `online`, a pending weights download is `standby` (wired but not
 * loaded — SOYKAF's semantics), and a runtime that will never have the model at
 * all — our Android APK — is honestly dark.
 */
const LANGUAGE_MODEL_STATUS: Record<
  TLanguageModelAvailability,
  TProgramStatus
> = {
  available: 'online',
  downloadable: 'standby',
  downloading: 'standby',
  probing: 'standby',
  unavailable: 'offline',
};

@Component({
  selector: 'app-page-commlink',
  templateUrl: './commlink.page.html',
  styleUrls: ['./commlink.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonContent,
    IonIcon,
    IonRouterLinkWithHref,
    RouterLink,
    TranslateModule,
    PageHeaderComponent,
    HexPipe,
  ],
})
export class CommlinkPage {
  readonly #dashboard = inject(DashboardFacade);
  readonly #deck = inject(DeckFacade);
  readonly #languageModel = inject(LanguageModelService);
  readonly #theme = inject(ThemeService).theme;

  /** The tiles this user shows, in their order. */
  readonly programs = this.#deck.programs;

  // The status strip reports the grid, not this user's view of it: hiding a
  // program is a navigation choice, not an uninstall. So both halves of the
  // readout count every slot the deck has, hidden ones included.
  readonly total = this.#deck.slotCount;
  readonly onlineCount = computed(
    () =>
      this.#deck.allPrograms().filter((p) => this.status(p) === 'online').length
  );

  /**
   * Where a tile's status comes from, in precedence order:
   *
   * - a capability-gated program reports the *capability*, so the deck never
   *   advertises a program that cannot run on this platform;
   * - a telemetry-backed program reports what the read-model holds for its
   *   source — `standby` until that source has reported, which on a cold launch
   *   is the honest answer;
   * - the tiles with no data domain report their declared status.
   */
  status(program: IDeckEntry): TProgramStatus {
    if (program.needsLanguageModel)
      return LANGUAGE_MODEL_STATUS[this.#languageModel.availability()];
    if (program.source)
      return this.#telemetry().bySource[program.source]?.status ?? 'standby';
    return program.status ?? 'online';
  }

  // Read ONLY the shared dashboard read-model (CQRS): each supplier pushes its
  // telemetry via DashboardActions.report; commlink imports no other domain.
  readonly #telemetry = this.#dashboard.dashboardState;

  /**
   * Live badge value for a program's configured metric from the read-model, or
   * null when the tile has no telemetry source. Reads the `#telemetry` signal,
   * so tiles re-render when any source reports (zoneless-safe).
   */
  badge(program: IDeckEntry): number | null {
    if (!program.source || !program.metric) return null;
    const value =
      this.#telemetry().bySource[program.source]?.metrics[program.metric];
    return value == undefined ? null : Number(value);
  }

  /** A tile's badge value as it should render — themed for a currency tile. */
  badgeLabel(program: IDeckEntry, value: number): string {
    return program.currency
      ? currencyLabel(this.#theme(), value)
      : String(value);
  }

  /** Unread signals → drives the NOISE status-strip readout. */
  readonly noise = this.#dashboard.notificationsUnread;
  readonly #office = this.#dashboard.telemetry('office-time');
  readonly #cash = this.#dashboard.telemetry('cash');
  /** The ledger balance, themed like the CREDSTICK tile's own badge. */
  readonly nuyenLabel = computed(() =>
    currencyLabel(this.#theme(), Number(this.#cash()?.metrics['balance'] ?? 0))
  );
  /** Derived from the year's office-day target progress (0–6+). */
  readonly resonanceRating = computed(() =>
    ((Number(this.#office()?.metrics['percentage'] ?? 0) / 100) * 6).toFixed(1)
  );

  readonly bootDate = dayjs().format('ddd DD MMM YYYY').toUpperCase();
  readonly time = toSignal(
    interval(1000).pipe(
      startWith(0),
      map(() => dayjs().format('HH:mm:ss'))
    ),
    { requireSync: true }
  );

  constructor() {
    addIcons({
      hardwareChipOutline,
      timerOutline,
      businessOutline,
      notificationsOutline,
      barcodeOutline,
      restaurantOutline,
      cartOutline,
      fileTrayStackedOutline,
      checkboxOutline,
      pricetagsOutline,
      walletOutline,
      diceOutline,
      settingsOutline,
      sparklesOutline,
    });
  }
}
