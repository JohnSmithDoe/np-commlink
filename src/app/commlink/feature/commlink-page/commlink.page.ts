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
  LanguageModelAvailability,
} from '../../../@shared/data/theme/language-model.service';
import { LanguageService } from '../../../@shared/data/theme/language.service';
import { DashboardFacade, DeckFacade, ThemeService } from '../../data';
import { DeckChromeField } from '../../model/deck.catalog';
import { DECK_CHROME_LABELS } from '../../model/deck.labels';
import { DECK_ICONS } from '../../model/deck.icons';
import { DeckEntry, ProgramStatus } from '../../model/deck.types';
import { currencyLabel } from '../../util/currency-label.utils';
import { HexPipe } from '../../util/hex.pipe';

const LANGUAGE_MODEL_STATUS: Record<LanguageModelAvailability, ProgramStatus> =
  {
    available: 'online',
    downloadable: 'standby',
    downloading: 'standby',
    probing: 'standby',
    unavailable: 'offline',
  };

const NODE_STATUS_FIELD: Record<ProgramStatus, DeckChromeField> = {
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

  readonly programs = this.#deck.programs;

  readonly chrome = computed(() => DECK_CHROME_LABELS[this.#theme()]);

  readonly total = this.#deck.slotCount;
  readonly onlineCount = computed(
    () =>
      this.#deck.allPrograms().filter((p) => this.status(p) === 'online').length
  );

  status(program: DeckEntry): ProgramStatus {
    if (program.needsLanguageModel)
      return LANGUAGE_MODEL_STATUS[this.#languageModel.availability()];
    if (program.source)
      return this.#telemetry().bySource[program.source]?.status ?? 'standby';
    return program.status ?? 'online';
  }

  readonly #telemetry = this.#dashboard.dashboardState;

  badge(program: DeckEntry): number | null {
    if (!program.source || !program.metric) return null;
    return this.#reported(program.source, program.metric);
  }

  badgeLabel(program: DeckEntry, value: number): string {
    return program.currency
      ? currencyLabel(this.#theme(), value, this.#locale())
      : String(value);
  }

  nodeStatusKey(status: ProgramStatus): string {
    return this.chrome()[NODE_STATUS_FIELD[status]];
  }

  #reported(source: string, metric: string): number | null {
    const value = this.#telemetry().bySource[source]?.metrics[metric];
    return value == undefined ? null : Number(value);
  }

  readonly tiles = computed(() =>
    this.programs().map((program) => {
      const status = this.status(program);
      const badge = this.badge(program);
      return {
        program,
        status,
        dark: status === 'offline',
        badgeText:
          badge !== null && badge > 0 ? this.badgeLabel(program, badge) : null,
        statusKey: this.nodeStatusKey(status),
      };
    })
  );

  readonly noise = this.#dashboard.notificationsUnread;
  readonly nuyenLabel = computed(() =>
    currencyLabel(
      this.#theme(),
      this.#reported('cash', 'balance') ?? 0,
      this.#locale()
    )
  );
  readonly resonanceRating = computed(() =>
    (((this.#reported('office-time', 'percentage') ?? 0) / 100) * 6).toFixed(1)
  );

  readonly bootDate = dayjs().format('ddd DD MMM YYYY').toUpperCase();

  readonly #clock = signal(clockLabel());
  readonly time = this.#clock.asReadonly();
  #tick: ReturnType<typeof setInterval> | null = null;

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
    inject(DestroyRef).onDestroy(() => this.#stopClock());
    addIcons(DECK_ICONS);
  }
}
