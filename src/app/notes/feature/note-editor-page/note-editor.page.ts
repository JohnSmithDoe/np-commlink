/* ─── why ─────────────────────────────────────────────────────────
 * `leave()` runs on destroy rather than on an Ionic lifecycle hook: the
 * outlet keeps a visited page mounted, so `ionViewWillLeave` is the only
 * one that fires on a back-navigation — and it does not fire at all when
 * the route is replaced from elsewhere. Destroy covers both, and the
 * facade's flush is idempotent.
 *
 * The price is that the ROUTE has already moved on by then, so `note()`
 * is undefined and the id has to be captured on the way in.
 * ───────────────────────────────────────────────────────────────── */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import {
  AlertButton,
  InputCustomEvent,
  IonAlert,
  IonButton,
  IonButtons,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonTextarea,
  TextareaCustomEvent,
} from '@ionic/angular/standalone';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  closeCircle,
  documentTextOutline,
  pin,
  pinOutline,
  trashOutline,
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { NoteEditorFacade } from '../../data';
import { NoteImageId } from '../../model/notes.types';
import { NoteImageInputComponent } from '../../smart-ui/note-image-input/note-image-input.component';
import { NoteImageViewerComponent } from '../../ui/note-image-viewer/note-image-viewer.component';

@Component({
  selector: 'app-page-note-editor',
  templateUrl: 'note-editor.page.html',
  styleUrls: ['note-editor.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,
    IonContent,
    IonItem,
    IonInput,
    IonTextarea,
    IonButton,
    IonButtons,
    IonIcon,
    IonAlert,
    PageHeaderComponent,
    NoteImageInputComponent,
    NoteImageViewerComponent,
  ],
})
export class NoteEditorPage implements OnDestroy {
  readonly #facade = inject(NoteEditorFacade);
  readonly #translate = inject(TranslateService);

  readonly note = this.#facade.note;
  readonly images = computed(() => this.note()?.images ?? []);
  readonly openAt = signal<number | undefined>(undefined);

  readonly #noteId = this.note()?.id;

  readonly deleteAlertButtons: AlertButton[] = [
    {
      text: this.#translate.instant(marker('notes.action.cancel')),
      role: 'cancel',
    },
    {
      text: this.#translate.instant(marker('notes.action.delete')),
      role: 'destructive',
      handler: () => this.#facade.removeNote(),
    },
  ];

  constructor() {
    addIcons({
      closeCircle,
      documentTextOutline,
      pin,
      pinOutline,
      trashOutline,
    });
  }

  ngOnDestroy(): void {
    if (this.#noteId) this.#facade.leave(this.#noteId);
  }

  editTitle(event: InputCustomEvent): void {
    this.#facade.edit({ name: event.detail.value ?? '' });
  }

  editBody(event: TextareaCustomEvent): void {
    this.#facade.edit({ body: event.detail.value ?? '' });
  }

  togglePin(): void {
    this.#facade.togglePin();
  }

  removeImage(imageId: NoteImageId): void {
    this.openAt.set(undefined);
    this.#facade.removeImage(imageId);
  }

  rotateImage(imageId: NoteImageId): void {
    this.#facade.rotateImage(imageId);
  }
}
