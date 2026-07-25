import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { outputFromObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { IonInput, IonItem } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';
import { IBaseItem, TMarker } from '../../../model/types';
import {
  matchesSearchExactly,
  validateNameInput,
} from '../../../util/app.utils';

@Component({
  selector: 'app-item-name-input',
  templateUrl: './item-name-input.component.html',
  styleUrls: ['./item-name-input.component.scss'],
  imports: [IonInput, IonItem, ReactiveFormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemNameInputComponent implements OnChanges {
  readonly item = input<IBaseItem | null>();
  readonly listItems = input<IBaseItem[] | null>();

  readonly nameControl: FormControl = new FormControl('');

  // Forward every value change out as an output (signal-era replacement for a
  // valueChanges subscription; auto-unsubscribes via the injection context).
  readonly updateValue = outputFromObservable(
    this.nameControl.valueChanges.pipe(map((value) => value ?? ''))
  );

  // Validity as signals so parents can read `invalid()` in an OnPush/zoneless
  // template without a manual statusChanges subscription mutating a field.
  readonly #status = toSignal(this.nameControl.statusChanges, {
    initialValue: this.nameControl.status,
  });
  readonly valid = computed(() => this.#status() === 'VALID');
  readonly invalid = computed(() => !this.valid());

  ngOnChanges(changes: SimpleChanges): void {
    const item = this.item();
    if (
      changes.hasOwnProperty('item') &&
      !!item &&
      !matchesSearchExactly(item, this.nameControl.value ?? '')
    ) {
      this.nameControl.setValue(item.name);
      this.nameControl.markAsTouched();
    }
    const listItems = this.listItems();
    if (changes.hasOwnProperty('listItems') && listItems) {
      this.nameControl.setValidators(validateNameInput(listItems, item));
      this.nameControl.updateValueAndValidity();
    }
  }

  getErrorText(): TMarker {
    return this.nameControl.hasError('duplicate')
      ? marker('edit.item.dialog.name.duplicate.error')
      : marker('edit.item.dialog.name.empty.error');
  }
}
