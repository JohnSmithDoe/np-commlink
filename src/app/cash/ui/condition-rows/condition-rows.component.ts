import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import {
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonToggle,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import {
  ConditionForm,
  FIELD_LABEL_KEYS,
  FilterField,
  FilterOperation,
  isTextFilterField,
  OP_LABEL_KEYS,
  TEXT_FILTER_FIELDS,
} from '../../model/rule.types';
import { opsFor } from '../../util/rule-form.utils';

@Component({
  selector: 'app-cash-condition-rows',
  templateUrl: './condition-rows.component.html',
  styleUrls: ['./condition-rows.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    IonButton,
    IonIcon,
    IonInput,
    IonItem,
    IonNote,
    IonSelect,
    IonSelectOption,
    IonToggle,
    TranslatePipe,
  ],
})
export class CashConditionRowsComponent {
  readonly conditions = input.required<FieldTree<ConditionForm[]>>();
  readonly amountInvalidRows = input<readonly boolean[]>([]);

  readonly fieldPicked = output<{ index: number; field: FilterField }>();
  readonly removed = output<number>();

  readonly opLabelKeys = OP_LABEL_KEYS;
  readonly fieldLabelKeys = FIELD_LABEL_KEYS;
  readonly textFields = TEXT_FILTER_FIELDS;
  readonly opsFor: (field: FilterField) => readonly FilterOperation[] = opsFor;
  readonly isTextField = isTextFilterField;

  constructor() {
    addIcons({ closeOutline });
  }
}
