/* ─── why ─────────────────────────────────────────────────────────
 * `openAt` is the whole open/closed state AND the starting page, in one
 * input: a separate `isOpen` would let the two disagree, and the one
 * combination that produces is "open, showing nothing". `undefined` is
 * closed, and every caller already has the index it wants to open on.
 * ───────────────────────────────────────────────────────────────── */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  chevronForwardOutline,
  closeOutline,
  syncOutline,
} from 'ionicons/icons';
import { NoteImage, NoteImageId } from '../../model/notes.types';

@Component({
  selector: 'app-note-image-viewer',
  templateUrl: './note-image-viewer.component.html',
  styleUrls: ['./note-image-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonModal,
    IonHeader,
    IonFooter,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    TranslatePipe,
  ],
})
export class NoteImageViewerComponent {
  readonly images = input<readonly NoteImage[]>([]);
  readonly openAt = input<number | undefined>(undefined);

  readonly rotate = output<NoteImageId>();
  readonly dismiss = output<void>();

  readonly isOpen = computed(() => this.openAt() !== undefined);

  readonly index = linkedSignal(() => this.openAt() ?? 0);
  readonly current = computed(() => this.images()[this.index()]);
  readonly hasPages = computed(() => this.images().length > 1);

  constructor() {
    addIcons({
      chevronBackOutline,
      chevronForwardOutline,
      closeOutline,
      syncOutline,
    });
  }

  step(by: number): void {
    const count = this.images().length;
    if (count > 0) this.index.update((at) => (at + by + count) % count);
  }

  rotateCurrent(): void {
    const image = this.current();
    if (image) this.rotate.emit(image.id);
  }
}
