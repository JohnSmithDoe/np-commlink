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
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import dayjs from 'dayjs';
import { APP_WORDMARK } from '../../../@shared/model/app.consts';
import { currentTime$ } from '../../../@shared/util/clock';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { LanguageModelService } from '../../../@shared/data/theme/language-model.service';
import { LanguageService } from '../../../@shared/data/theme/language.service';
import { DashboardFacade, DeckFacade, ThemeService } from '../../data';
import { DECK_CHROME_LABELS } from '../../model/deck.labels';
import { DECK_ICONS } from '../../model/deck.icons';
import { DeckEntry } from '../../model/deck.types';
import { currencyLabel } from '../../util/currency-label.utils';
import {
  badgeLabel,
  badgeValue,
  nodeStatusKey,
  programStatus,
  reportedMetric,
  resonanceRatingOf,
} from '../../util/deck.utils';
import { HexPipe } from '../../util/hex.pipe';

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
  readonly #skin = inject(ThemeService).skin;
  readonly #locale = inject(LanguageService).locale;

  readonly programs = this.#deck.programs;

  readonly chrome = computed(() => DECK_CHROME_LABELS[this.#skin()]);

  readonly #telemetry = this.#dashboard.dashboardState;

  readonly #statusOf = computed(() => {
    const telemetry = this.#telemetry();
    const availability = this.#languageModel.availability();
    return (program: DeckEntry) =>
      programStatus(program, telemetry, availability);
  });

  readonly total = this.#deck.slotCount;
  readonly onlineCount = computed(
    () =>
      this.#deck.allPrograms().filter((p) => this.#statusOf()(p) === 'online')
        .length
  );

  readonly tiles = computed(() => {
    const chrome = this.chrome();
    const statusOf = this.#statusOf();
    return this.programs().map((program) => {
      const status = statusOf(program);
      const badge = badgeValue(this.#telemetry(), program);
      return {
        program,
        status,
        dark: status === 'offline',
        badgeText:
          badge !== null && badge > 0
            ? badgeLabel(program, badge, this.#skin(), this.#locale())
            : null,
        statusKey: nodeStatusKey(chrome, status),
      };
    });
  });

  readonly noise = this.#dashboard.notificationsUnread;
  readonly nuyenLabel = computed(() =>
    currencyLabel(
      this.#skin(),
      reportedMetric(this.#telemetry(), 'cash', 'balance') ?? 0,
      this.#locale()
    )
  );
  readonly resonanceRating = computed(() =>
    resonanceRatingOf(
      reportedMetric(this.#telemetry(), 'office-time', 'percentage') ?? 0
    )
  );

  readonly bootDate = dayjs().format('ddd DD MMM YYYY').toUpperCase();

  readonly #now = toSignal(currentTime$, { initialValue: dayjs() });
  readonly time = computed(() => this.#now().format('HH:mm:ss'));

  constructor() {
    addIcons(DECK_ICONS);
  }
}
