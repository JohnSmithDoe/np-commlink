import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DashboardStats } from '../../model/office-time.types';

@Component({
  selector: 'app-dash-percentage',
  templateUrl: './dash-percentage.component.html',
  styleUrls: ['./dash-percentage.component.scss'],
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashPercentageComponent {
  readonly stats = input<DashboardStats | null>();
}
