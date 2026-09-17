import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import dayjs from 'dayjs';
import { TodayService } from '../../../@shared/data/services/today.service';
import {
  IntervalSummary,
  intervalSummary,
} from '../../../@shared/util/forms/interval-summary.utils';
import { addIcons } from 'ionicons';
import {
  addOutline,
  arrowUndoOutline,
  checkmarkDoneOutline,
  removeOutline,
} from 'ionicons/icons';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { IonColor, Marker, Timestamp } from '../../../@shared/model/app.types';
import { TaskItem } from '../../model/task.types';
import { dueStatusColor, nextDueOf, recursAt } from '../../util/task.utils';
import { LIST_FACADE } from '../../../@shared/util/item-lists/list-page.facade';
import { ListPageComponent } from '../../../@shared/feature/item-lists/list-page/list-page.component';
import { ListItemComponent } from '../../../@shared/ui/base-item/list-item/list-item.component';
import { StartSwipeAction } from '../../../@shared/ui/base-item/base-swipe-row';
import { TasksListPageFacade } from '../../data';
import { EditTaskItemDialogComponent } from '../edit-task-item-dialog/edit-task-item-dialog.component';
import { TaskSettingsButtonComponent } from '../../ui/task-settings-button/task-settings-button.component';

const MARK_DONE: StartSwipeAction = {
  labelKey: marker('tasks.action.done'),
  icon: 'checkmark-done-outline',
};
const REOPEN: StartSwipeAction = {
  labelKey: marker('tasks.action.reopen'),
  icon: 'arrow-undo-outline',
  color: 'medium',
};

const RECURS_NOTE = marker('tasks.item.recurs.note');
const DUE_NOTE = marker('tasks.item.due.note');

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
    TaskSettingsButtonComponent,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: TasksListPageFacade }],
})
export class TasksPage {
  readonly #facade = inject(TasksListPageFacade);
  readonly #today = inject(TodayService).today;
  readonly #now = computed(() => dayjs(this.#today()));

  constructor() {
    addIcons({
      addOutline,
      removeOutline,
      checkmarkDoneOutline,
      arrowUndoOutline,
    });
  }

  swipeActionFor(item: TaskItem): StartSwipeAction {
    return item.doneAt ? REOPEN : MARK_DONE;
  }

  toggleDone(item: TaskItem) {
    this.#facade.toggleDone(item);
  }

  removeItem(item: TaskItem) {
    this.#facade.removeItem(item);
  }

  showEditDialog(item: TaskItem) {
    this.#facade.showEditDialog(item);
  }

  statusColor(item: TaskItem): IonColor | undefined {
    return dueStatusColor(item, this.#now(), this.#facade.settings().warnShift);
  }

  dateNote(item: TaskItem): { key: Marker; date: Timestamp } | undefined {
    const date = nextDueOf(item);
    if (!date) return undefined;
    return { key: recursAt(item) ? RECURS_NOTE : DUE_NOTE, date };
  }

  cadence(item: TaskItem): IntervalSummary | undefined {
    return item.interval ? intervalSummary(item.interval) : undefined;
  }
}
