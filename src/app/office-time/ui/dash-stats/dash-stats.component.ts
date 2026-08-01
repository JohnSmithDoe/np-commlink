import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/angular/standalone';
import { DashboardStats } from '../../model/office-time.types';
import { DashPercentageComponent } from '../dash-percentage/dash-percentage.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-dash-stats',
  templateUrl: './dash-stats.component.html',
  styleUrls: ['./dash-stats.component.scss'],
  imports: [
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    DashPercentageComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashStatsComponent {
  readonly title = input<string | undefined>();
  readonly data = input.required<DashboardStats>();
  readonly showPercentage = input<boolean | undefined>();
}
