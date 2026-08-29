/* ─── why ─────────────────────────────────────────────────────────
 * The viewer is driven by the note ID rather than by a copy of its
 * images: rotating writes a new note into the store, and a snapshot
 * taken when the swipe fired would keep showing the old picture.
 * ───────────────────────────────────────────────────────────────── */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { IonNote, IonThumbnail } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  addOutline,
  expandOutline,
  pinOutline,
  removeOutline,
} from 'ionicons/icons';
import { ListPageComponent } from '../../../@shared/feature/item-lists/list-page/list-page.component';
import { ListItemComponent } from '../../../@shared/ui/base-item/list-item/list-item.component';
import { StartSwipeAction } from '../../../@shared/ui/base-item/base-swipe-row';
import { LIST_FACADE } from '../../../@shared/util/item-lists/list-page.facade';
import { NotesListPageFacade } from '../../data';
import { Note, NoteImageId } from '../../model/notes.types';
import { noteSnippet, resolveImages } from '../../util/notes.utils';
import { NoteImageViewerComponent } from '../../ui/note-image-viewer/note-image-viewer.component';

const VIEW_IMAGES_SWIPE: StartSwipeAction = {
  labelKey: marker('notes.action.view-images'),
  icon: 'expand-outline',
  color: 'secondary',
};

@Component({
  selector: 'app-page-notes',
  templateUrl: 'notes.page.html',
  styleUrls: ['notes.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,
    IonNote,
    IonThumbnail,
    ListPageComponent,
    ListItemComponent,
    NoteImageViewerComponent,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: NotesListPageFacade }],
})
export class NotesPage {
  readonly facade = inject(NotesListPageFacade);

  readonly viewImagesSwipe = VIEW_IMAGES_SWIPE;

  readonly viewedNoteId = signal<string | undefined>(undefined);

  readonly viewedImages = computed(() => {
    const id = this.viewedNoteId();
    const found = this.facade.items().find((note) => note.id === id);
    return resolveImages(found?.images, this.facade.imageUrls());
  });

  readonly openAt = computed(() =>
    this.viewedImages().length > 0 ? 0 : undefined
  );

  constructor() {
    addIcons({ addOutline, expandOutline, pinOutline, removeOutline });
  }

  snippet(note: Note): string {
    return noteSnippet(note.body);
  }

  swipeActionFor(note: Note): StartSwipeAction | undefined {
    return note.images?.length ? this.viewImagesSwipe : undefined;
  }

  viewImages(note: Note): void {
    this.viewedNoteId.set(note.id);
  }

  rotateImage(imageId: NoteImageId): void {
    this.facade.rotateImage(imageId);
  }
}
