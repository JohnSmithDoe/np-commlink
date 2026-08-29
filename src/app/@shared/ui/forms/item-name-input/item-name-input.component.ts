/* ─── why ─────────────────────────────────────────────────────────
 * `touched` and `dirty` are not state this component keeps — declaring the
 * inputs is what makes the `FormField` directive push the bound field's
 * state in. Both are needed: touched alone is the usual gate, but this
 * dialog is a single box on a phone, focused on present and saved from the
 * toolbar, so the field can be typed into and never blurred — and a
 * duplicate name would refuse to save without ever saying why. Dirty makes
 * the first keystroke enough.
 * ───────────────────────────────────────────────────────────────── */
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
import { Marker } from '../../../model/app.types';
import { RECENT_EMOJIS } from '../../../util/emoji/recent-emojis.token';
import { BLANK_TEXT, DUPLICATE_NAME } from '../../../util/forms/form-rules';
import { EmojiPickerComponent } from '../../emoji-picker/emoji-picker.component';

const ERROR_TEXT: Readonly<Partial<Record<string, Marker>>> = {
  [DUPLICATE_NAME.kind]: marker('edit.item.dialog.name.duplicate.error'),
  [BLANK_TEXT.kind]: marker('edit.item.dialog.name.empty.error'),
};

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
  readonly value = model<string>('');
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  readonly touched = input(false);
  readonly dirty = input(false);

  protected readonly recentEmojis = inject(RECENT_EMOJIS);
  protected readonly pickerOpen = signal(false);

  protected readonly offersEmojiPicker = inject(Platform).is('desktop');
  protected readonly input = viewChild(IonInput);

  constructor() {
    addIcons({ happyOutline });
  }

  readonly touchedChange = output<boolean>();
  readonly submitted = output<void>();

  readonly errorText = computed(() => {
    if (!this.touched() && !this.dirty()) {
      return;
    }
    const kinds = this.errors().map(({ kind }) => kind);
    const kind = kinds.includes(DUPLICATE_NAME.kind)
      ? DUPLICATE_NAME.kind
      : kinds[0];
    return kind ? ERROR_TEXT[kind] : undefined;
  });

  focus(): void {
    void this.input()?.setFocus();
  }

  protected submit(): void {
    this.touchedChange.emit(true);
    this.submitted.emit();
  }

  protected onInput(event: InputCustomEvent): void {
    this.value.set(String(event.detail.value ?? ''));
  }
}
