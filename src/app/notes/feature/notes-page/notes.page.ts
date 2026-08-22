/* ─── why ─────────────────────────────────────────────────────────
 * The viewer is driven by the note ID rather than by a copy of its
 * images: rotating writes a new note into the store, and a snapshot
 * taken when the swipe fired would keep showing the old picture.
 *
 * Dragging is disabled while a search is armed. A reorder reports the
 * ids it can SEE, and the reducer writes them back over the whole
 * section — so a filtered drag would silently drop every note the query
 * hid. Nothing about the gesture could hint at that, so the handle goes
 * away instead.
 * ───────────────────────────────────────────────────────────────── */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import {
  IonContent,
  IonList,
  IonListHeader,
  IonNote,
  IonReorderGroup,
  IonThumbnail,
  ReorderEndCustomEvent,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, documentTextOutline, expand, pin, remove } from 'ionicons/icons';
import { ItemListEmptyComponent } from '../../../@shared/ui/base-item/item-list-empty/item-list-empty.component';
import { ItemListSearchbarComponent } from '../../../@shared/ui/base-item/item-list-searchbar/item-list-searchbar.component';
import { ListItemComponent } from '../../../@shared/ui/base-item/list-item/list-item.component';
import { StartSwipeAction } from '../../../@shared/ui/base-item/base-swipe-row';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { reorderedIds } from '../../../@shared/util/app.utils';
import { NotesListPageFacade } from '../../data';
import { Note, NoteImageId } from '../../model/notes.types';
import { noteSnippet } from '../../util/notes.utils';
import { NoteImageViewerComponent } from '../../ui/note-image-viewer/note-image-viewer.component';

const VIEW_IMAGES_SWIPE: StartSwipeAction = {
  labelKey: marker('notes.action.view-images'),
  icon: 'expand',
  color: 'secondary',
};

@Component({
  selector: 'app-page-notes',
  templateUrl: 'notes.page.html',
  styleUrls: ['notes.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    TranslatePipe,
    IonContent,
    IonList,
    IonListHeader,
    IonNote,
    IonReorderGroup,
    IonThumbnail,
    PageHeaderComponent,
    ItemListSearchbarComponent,
    ItemListEmptyComponent,
    ListItemComponent,
    NoteImageViewerComponent,
  ],
})
export class NotesPage {
  readonly facade = inject(NotesListPageFacade);

  readonly viewImagesSwipe = VIEW_IMAGES_SWIPE;

  readonly isSearching = computed(() => !!this.facade.searchResult());
  readonly isEmpty = computed(
    () => this.facade.pinned().length + this.facade.unpinned().length === 0
  );

  readonly viewedNoteId = signal<string | undefined>(undefined);

  readonly viewedImages = computed(() => {
    const id = this.viewedNoteId();
    const found = [...this.facade.pinned(), ...this.facade.unpinned()].find(
      (note) => note.id === id
    );
    return found?.images ?? [];
  });

  readonly openAt = computed(() =>
    this.viewedImages().length > 0 ? 0 : undefined
  );

  constructor() {
    addIcons({ add, documentTextOutline, expand, pin, remove });
  }

  snippet(note: Note): string {
    return noteSnippet(note.body);
  }

  swipeActionFor(note: Note): StartSwipeAction | undefined {
    return note.images?.length ? this.viewImagesSwipe : undefined;
  }

  reorder(event: ReorderEndCustomEvent, pinned: boolean): void {
    const section = pinned ? this.facade.pinned() : this.facade.unpinned();
    this.facade.reorderSection(pinned, reorderedIds(event, section));
  }

  viewImages(note: Note): void {
    this.viewedNoteId.set(note.id);
  }

  rotateImage(imageId: NoteImageId): void {
    const noteId = this.viewedNoteId();
    if (noteId) this.facade.rotateImage(noteId, imageId);
  }
}
