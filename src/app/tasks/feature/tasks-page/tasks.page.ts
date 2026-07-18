import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { IonButton, IonNote, ViewWillEnter } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import dayjs from 'dayjs';
import { addIcons } from 'ionicons';
import { add, remove } from 'ionicons/icons';
import { TColor, TItemListSortType } from '../../../@shared/types';
import { ITaskItem } from '../../model';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { LIST_FACADE } from '../../../@shared/util/list/list-page.facade';
import { ListPageComponent } from '../../../@shared/feature/list-page/list-page.component';
import { ListItemComponent } from '../../../@shared/ui/item-list-items/list-item/list-item.component';
import { TasksActions, TasksListPageFacade } from '../../data';
import { EditTaskItemDialogComponent } from '../edit-task-item-dialog/edit-task-item-dialog.component';

@Component({
  selector: 'app-page-task',
  templateUrl: 'tasks.page.html',
  styleUrls: ['tasks.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
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
  readonly #store = inject(Store);

  constructor() {
    addIcons({ add, remove });
  }

  ionViewWillEnter(): void {
    this.#store.dispatch(TasksActions.enterPage());
  }

  removeItem(item: ITaskItem) {
    this.#store.dispatch(TasksActions.removeItem(item));
  }

  showEditDialog(item: ITaskItem) {
    this.#store.dispatch(ItemDialogsActions.showEditDialog(item, '_tasks'));
  }

  setSortMode(type: TItemListSortType) {
    this.#store.dispatch(TasksActions.updateSort(type, 'toggle'));
  }

  getItemStatusColor(item: ITaskItem): TColor {
    if (!item.dueAt) {
      return 'success';
    }

    const dueAt = dayjs(item.dueAt);
    if (dueAt.isBefore()) {
      return 'danger';
    }

    if (dueAt.isBefore(dayjs().add(3, 'days'))) {
      return 'warning';
    }

    return 'success';
  }
}
