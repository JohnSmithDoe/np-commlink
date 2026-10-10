import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BaseEditItemDialog } from '../../../@shared/feature/item-lists/edit-item-dialog/base-edit-item-dialog';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { TrackingFacade } from '../../data';
import {
  TRACKING_SESSIONS_LIST_ID,
  TrackingItem,
} from '../../model/tracking.types';
import { createTrackingItem } from '../../util/tracking.factory';
import {
  adjustTrackedTime,
  setTrackedDuration,
  TrackedDuration,
} from '../../util/tracking-adjust.utils';
import { TrackedTimeAdjusterComponent } from '../../ui/tracked-time-adjuster/tracked-time-adjuster.component';

@Component({
  selector: 'app-edit-tracking-session-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ItemEditModalComponent, TrackedTimeAdjusterComponent],
  templateUrl: './edit-tracking-session-dialog.component.html',
})
export class EditTrackingSessionDialogComponent extends BaseEditItemDialog<TrackingItem> {
  readonly #facade = inject(TrackingFacade);
  protected readonly listId = TRACKING_SESSIONS_LIST_ID;
  readonly siblings = this.#facade.archivedSessions;

  protected override uniqueName(): boolean {
    return false;
  }

  protected blank(): TrackingItem {
    return createTrackingItem('');
  }

  protected save(session: TrackingItem): void {
    this.#facade.updateSession(session);
  }

  adjustTrackedTime(deltaSeconds: number): void {
    this.draft.update((draft) => adjustTrackedTime(draft, deltaSeconds));
  }

  setTrackedDuration(duration: TrackedDuration): void {
    this.draft.update((draft) => setTrackedDuration(draft, duration));
  }
}
