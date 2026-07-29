import { booleanAttribute, Directive, input, output } from '@angular/core';
import { IonList } from '@ionic/angular/standalone';
import { TIonDragEvent } from '../../../@shared/model/app.types';
import { revealedSideFromDrag } from '../../../@shared/util/app.utils';

/**
 * Abstract base for trackplay's three dumb list rows (game, player, game type).
 * Each renders a different body, but the swipe affordance is one behaviour: drag
 * the start side (or tap the option) to delete, the end side to edit — and close
 * the open row first, or the next tap lands on a still-open option.
 *
 * Closing needs the `IonList`, which a row does not own, hence the input. The
 * outputs are deliberately NOT domain-named: what the row asks for is a delete or
 * an edit, and the element already says of what.
 *
 * Decorated (unlike the app's other bases) because a class declaring `input()` /
 * `output()` has to be for its subclasses to inherit them.
 */
@Directive()
export abstract class BaseSwipeRow {
  readonly ionList = input.required<IonList>();
  // The built-in game type is undeletable, so its row offers edit only.
  readonly canDelete = input(true, { transform: booleanAttribute });

  readonly deleteRequested = output<void>();
  readonly editRequested = output<void>();

  deleteOrEditOnSwipe(event: TIonDragEvent): void {
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
