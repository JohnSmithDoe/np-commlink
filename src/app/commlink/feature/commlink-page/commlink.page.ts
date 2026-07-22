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
import { Store } from '@ngrx/store';
import { addIcons } from 'ionicons';
import {
  barcodeOutline,
  businessOutline,
  cafeOutline,
  cartOutline,
  checkboxOutline,
  diceOutline,
  fileTrayStackedOutline,
  hardwareChipOutline,
  notificationsOutline,
  pricetagsOutline,
  timerOutline,
  walletOutline,
} from 'ionicons/icons';
import dayjs from 'dayjs';
import { interval, map, startWith } from 'rxjs';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import {
  selectDashboardState,
  selectTelemetry,
} from '../../../@shared/data/dashboard/dashboard.selector';

/** online = jacked in · standby = wired, app not merged yet · offline = dark. */
type ProgramStatus = 'online' | 'standby' | 'offline';

/**
 * A single "program" node on the commlink deck. Codenames lean into
 * Shadowrun jargon (MEATSPACE = the physical world, SOYKAF = the
 * kitchen-bot's coffee/food, SIGIL = paydata scan).
 *
 * `source` + `metric` overlay a live count from the shared dashboard
 * read-model onto the tile (via `selectTelemetry(source).metrics[metric]`) —
 * commlink stays domain-blind, reading only the CQRS read-model. Tiles with
 * no data domain (SIGIL, SOYKAF) leave them unset and render no badge.
 */
type CommlinkProgram = {
  hex: string;
  codename: string;
  desc: string;
  icon: string;
  route: string | null;
  status: ProgramStatus;
  source?: string;
  metric?: string;
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
    PageHeaderComponent,
  ],
})
export class CommlinkPage {
  readonly programs: readonly CommlinkProgram[] = [
    {
      hex: '0x01',
      codename: 'CHRONO',
      desc: 'time & task deck',
      icon: 'timer-outline',
      route: '/tracking',
      status: 'online',
      source: 'tracking',
      metric: 'count',
    },
    {
      hex: '0x02',
      codename: 'MEATSPACE',
      desc: 'office presence grid',
      icon: 'business-outline',
      route: '/office-time',
      status: 'online',
      source: 'office-time',
      metric: 'officedays',
    },
    {
      hex: '0x03',
      codename: 'COMMS',
      desc: 'signal inbox',
      icon: 'notifications-outline',
      route: '/notifications',
      status: 'online',
      source: 'notifications',
      metric: 'unread',
    },
    {
      hex: '0x04',
      codename: 'SIGIL',
      desc: 'barcode / paydata',
      icon: 'barcode-outline',
      route: '/barcode',
      status: 'online',
    },
    // Kitchen-bot seam: wired to a standby placeholder until np-kitchen-bot
    // is merged in — then point `route` at the real feature and flip
    // `status` to 'online'. See src/app/kitchen/feature/kitchen-page.
    {
      hex: '0x05',
      codename: 'SOYKAF',
      desc: 'kitchen-bot // brewing',
      icon: 'cafe-outline',
      route: '/soykaf',
      status: 'standby',
    },
    {
      hex: '0x06',
      codename: 'MARKET',
      desc: 'shopping list',
      icon: 'cart-outline',
      route: '/shopping/_shopping',
      status: 'online',
      source: 'shopping',
      metric: 'active',
    },
    {
      hex: '0x07',
      codename: 'STASH',
      desc: 'pantry stock',
      icon: 'file-tray-stacked-outline',
      route: '/storage/_storage',
      status: 'online',
      source: 'storage',
      metric: 'low',
    },
    {
      hex: '0x08',
      codename: 'AGENDA',
      desc: 'task list',
      icon: 'checkbox-outline',
      route: '/tasks/_tasks',
      status: 'online',
      source: 'tasks',
      metric: 'open',
    },
    {
      hex: '0x09',
      codename: 'CATALOG',
      desc: 'master products',
      icon: 'pricetags-outline',
      route: '/products/_products',
      status: 'online',
      source: 'products',
      metric: 'count',
    },
    {
      hex: '0x0A',
      codename: 'CREDSTICK',
      desc: 'nuyen // ledger',
      icon: 'wallet-outline',
      route: '/cash',
      status: 'online',
      source: 'cash',
      metric: 'balance',
    },
    // Trackplay seam — game-score tracker merged in as one sealed domain.
    {
      hex: '0x0B',
      codename: 'TRACKPLAY',
      desc: 'game-score deck',
      icon: 'dice-outline',
      route: '/trackplay',
      status: 'online',
      source: 'trackplay',
      metric: 'games',
    },
  ];

  readonly #store = inject(Store);

  readonly onlineCount = this.programs.filter((p) => p.status === 'online')
    .length;
  readonly total = this.programs.length;

  // Read ONLY the shared dashboard read-model (CQRS): each supplier pushes its
  // telemetry via DashboardActions.report; commlink imports no other domain.
  readonly #telemetry = this.#store.selectSignal(selectDashboardState);

  /**
   * Live badge value for a program's configured metric from the read-model, or
   * null when the tile has no telemetry source. Reads the `#telemetry` signal,
   * so tiles re-render when any source reports (zoneless-safe).
   */
  badge(program: CommlinkProgram): number | null {
    if (!program.source || !program.metric) return null;
    const value =
      this.#telemetry().bySource[program.source]?.metrics[program.metric];
    return value == undefined ? null : Number(value);
  }

  readonly #comms = this.#store.selectSignal(selectTelemetry('notifications'));
  /** Unread signals → drives the NOISE status-strip readout. */
  readonly noise = computed(() =>
    Number(this.#comms()?.metrics['unread'] ?? 0)
  );
  readonly #office = this.#store.selectSignal(selectTelemetry('office-time'));
  /** Nuyen "banked" == office days logged this year. */
  readonly nuyen = computed(() =>
    Number(this.#office()?.metrics['officedays'] ?? 0)
  );
  /** Resonance rating derived from year office-day target progress (0–6+). */
  readonly res = computed(() =>
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
      cafeOutline,
      cartOutline,
      fileTrayStackedOutline,
      checkboxOutline,
      pricetagsOutline,
      walletOutline,
      diceOutline,
    });
  }
}
