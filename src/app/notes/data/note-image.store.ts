/* ─── why ─────────────────────────────────────────────────────────
 * A note's pictures live under one storage key EACH and never inside the
 * notes slice. The editor has no save button, so every keystroke is a
 * candidate write, and a slice is serialised whole — a body typed under ten
 * photos rewrote megabytes every 400 ms. The slice now holds ids, which is
 * text, and a picture is written once when it arrives, its list thumbnail
 * beside it in the same record.
 *
 * The read-before-write guard the slices carry has nothing to protect here:
 * a blob is addressed by an id nothing else can mint, so a write cannot
 * clobber a document that has not been read yet.
 *
 * Deletion is asymmetric on purpose. Removing ONE image drops its blob at
 * once, because the user asked for exactly that. Deleting a whole NOTE does
 * not: the undo toast can bring it back, so those blobs are collected at the
 * next hydrate instead, when the notes that survived are known.
 * ───────────────────────────────────────────────────────────────── */

import { computed, inject, signal, Service } from '@angular/core';
import { DatabaseService } from '../../@shared/data/persistence/database.service';
import { NoteImage, NoteImageId, NotePicture } from '../model/notes.types';

export const NOTE_IMAGE_KEY_PREFIX = 'note-image:';

const keyOf = (id: NoteImageId): string => `${NOTE_IMAGE_KEY_PREFIX}${id}`;

const without = (
  urls: Record<NoteImageId, string>,
  dropped: readonly NoteImageId[]
): Record<NoteImageId, string> => {
  return Object.fromEntries(
    Object.entries(urls).filter(([id]) => !dropped.includes(id))
  );
};

@Service()
export class NoteImageStore {
  readonly #database = inject(DatabaseService);
  readonly #urls = signal<Record<NoteImageId, string>>({});
  readonly #thumbs = signal<Record<NoteImageId, string>>({});

  #hydrated?: Promise<void>;

  readonly urls = this.#urls.asReadonly();
  readonly thumbUrls = computed(() => ({ ...this.#urls(), ...this.#thumbs() }));

  async #readAll(): Promise<void> {
    try {
      const stored = await this.#database.loadPrefixed<NoteImage>(
        NOTE_IMAGE_KEY_PREFIX
      );
      this.#urls.set(
        Object.fromEntries(stored.map(({ id, dataUrl }) => [id, dataUrl]))
      );
      this.#thumbs.set(
        Object.fromEntries(
          stored.flatMap(({ id, thumbUrl }) =>
            thumbUrl ? [[id, thumbUrl]] : []
          )
        )
      );
    } catch {
      this.#urls.set({});
      this.#thumbs.set({});
    }
  }

  hydrate(): Promise<void> {
    return (this.#hydrated ??= this.#readAll());
  }

  urlOf(id: NoteImageId): string | undefined {
    return this.#urls()[id];
  }

  async put(id: NoteImageId, picture: NotePicture): Promise<void> {
    this.#urls.update((urls) => ({ ...urls, [id]: picture.dataUrl }));
    this.#thumbs.update((thumbs) => {
      return picture.thumbUrl
        ? { ...thumbs, [id]: picture.thumbUrl }
        : without(thumbs, [id]);
    });
    await this.#database.save<NoteImage>(keyOf(id), { id, ...picture });
  }

  async drop(ids: readonly NoteImageId[]): Promise<void> {
    if (ids.length === 0) return;
    this.#urls.update((urls) => without(urls, ids));
    this.#thumbs.update((thumbs) => without(thumbs, ids));
    await Promise.all(ids.map((id) => this.#database.remove(keyOf(id))));
  }

  async collect(referenced: ReadonlySet<NoteImageId>): Promise<void> {
    await this.hydrate();
    await this.drop(
      Object.keys(this.#urls()).filter((id) => !referenced.has(id))
    );
  }
}
