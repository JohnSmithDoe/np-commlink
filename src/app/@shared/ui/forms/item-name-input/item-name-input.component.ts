import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormValueControl, ValidationError } from '@angular/forms/signals';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import {
  InputCustomEvent,
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonNote,
  Platform,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { happyOutline } from 'ionicons/icons';
import { TMarker } from '../../../model/app.types';
import { EmojiRecentsService } from '../../../util/emoji/emoji-recents.service';
import { insertAt } from '../../../util/emoji/emoji-text.utils';
import { BLANK_TEXT, DUPLICATE_NAME } from '../../../util/forms/form-rules';
import { EmojiPickerComponent } from '../../emoji-picker/emoji-picker.component';

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
  imports: [
    IonButton,
    IonIcon,
    IonInput,
    IonItem,
    IonNote,
    TranslatePipe,
    EmojiPickerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemNameInputComponent implements FormValueControl<string> {
  readonly #emojiRecents = inject(EmojiRecentsService);

  readonly value = model<string>('');
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);

  protected readonly recentEmojis = this.#emojiRecents.recent;
  protected readonly pickerOpen = signal(false);

  /**
   * Desktop only — every mobile keyboard already has an emoji picker, and ours
   * would be a second, worse one that also costs a lazy chunk to open.
   *
   * `Platform.is('desktop')` rather than `Capacitor.isNativePlatform()`, which
   * the camera-scanner and status-bar gates use: those ask "can this device do
   * the thing at all", and native is exactly that question. This one asks "does
   * the user already have a better way", and the PWA on a phone is not native
   * yet still has the OS keyboard. A plain field, not a signal: a platform does
   * not change mid-session.
   */
  protected readonly offersEmojiPicker = inject(Platform).is('desktop');
  // viewChild can't sit on an ES-private (#) field (NG1053); protected readonly,
  // matching the categories-dialog convention.
  protected readonly input = viewChild(IonInput);

  constructor() {
    addIcons({ happyOutline });
  }

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

  /**
   * The caret has to come off the native element — `ion-input` is a Stencil
   * host with no selection API of its own — and it is absent whenever the field
   * was never focused, which is exactly when appending is right.
   *
   * Writing through `value` rather than the DOM is what keeps Signal Forms in
   * the loop: the bound field revalidates, so `requireUniqueName` sees the new
   * name.
   *
   * Advancing the selection without focusing is what makes `multiple` work: the
   * picker is still presented and owns focus, so the next pick has to find the
   * caret where this one left it rather than re-reading a stale position and
   * inserting the second glyph in front of the first.
   */
  protected async insertEmoji(glyph: string): Promise<void> {
    const current = this.value();
    const native = await this.input()?.getInputElement();
    const caret = native?.selectionStart ?? current.length;

    this.value.set(insertAt(current, glyph, caret));

    native?.setSelectionRange(caret + glyph.length, caret + glyph.length);
  }

  /**
   * Focus returns to the field only once the overlay is *gone* — `didDismiss`,
   * not the close click. An `ion-modal` traps focus while it is presented, so
   * focusing underneath it mid-dismissal races its own restore.
   */
  protected async onPickerDismissed(): Promise<void> {
    this.pickerOpen.set(false);
    await this.input()?.setFocus();
  }
}
