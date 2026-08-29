import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { IonNote } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { notifications, notificationsOff } from 'ionicons/icons';
import { ListPageComponent } from '../../../@shared/feature/item-lists/list-page/list-page.component';
import { ListItemComponent } from '../../../@shared/ui/base-item/list-item/list-item.component';
import { LIST_FACADE } from '../../../@shared/util/item-lists/list-page.facade';
import { clockTime } from '../../../@shared/util/formatting/date-format.utils';
import { PillsPageFacade } from '../../data';
import { Pill } from '../../model/vitals.types';
import { VITALS_EDIT_SWIPE_ACTION } from '../../ui/swipe-actions';
import { EditPillDialogComponent } from '../edit-pill-dialog/edit-pill-dialog.component';
import { WeekdaySummaryPipe } from '../../util/weekday-summary.pipe';

@Component({
  selector: 'app-page-vitals-pills',
  templateUrl: './pills.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonNote,
    TranslatePipe,
    ListPageComponent,
    ListItemComponent,
    WeekdaySummaryPipe,
    EditPillDialogComponent,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: PillsPageFacade }],
})
export class VitalsPillsPage {
  readonly editSwipeAction = VITALS_EDIT_SWIPE_ACTION;

  readonly facade = inject(PillsPageFacade);

  constructor() {
    addIcons({ notifications, notificationsOff });
  }

  time(pill: Pill): string {
    return clockTime(pill.hour, pill.minute);
  }

  openPillEdit(pill: Pill): void {
    this.facade.showEditDialog(pill);
  }

  deletePill(pill: Pill): void {
    this.facade.removeItem(pill);
  }
}
