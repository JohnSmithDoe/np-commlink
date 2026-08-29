import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import {
  IonButton,
  IonChip,
  IonIcon,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeCircleOutline } from 'ionicons/icons';
import { Category, CategoryId } from '../../../model/category.types';

@Component({
  selector: 'app-category-input',
  templateUrl: './category-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonItem, IonLabel, IonChip, IonButton, IonIcon, TranslatePipe],
})
export class CategoryInputComponent {
  readonly categories = input<Category[]>();

  readonly removeCategory = output<CategoryId>();
  readonly openDialog = output<void>();

  constructor() {
    addIcons({ closeCircleOutline });
  }
}
