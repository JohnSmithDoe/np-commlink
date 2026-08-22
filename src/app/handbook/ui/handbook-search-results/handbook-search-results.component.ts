import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { HandbookHit } from '../../util/handbook-search';
import { HandbookTitleComponent } from '../handbook-title/handbook-title.component';

@Component({
  selector: 'app-handbook-search-results',
  templateUrl: 'handbook-search-results.component.html',
  styleUrls: ['handbook-search-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    TranslatePipe,
    HandbookTitleComponent,
  ],
})
export class HandbookSearchResultsComponent {
  readonly hits = input.required<readonly HandbookHit[]>();
  readonly query = input('');
}
