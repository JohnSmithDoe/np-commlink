import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { addIcons } from 'ionicons';
import {
  barcodeOutline,
  businessOutline,
  cafeOutline,
  hardwareChipOutline,
  notificationsOutline,
  timerOutline,
} from 'ionicons/icons';
import dayjs from 'dayjs';
import { interval, map, startWith } from 'rxjs';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { selectNotificationsBadgeCount } from '../../../notifications/data/notifications.selectors';
import { selectDashboardStatsYear } from '../../../office-time/data/office-time/office-time.stats.selectors';

/** online = jacked in · standby = wired, app not merged yet · offline = dark. */
type ProgramStatus = 'online' | 'standby' | 'offline';

/**
 * A single "program" node on the commlink deck. Codenames lean into
 * Shadowrun jargon (MEATSPACE = the physical world, SOYKAF = the
 * kitchen-bot's coffee/food, SIGIL = paydata scan). `badgeKey` overlays a
 * live count (e.g. unread signals) onto the tile.
 */
type CommlinkProgram = {
  hex: string;
  codename: string;
  desc: string;
  icon: string;
  route: string | null;
  status: ProgramStatus;
  badgeKey?: 'unread';
};

@Component({
  selector: 'app-page-commlink',
  templateUrl: './commlink.page.html',
  styleUrls: ['./commlink.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonContent, IonIcon, RouterLink, PageHeaderComponent],
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
    },
    {
      hex: '0x02',
      codename: 'MEATSPACE',
      desc: 'office presence grid',
      icon: 'business-outline',
      route: '/office-time',
      status: 'online',
    },
    {
      hex: '0x03',
      codename: 'COMMS',
      desc: 'signal inbox',
      icon: 'notifications-outline',
      route: '/notifications',
      status: 'online',
      badgeKey: 'unread',
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
  ];

  readonly #store = inject(Store);

  readonly onlineCount = this.programs.filter((p) => p.status === 'online')
    .length;
  readonly total = this.programs.length;

  // ── live telemetry (signals, zoneless-safe) ──────────────────
  /** Unread signals → drives NOISE + the COMMS tile badge. */
  readonly noise = this.#store.selectSignal(selectNotificationsBadgeCount);
  readonly #statsYear = this.#store.selectSignal(selectDashboardStatsYear);
  /** Nuyen "banked" == office days logged this year. */
  readonly nuyen = computed(() => this.#statsYear()?.officedays ?? 0);
  /** Resonance rating derived from year office-day target progress (0–6+). */
  readonly res = computed(() =>
    (((this.#statsYear()?.percentage ?? 0) / 100) * 6).toFixed(1)
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
    });
  }
}
