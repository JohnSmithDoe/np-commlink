/* ─── why ─────────────────────────────────────────────────────────
 * The date is a `linkedSignal` over the routed profile's birthday, not a
 * copy of it: seeded once the store hydrates, then freely editable so a
 * reader can look up someone who has no profile at all. Nothing here is
 * dispatched, so the edit is deliberately local and dies with the page.
 *
 * The ascendant is shown only while the date still IS the profile's
 * birthday. It cannot be derived from a date — it needs a birth time and a
 * place — so under any other date the honest answer is "unset", not the
 * profile's own value.
 * ───────────────────────────────────────────────────────────────── */

import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  Signal,
} from '@angular/core';
import {
  InputCustomEvent,
  IonContent,
  IonInput,
  IonItem,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { planetOutline } from 'ionicons/icons';
import { Marker } from '../../../@shared/model/app.types';
import { TodayService } from '../../../@shared/data/services/today.service';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { ProfilesFacade } from '../../data';
import {
  ASTRO_AGES,
  ZODIAC_BY_SIGN,
  ZODIAC_ELEMENT_LABEL_KEYS,
} from '../../model/astro.consts';
import { EraYearPipe } from '../../util/era-year.pipe';
import {
  astroAgeFor,
  SeasonPhase,
  ZodiacSeason,
  zodiacSignFor,
  zodiacTimelineAround,
} from '../../util/zodiac.utils';

const PHASE_LABEL_KEYS: Record<SeasonPhase, Marker> = {
  previous: marker('vitals.zodiac.phase.previous'),
  current: marker('vitals.zodiac.phase.current'),
  next: marker('vitals.zodiac.phase.next'),
};

@Component({
  selector: 'app-page-vitals-zodiac',
  templateUrl: './zodiac.page.html',
  styleUrls: ['./zodiac.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    IonContent,
    IonInput,
    IonItem,
    TranslatePipe,
    PageHeaderComponent,
    EraYearPipe,
  ],
})
export class VitalsZodiacPage {
  readonly ages = ASTRO_AGES;
  readonly signs = ZODIAC_BY_SIGN;
  readonly elementKeys = ZODIAC_ELEMENT_LABEL_KEYS;
  readonly phaseKeys = PHASE_LABEL_KEYS;

  readonly #profiles = inject(ProfilesFacade);

  readonly today = inject(TodayService).today;
  readonly profile = this.#profiles.routeProfile;
  readonly date = linkedSignal(() => this.profile()?.birthDate ?? this.today());

  readonly sign = computed(() => zodiacSignFor(this.date()));
  readonly ascendant = computed(() => {
    const profile = this.profile();
    return profile?.ascendant && profile.birthDate === this.date()
      ? this.signs[profile.ascendant]
      : undefined;
  });
  readonly storedSun = computed(() => {
    const profile = this.profile();
    return profile?.sun &&
      profile.birthDate === this.date() &&
      profile.sun !== this.sign()?.sign
      ? this.signs[profile.sun]
      : undefined;
  });

  readonly timeline: Signal<readonly ZodiacSeason[]> = computed(() =>
    zodiacTimelineAround(this.today())
  );
  readonly currentAge = computed(() => astroAgeFor(this.today()));

  readonly backHref = computed(
    () => `/vitals/profile/${this.profile()?.id ?? ''}`
  );

  constructor() {
    addIcons({ planetOutline });
  }

  setDate(event: InputCustomEvent): void {
    const { value } = event.detail;
    this.date.set(typeof value === 'string' ? value : '');
  }
}
