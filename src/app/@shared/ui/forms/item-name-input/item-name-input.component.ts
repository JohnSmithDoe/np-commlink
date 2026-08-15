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

  protected readonly recentEmojis = inject(RECENT_EMOJIS);
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
}
