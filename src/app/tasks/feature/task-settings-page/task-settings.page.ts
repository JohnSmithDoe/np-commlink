/* ─── why ─────────────────────────────────────────────────────────
 * Two kinds of setting on one page, and the split is not cosmetic. The
 * warning shift is a GLOBAL — no task stores a warning window, so it is
 * read at render time and moves every task at once. The anchor is a
 * DEFAULT — every task stores its own, so it seeds a new task and can never
 * reach one that exists. Which kind a value is follows from whether the item
 * mirrors it; see decisions.md.
 * ───────────────────────────────────────────────────────────────── */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  IonContent,
  IonItem,
  IonList,
  IonListHeader,
} from '@ionic/angular/standalone';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { optionsOutline } from 'ionicons/icons';
import { Marker } from '../../../@shared/model/app.types';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { PageReturnComponent } from '../../../@shared/ui/page-return/page-return.component';
import {
  ChipOption,
  OptionChipsComponent,
} from '../../../@shared/ui/forms/option-chips/option-chips.component';
import { TasksListPageFacade } from '../../data';
import { ANCHOR_OPTIONS } from '../../util/task-anchor.utils';
import {
  TaskAnchor,
  TASK_WARN_SHIFTS,
  TaskWarnShift,
} from '../../model/task.types';

const WARN_LABELS: Readonly<Record<TaskWarnShift, Marker>> = {
  earlier: marker('tasks.settings.warn.earlier'),
  normal: marker('tasks.settings.warn.normal'),
  later: marker('tasks.settings.warn.later'),
};

@Component({
  selector: 'app-page-task-settings',
  templateUrl: 'task-settings.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    PageReturnComponent,
    OptionChipsComponent,
    TranslatePipe,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
  ],
})
export class TaskSettingsPage {
  readonly #facade = inject(TasksListPageFacade);
  readonly #translate = inject(TranslateService);

  readonly settings = this.#facade.settings;

  readonly warnOptions = computed<ChipOption<TaskWarnShift>[]>(() =>
    TASK_WARN_SHIFTS.map((shift) => ({
      value: shift,
      label: this.#translate.instant(WARN_LABELS[shift]),
    }))
  );

  readonly anchorOptions = computed<ChipOption<TaskAnchor>[]>(() =>
    ANCHOR_OPTIONS.map((anchor) => ({
      value: anchor.value,
      label: this.#translate.instant(anchor.key),
    }))
  );

  constructor() {
    addIcons({ optionsOutline });
  }

  setWarnShift(warnShift: TaskWarnShift): void {
    this.#facade.updateSettings({ warnShift });
  }

  setDefaultAnchor(defaultAnchor: TaskAnchor): void {
    this.#facade.updateSettings({ defaultAnchor });
  }
}
