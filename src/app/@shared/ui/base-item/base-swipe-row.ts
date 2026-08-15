/* ─── why ─────────────────────────────────────────────────────────
 * Delete is on `end` and the constructive action on `start`, everywhere.
 * Trackplay had them inverted with its own copy of this routing, so the
 * gesture that bought a grocery deleted a game — one base directive stops
 * the two drifting apart again.
 *
 * `start` gates on `startSwipeAction` rather than a separate flag, because
 * what a drag reveals and what it fires are one fact: a row with nothing
 * to reveal must not emit. `end` gates on `canDelete`, the row's own veto.
 * ───────────────────────────────────────────────────────────────── */

import {
  booleanAttribute,
  computed,
  Directive,
  input,
  output,
} from '@angular/core';
import { IonList } from '@ionic/angular/standalone';
import { IonColor, IonDragEvent } from '../../model/app.types';
import { revealedSideFromDrag } from '../../util/app.utils';

export type StartSwipeAction = {
  labelKey: string;
  icon: string;
  color?: IonColor;
};

@Directive()
export abstract class BaseSwipeRow {
  readonly ionList = input.required<IonList>();
  readonly canDelete = input(true, { transform: booleanAttribute });
  readonly startSwipeAction = input<StartSwipeAction>();

  readonly deleteItem = output<void>();
  readonly startSwipe = output<void>();

  readonly hasStartSwipe = computed(() => !!this.startSwipeAction());

  onSwipe(event: IonDragEvent): void {
    switch (revealedSideFromDrag(event)) {
      case 'start': {
        if (this.hasStartSwipe()) void this.emitStartSwipe();
        break;
      }
      case 'end': {
        if (this.canDelete()) void this.emitDeleteItem();
        break;
      }
    }
  }

  async emitDeleteItem(): Promise<void> {
    await this.ionList().closeSlidingItems();
    this.deleteItem.emit();
  }

  async emitStartSwipe(): Promise<void> {
    await this.ionList().closeSlidingItems();
    this.startSwipe.emit();
  }
}
