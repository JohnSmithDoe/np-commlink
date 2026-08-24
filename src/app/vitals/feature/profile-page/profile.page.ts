import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IonButton, IonIcon, IonNote } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  createOutline,
  layersOutline,
  medkitOutline,
  planetOutline,
} from 'ionicons/icons';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ListPageComponent } from '../../../@shared/feature/item-lists/list-page/list-page.component';
import { ListItemComponent } from '../../../@shared/ui/base-item/list-item/list-item.component';
import { LIST_FACADE } from '../../../@shared/util/item-lists/list-page.facade';
import { ReadingsPageFacade } from '../../data';
import { Reading } from '../../model/vitals.types';
import { WeightChartComponent } from '../../smart-ui/weight-chart/weight-chart.component';
import { VITALS_EDIT_SWIPE_ACTION } from '../../ui/swipe-actions';
import { WeightPipe } from '../../util/weight.pipe';
import { EditProfileDialogComponent } from '../edit-profile-dialog/edit-profile-dialog.component';
import { EditReadingDialogComponent } from '../edit-reading-dialog/edit-reading-dialog.component';

@Component({
  selector: 'app-page-vitals-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    IonButton,
    IonIcon,
    IonNote,
    RouterLink,
    TranslatePipe,
    ListPageComponent,
    ListItemComponent,
    WeightChartComponent,
    WeightPipe,
    EditProfileDialogComponent,
    EditReadingDialogComponent,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: ReadingsPageFacade }],
})
export class VitalsProfilePage {
  readonly editSwipeAction = VITALS_EDIT_SWIPE_ACTION;

  readonly facade = inject(ReadingsPageFacade);

  constructor() {
    addIcons({
      createOutline,
      layersOutline,
      medkitOutline,
      planetOutline,
    });
  }

  openReadingEdit(reading: Reading): void {
    this.facade.showEditDialog(reading);
  }

  deleteReading(reading: Reading): void {
    this.facade.removeItem(reading);
  }
}
