import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonList,
} from '@ionic/angular/standalone';
import { Dayjs } from 'dayjs';

@Component({
  selector: 'app-dash-days-list',
  templateUrl: './dash-days-list.component.html',
  styleUrls: ['./dash-days-list.component.scss'],
  imports: [
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonList,
    IonItem,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashDaysListComponent {
  readonly title = input<string | undefined>();
  readonly days = input<Array<Dayjs> | undefined | null>();
}
