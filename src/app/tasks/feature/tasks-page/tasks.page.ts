import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, remove } from 'ionicons/icons';
import { IonColor } from '../../../@shared/model/app.types';
import { TaskItem } from '../../model/task.types';
import { dueStatusColor } from '../../util/task.utils';
import { LIST_FACADE } from '../../../@shared/util/item-lists/list-page.facade';
import { ListPageComponent } from '../../../@shared/feature/item-lists/list-page/list-page.component';
import { ListItemComponent } from '../../../@shared/ui/base-item/list-item/list-item.component';
import { TasksListPageFacade } from '../../data';
import { EditTaskItemDialogComponent } from '../edit-task-item-dialog/edit-task-item-dialog.component';

@Component({
  selector: 'app-page-tasks',
  templateUrl: 'tasks.page.html',
  styleUrls: ['tasks.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,
    DatePipe,
    ListPageComponent,
    ListItemComponent,
    EditTaskItemDialogComponent,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: TasksListPageFacade }],
})
export class TasksPage {
  readonly #facade = inject(TasksListPageFacade);

  constructor() {
    addIcons({ add, remove });
  }

  removeItem(item: TaskItem) {
    this.#facade.removeItem(item);
  }

  showEditDialog(item: TaskItem) {
    this.#facade.showEditDialog(item);
  }

  statusColor(item: TaskItem): IonColor | undefined {
    return dueStatusColor(item);
  }
}
