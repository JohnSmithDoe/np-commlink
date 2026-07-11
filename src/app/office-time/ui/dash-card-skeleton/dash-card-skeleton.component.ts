import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSkeletonText,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-dash-card-skeleton',
  templateUrl: './dash-card-skeleton.component.html',
  styleUrls: ['./dash-card-skeleton.component.scss'],
  imports: [
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSkeletonText,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashCardSkeletonComponent {}
