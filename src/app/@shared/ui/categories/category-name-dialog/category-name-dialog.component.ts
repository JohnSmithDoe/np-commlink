import {
  ChangeDetectionStrategy,
  Component,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonModal,
  IonToolbar,
  InputCustomEvent,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';

/**
 * Pure presentational (type:ui) "name a new category" dialog — the affordance the
 * list page offers while it is in categories display mode. It was the last
 * component writing form state into the store on every keystroke
 * (`CategoriesActions.updateCategory`); the working name is a local draft now and
 * only the confirmed value leaves via {@link confirmed}.
 */
@Component({
  selector: 'app-category-name-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonModal,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    TranslateModule,
  ],
  templateUrl: './category-name-dialog.component.html',
})
export class CategoryNameDialogComponent {
  readonly isOpen = input<boolean>(false);
  /** Seed name (the list's current search term). */
  readonly name = input<string>('');

  readonly confirmed = output<string>();
  readonly cancelled = output<void>();

  // Reset to the seed each time the dialog (re)opens, so a cancel discards the
  // uncommitted text — same shape as the categories picker's selection.
  readonly draft = linkedSignal<boolean, string>({
    source: () => this.isOpen(),
    computation: () => this.name(),
  });

  constructor() {
    // `close-circle` is the icon ion-input renders for its clear button.
    addIcons({ closeCircle });
  }

  updateName(event: InputCustomEvent): void {
    this.draft.set(event.detail.value ?? '');
  }

  confirm(): void {
    this.confirmed.emit(this.draft());
  }
}
