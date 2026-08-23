import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonIcon,
  IonRouterLinkWithHref,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  chevronForwardOutline,
  hardwareChipOutline,
  optionsOutline,
  swapHorizontalOutline,
} from 'ionicons/icons';
import dayjs from 'dayjs';
import { APP_WORDMARK } from '../../../@shared/model/app.consts';
import { currentTime$ } from '../../../@shared/util/clock';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { LanguageModelService } from '../../../@shared/data/theme/language-model.service';
import { LanguageService } from '../../../@shared/data/theme/language.service';
import { DashboardFacade, DeckFacade, ThemeService } from '../../data';
import { DECK_CHROME_LABELS } from '../../model/deck.labels';
import { DECK_ICONS } from '../../model/deck.icons';
import { DeckEntry, DeckEntryId } from '../../model/deck.types';
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

const ARRANGE_START = marker('deck.arrange.start');
const ARRANGE_DONE = marker('deck.arrange.done');
const ARRANGE_EARLIER = marker('deck.arrange.earlier');
const ARRANGE_LATER = marker('deck.arrange.later');

@Component({
  selector: 'app-page-commlink',
  templateUrl: './commlink.page.html',
  styleUrls: ['./commlink.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonButton,
    IonButtons,
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
  readonly #translate = inject(TranslateService);

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
    const locale = this.#locale();
    return this.programs().map((program) => {
      const status = statusOf(program);
      const badge = badgeValue(this.#telemetry(), program);
      const name: string = this.#translate.instant(program.nameKey);
      return {
        program,
        status,
        moveEarlierLabel: this.#translate.instant(ARRANGE_EARLIER, {
          name,
        }) as string,
        moveLaterLabel: this.#translate.instant(ARRANGE_LATER, {
          name,
        }) as string,
        dark: status === 'offline',
        badgeText:
          badge !== null && badge > 0
            ? badgeLabel(program, badge, this.#skin(), locale)
            : null,
        statusKey: nodeStatusKey(chrome, status),
      };
    });
  });

  readonly arranging = signal(false);
  readonly arrangeLabelKey = computed(() =>
    this.arranging() ? ARRANGE_DONE : ARRANGE_START
  );

  toggleArrange(): void {
    this.arranging.update((armed) => !armed);
  }

  moveEarlier(id: DeckEntryId): void {
    this.#deck.moveProgram(id, -1);
  }

  moveLater(id: DeckEntryId): void {
    this.#deck.moveProgram(id, 1);
  }

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
    addIcons({
      ...DECK_ICONS,
      chevronBackOutline,
      chevronForwardOutline,
      hardwareChipOutline,
      optionsOutline,
      swapHorizontalOutline,
    });
  }
}
