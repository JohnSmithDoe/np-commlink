import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { HANDBOOK_GROUP_LABEL } from '../../model/handbook.consts';
import { HandbookGroupView } from '../../util/handbook-content';
import { HandbookTitleComponent } from '../handbook-title/handbook-title.component';

@Component({
  selector: 'app-handbook-toc',
  templateUrl: 'handbook-toc.component.html',
  styleUrls: ['handbook-toc.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonNote,
    TranslatePipe,
    HandbookTitleComponent,
  ],
})
export class HandbookTocComponent {
  readonly groups = input.required<readonly HandbookGroupView[]>();

  readonly groupLabel = HANDBOOK_GROUP_LABEL;
}
