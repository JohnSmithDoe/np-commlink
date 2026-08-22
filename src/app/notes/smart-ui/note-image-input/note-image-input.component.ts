import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { imageOutline } from 'ionicons/icons';
import { NoteEditorFacade } from '../../data';
import { readNoteImage } from '../../util/notes.utils';

@Component({
  selector: 'app-note-image-input',
  templateUrl: './note-image-input.component.html',
  styleUrls: ['./note-image-input.component.scss'],
  imports: [TranslatePipe, IonButton, IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteImageInputComponent {
  readonly #facade = inject(NoteEditorFacade);

  constructor() {
    addIcons({ imageOutline });
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';

    const image = await readNoteImage(file);
    if (image) this.#facade.addImage(image);
    else this.#facade.reportUploadFailure();
  }
}
