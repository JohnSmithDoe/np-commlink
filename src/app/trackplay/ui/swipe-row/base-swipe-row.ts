import { booleanAttribute, Directive, input, output } from '@angular/core';
import { IonList } from '@ionic/angular/standalone';
import { IonDragEvent } from '../../../@shared/model/app.types';
import { revealedSideFromDrag } from '../../../@shared/util/app.utils';

@Directive()
export abstract class BaseSwipeRow {
  readonly ionList = input.required<IonList>();
  readonly canDelete = input(true, { transform: booleanAttribute });

  readonly deleteRequested = output<void>();
  readonly editRequested = output<void>();

  deleteOrEditOnSwipe(event: IonDragEvent): void {
    switch (revealedSideFromDrag(event)) {
      case 'start': {
        if (this.canDelete()) void this.emitDelete();
        break;
      }
      case 'end': {
        void this.emitEdit();
        break;
      }
    }
  }

  async emitDelete(): Promise<void> {
    await this.ionList().closeSlidingItems();
    this.deleteRequested.emit();
  }

  async emitEdit(): Promise<void> {
    await this.ionList().closeSlidingItems();
    this.editRequested.emit();
  }
}
