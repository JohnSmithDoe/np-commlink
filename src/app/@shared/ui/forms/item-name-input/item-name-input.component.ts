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
import { EmojiRecentsService } from '../../../util/emoji/emoji-recents.service';
import { insertAt } from '../../../util/emoji/emoji-text.utils';
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
  readonly #emojiRecents = inject(EmojiRecentsService);

  readonly value = model<string>('');
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);

  protected readonly recentEmojis = this.#emojiRecents.recent;
  protected readonly pickerOpen = signal(false);

  protected readonly offersEmojiPicker = inject(Platform).is('desktop');
  protected readonly input = viewChild(IonInput);

  constructor() {
    addIcons({ happyOutline });
  }

  readonly touchedChange = output<boolean>();

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

  protected async insertEmoji(glyph: string): Promise<void> {
    const current = this.value();
    const native = await this.input()?.getInputElement();
    const caret = native?.selectionStart ?? current.length;

    this.value.set(insertAt(current, glyph, caret));

    native?.setSelectionRange(caret + glyph.length, caret + glyph.length);
  }

  protected async onPickerDismissed(): Promise<void> {
    this.pickerOpen.set(false);
    await this.input()?.setFocus();
  }
}
