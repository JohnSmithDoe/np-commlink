import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { addIcons } from 'ionicons';
import { beer, business } from 'ionicons/icons';
import {
  OfficeTimeActions,
  selectTodayIsOfficeDay,
  dayjsToday,
} from '../../data';

@Component({
  selector: 'app-dash-button',
  templateUrl: './dash-button.component.html',
  styleUrls: ['./dash-button.component.scss'],
  imports: [
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonIcon,
    TranslateModule,
    IonButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashButtonComponent {
  readonly #store = inject(Store);
  readonly todayIsOfficeDay = this.#store.selectSignal(selectTodayIsOfficeDay);

  readonly title = input<string | undefined>();

  constructor() {
    addIcons({ beer, business });
  }

  addOfficeDay() {
    this.#store.dispatch(OfficeTimeActions.addOfficeTime(dayjsToday()));
  }
}
