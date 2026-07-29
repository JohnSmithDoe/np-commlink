import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
} from '@angular/core';
import { FormValueControl, ValidationError } from '@angular/forms/signals';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import {
  InputCustomEvent,
  IonInput,
  IonItem,
  IonNote,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { TMarker } from '../../../model/app.types';
import { BLANK_TEXT, DUPLICATE_NAME } from '../../../util/form-rules';

// Deliberately PARTIAL over the kind space — `form-rules` names kinds this field
// can never report (a date's, say) — so the index access has to yield
// `TMarker | undefined` for the "renders nothing" branch below to be reachable.
const ERROR_TEXT: Readonly<Partial<Record<string, TMarker>>> = {
  [DUPLICATE_NAME.kind]: marker('edit.item.dialog.name.duplicate.error'),
  [BLANK_TEXT.kind]: marker('edit.item.dialog.name.empty.error'),
};

/**
 * The name field every list-item dialog opens with, as a Signal Forms control:
 * a dialog binds `[formField]="form.name"` and the rules live in its schema
 * (`requireUniqueName`) instead of in this component.
 *
 * It owns no validation — it *reports* what the bound field found. `errors` is
 * one of the optional `FormUiControl` inputs the `Field` directive fills in,
 * which is what lets a dumb control render a real message without knowing why
 * the name is wrong. Before this it carried a reactive-forms `FormControl` with
 * its own validator, an `ngOnChanges` that reseeded it and a `statusChanges`
 * subscription — the last reactive-forms holdout in the app.
 *
 * The message is an `<ion-note>` of our own rather than `ion-input`'s
 * `errorText`: Ionic renders that only while the `ion-input` host carries
 * `ion-invalid ion-touched`, and those classes come exclusively from
 * `@ionic/angular`'s `ValueAccessor` — which needs an `NgControl` on the
 * `ion-input` itself. `[formField]` binds the custom control (this host), so no
 * accessor ever runs and the built-in slot stays empty. It is also the idiom the
 * seven `BaseModalDialog` dialogs already use.
 */
@Component({
  selector: 'app-item-name-input',
  templateUrl: './item-name-input.component.html',
  imports: [IonInput, IonItem, IonNote, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemNameInputComponent implements FormValueControl<string> {
  readonly value = model<string>('');
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);

  /**
   * Blur marks the bound field touched. Angular reaches a custom control's
   * touched state only through an output of exactly this name
   * (`listenToCustomControlOutput('touchedChange')`), so without it the field's
   * `touched` is a permanent lie — invisible today, wrong for anything later
   * keyed on it (`markAllAsTouched()`, a `provideSignalFormsConfig({classes})`).
   */
  readonly touchedChange = output<boolean>();

  // A duplicate is the more specific complaint, so it wins if a field reports
  // both; an unrecognised kind renders nothing rather than a raw key.
  readonly errorText = computed(() => {
    const kinds = this.errors().map(({ kind }) => kind);
    const kind = kinds.includes(DUPLICATE_NAME.kind)
      ? DUPLICATE_NAME.kind
      : kinds[0];
    return kind ? ERROR_TEXT[kind] : undefined;
  });

  protected onInput(event: InputCustomEvent): void {
    this.value.set(String(event.detail.value ?? ''));
  }
}
