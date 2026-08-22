/* ─── why ─────────────────────────────────────────────────────────
 * A note's pictures live under one storage key EACH and never inside the
 * notes slice. The editor has no save button, so every keystroke is a
 * candidate write, and a slice is serialised whole — a body typed under ten
 * photos rewrote megabytes every 400 ms. The slice now holds ids, which is
 * text, and a picture is written once when it arrives.
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

import { inject, Injectable, signal } from '@angular/core';
import { DatabaseService } from '../../@shared/data/persistence/database.service';
import { NoteImage, NoteImageId } from '../model/notes.types';

export const NOTE_IMAGE_KEY_PREFIX = 'note-image:';

const keyOf = (id: NoteImageId): string => `${NOTE_IMAGE_KEY_PREFIX}${id}`;

const without = (
  urls: Record<NoteImageId, string>,
  dropped: readonly NoteImageId[]
): Record<NoteImageId, string> =>
  Object.fromEntries(
    Object.entries(urls).filter(([id]) => !dropped.includes(id))
  );

@Injectable({ providedIn: 'root' })
export class NoteImageStore {
  readonly #database = inject(DatabaseService);
  readonly #urls = signal<Record<NoteImageId, string>>({});

  #hydrated?: Promise<void>;

  readonly urls = this.#urls.asReadonly();

  hydrate(): Promise<void> {
    return (this.#hydrated ??= this.#readAll());
  }

  urlOf(id: NoteImageId): string | undefined {
    return this.#urls()[id];
  }

  async put(id: NoteImageId, dataUrl: string): Promise<void> {
    this.#urls.update((urls) => ({ ...urls, [id]: dataUrl }));
    await this.#database.save<NoteImage>(keyOf(id), { id, dataUrl });
  }

  async drop(ids: readonly NoteImageId[]): Promise<void> {
    if (ids.length === 0) return;
    this.#urls.update((urls) => without(urls, ids));
    await Promise.all(ids.map((id) => this.#database.remove(keyOf(id))));
  }

  async collect(referenced: ReadonlySet<NoteImageId>): Promise<void> {
    await this.hydrate();
    await this.drop(
      Object.keys(this.#urls()).filter((id) => !referenced.has(id))
    );
  }

  async #readAll(): Promise<void> {
    try {
      const stored = await this.#database.loadPrefixed<NoteImage>(
        NOTE_IMAGE_KEY_PREFIX
      );
      this.#urls.set(
        Object.fromEntries(stored.map(({ id, dataUrl }) => [id, dataUrl]))
      );
    } catch {
      this.#urls.set({});
    }
  }
}
