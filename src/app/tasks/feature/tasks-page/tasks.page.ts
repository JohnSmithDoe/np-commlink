import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { IonButton, IonNote, ViewWillEnter } from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, remove } from 'ionicons/icons';
import { TColor } from '../../../@shared/model/app.types';
import { TItemListSortType } from '../../../@shared/model/item-list.types';
import { ITaskItem } from '../../model/task.types';
import { dueStatusColor } from '../../util/task.utils';
import { LIST_FACADE } from '../../../@shared/util/list/list-page.facade';
import { ListPageComponent } from '../../../@shared/feature/list-page/list-page.component';
import { ListItemComponent } from '../../../@shared/ui/base-item/list-item/list-item.component';
import { TasksListPageFacade } from '../../data';
import { EditTaskItemDialogComponent } from '../edit-task-item-dialog/edit-task-item-dialog.component';

@Component({
  selector: 'app-page-tasks',
  templateUrl: 'tasks.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,
    DatePipe,
    IonButton,
    IonNote,
    ListPageComponent,
    ListItemComponent,
    EditTaskItemDialogComponent,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: TasksListPageFacade }],
})
export class TasksPage implements ViewWillEnter {
  readonly #facade = inject(TasksListPageFacade);
  readonly #route = inject(ActivatedRoute);

  constructor() {
    addIcons({ add, remove });
  }

  ionViewWillEnter(): void {
    // Category→items drill (see shopping.page for the timing rationale).
    const filter = this.#route.snapshot.queryParamMap.get('filter');
    if (filter) this.#facade.selectCategory(filter);
  }

  removeItem(item: ITaskItem) {
    this.#facade.removeItem(item);
  }

  showEditDialog(item: ITaskItem) {
    this.#facade.showEditDialog(item);
  }

  setSortMode(type: TItemListSortType) {
    this.#facade.setSortMode(type);
  }

  statusColor(item: ITaskItem): TColor {
    return dueStatusColor(item);
  }
}
