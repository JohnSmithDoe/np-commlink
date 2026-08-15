import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonToggle,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { settingsOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { padClock } from '../../../@shared/util/formatting/date-format.utils';
import { RitualPageFacade } from '../../data';

@Component({
  selector: 'app-page-ritual-settings',
  templateUrl: './ritual-settings.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonToggle,
    IonInput,
    IonButton,
    TranslatePipe,
  ],
})
export class RitualSettingsPage {
  readonly #facade = inject(RitualPageFacade);

  readonly reminder = this.#facade.reminder;
  readonly dismissedCount = this.#facade.dismissedCount;

  readonly reminderTime = computed(() => {
    const { hour, minute } = this.reminder();
    return `${padClock(hour)}:${padClock(minute)}`;
  });

  constructor() {
    addIcons({ settingsOutline });
  }

  restoreAll(): void {
    this.#facade.restoreAll();
  }

  toggleReminder(enabled: boolean): void {
    this.#facade.setReminder({ ...this.reminder(), enabled });
  }

  setReminderTime(value: string | number | null | undefined): void {
    if (typeof value !== 'string') return;
    const [hour, minute] = value.split(':').map(Number);
    if (
      hour == null ||
      minute == null ||
      Number.isNaN(hour) ||
      Number.isNaN(minute)
    )
      return;
    this.#facade.setReminder({ ...this.reminder(), hour, minute });
  }
}
