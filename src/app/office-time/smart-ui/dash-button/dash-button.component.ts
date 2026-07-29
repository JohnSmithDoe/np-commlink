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
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { beer, business } from 'ionicons/icons';
import { OfficeTimeFacade } from '../../data';

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
    TranslatePipe,
    IonButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashButtonComponent {
  readonly #facade = inject(OfficeTimeFacade);
  readonly todayIsOfficeDay = this.#facade.todayIsOfficeDay;

  readonly title = input<string | undefined>();

  constructor() {
    addIcons({ beer, business });
  }

  addOfficeDay() {
    this.#facade.addOfficeToday();
  }
}
