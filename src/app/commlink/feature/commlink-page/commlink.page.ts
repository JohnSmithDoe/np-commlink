import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonRouterLinkWithHref,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import dayjs from 'dayjs';
import { APP_WORDMARK } from '../../../@shared/model/app.consts';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import {
  LanguageModelService,
  TLanguageModelAvailability,
} from '../../../@shared/util/theme/language-model.service';
import { LanguageService } from '../../../@shared/util/theme/language.service';
import { ThemeService } from '../../../@shared/util/theme/theme.service';
import { DashboardFacade, DeckFacade } from '../../data';
import { TDeckChromeField } from '../../model/deck.catalog';
import { DECK_CHROME_LABELS } from '../../model/deck.labels';
import { DECK_ICONS } from '../../model/deck.icons';
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

const NODE_STATUS_FIELD: Record<TProgramStatus, TDeckChromeField> = {
  online: 'node-online',
  standby: 'node-standby',
  offline: 'node-offline',
};

const clockLabel = (): string => dayjs().format('HH:mm:ss');

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
    TranslatePipe,
    PageHeaderComponent,
    HexPipe,
  ],
})
export class CommlinkPage {
  protected readonly wordmark = APP_WORDMARK;
  readonly #dashboard = inject(DashboardFacade);
  readonly #deck = inject(DeckFacade);
  readonly #languageModel = inject(LanguageModelService);
  readonly #theme = inject(ThemeService).theme;
  readonly #locale = inject(LanguageService).locale;

  /** The tiles this user shows, in their order. */
  readonly programs = this.#deck.programs;

  /** The HUD's own copy, in the active theme's register. */
  readonly chrome = computed(() => DECK_CHROME_LABELS[this.#theme()]);

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
    return this.#reported(program.source, program.metric);
  }

  /** A tile's badge value as it should render — themed for a currency tile. */
  badgeLabel(program: IDeckEntry, value: number): string {
    return program.currency
      ? currencyLabel(this.#theme(), value, this.#locale())
      : String(value);
  }

  /** The word a tile's foot shows for its status, in the theme's register. */
  nodeStatusKey(status: TProgramStatus): string {
    return this.chrome()[NODE_STATUS_FIELD[status]];
  }

  #reported(source: string, metric: string): number | null {
    const value = this.#telemetry().bySource[source]?.metrics[metric];
    return value == undefined ? null : Number(value);
  }

  /**
   * One view model per visible tile.
   *
   * The grid used to call `status`/`badge`/`badgeLabel`/`nodeStatusKey` as METHODS
   * from inside `@for`, and the status strip's 1 Hz clock marks this view dirty
   * every second — so all four re-ran for all 13 tiles on every tick, `Intl`
   * currency formatting included, for inputs that had not changed. This computed
   * reads none of the clock, so a tick re-reads a cached array instead. The
   * methods stay the unit of logic (the status precedence is pinned on them, and
   * `onlineCount` reads them over the full catalog) — this only caches the result.
   */
  readonly tiles = computed(() =>
    this.programs().map((program) => {
      const status = this.status(program);
      const badge = this.badge(program);
      return {
        program,
        status,
        dark: status === 'offline',
        // Only positive values badge: a 0 count is nothing to flag, and a
        // non-positive balance (an overdraft) is deliberately not glanceable.
        badgeText:
          badge !== null && badge > 0 ? this.badgeLabel(program, badge) : null,
        statusKey: this.nodeStatusKey(status),
      };
    })
  );

  /** Unread signals → drives the NOISE status-strip readout. */
  readonly noise = this.#dashboard.notificationsUnread;
  /** The ledger balance, themed like the CREDSTICK tile's own badge. */
  readonly nuyenLabel = computed(() =>
    currencyLabel(
      this.#theme(),
      this.#reported('cash', 'balance') ?? 0,
      this.#locale()
    )
  );
  /** Derived from the year's office-day target progress (0–6+). */
  readonly resonanceRating = computed(() =>
    (((this.#reported('office-time', 'percentage') ?? 0) / 100) * 6).toFixed(1)
  );

  readonly bootDate = dayjs().format('ddd DD MMM YYYY').toUpperCase();

  readonly #clock = signal(clockLabel());
  readonly time = this.#clock.asReadonly();
  #tick: ReturnType<typeof setInterval> | null = null;

  /**
   * The clock ticks only while the deck is the page you are looking at. Ionic
   * keeps a visited route mounted for the whole session (`IonicRouteStrategy`
   * never destroys the view), so an unconditional 1 Hz interval would go on
   * marking this subtree dirty from behind whatever page the user navigated to.
   */
  ionViewWillEnter(): void {
    this.#clock.set(clockLabel());
    this.#tick ??= setInterval(() => this.#clock.set(clockLabel()), 1000);
  }

  ionViewWillLeave(): void {
    this.#stopClock();
  }

  #stopClock(): void {
    if (this.#tick !== null) clearInterval(this.#tick);
    this.#tick = null;
  }

  constructor() {
    // `ionViewWillLeave` covers navigation; this is the backstop for a destroy
    // that never routes, so the interval cannot outlive the component either way.
    inject(DestroyRef).onDestroy(() => this.#stopClock());
    addIcons(DECK_ICONS);
  }
}
