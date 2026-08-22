import { TestBed } from '@angular/core/testing';
import { DatabaseService } from '../../@shared/data/persistence/database.service';
import { NoteImage } from '../model/notes.types';
import { NOTE_IMAGE_KEY_PREFIX, NoteImageStore } from './note-image.store';

describe('NoteImageStore', () => {
  let store: NoteImageStore;
  let database: {
    loadPrefixed: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  const setup = (stored: NoteImage[] = []) => {
    database = {
      loadPrefixed: vi.fn().mockResolvedValue(stored),
      save: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: DatabaseService, useValue: database }],
    });
    store = TestBed.inject(NoteImageStore);
  };

  it('reads every picture under its own key, once', async () => {
    setup([{ id: 'img-1', dataUrl: 'data:a' }]);

    await store.hydrate();
    await store.hydrate();

    expect(database.loadPrefixed).toHaveBeenCalledExactlyOnceWith(
      NOTE_IMAGE_KEY_PREFIX
    );
    expect(store.urlOf('img-1')).toBe('data:a');
  });

  it('writes one key per picture, so a note is text on disk', async () => {
    setup();

    await store.put('img-1', 'data:a');

    expect(database.save).toHaveBeenCalledWith('note-image:img-1', {
      id: 'img-1',
      dataUrl: 'data:a',
    });
    expect(store.urls()).toEqual({ 'img-1': 'data:a' });
  });

  it('drops what it is told to drop, from disk and from memory', async () => {
    setup([{ id: 'img-1', dataUrl: 'data:a' }]);
    await store.hydrate();

    await store.drop(['img-1']);

    expect(database.remove).toHaveBeenCalledWith('note-image:img-1');
    expect(store.urlOf('img-1')).toBeUndefined();
  });

  it('collects the pictures no surviving note refers to, and only those', async () => {
    setup([
      { id: 'kept', dataUrl: 'data:a' },
      { id: 'orphan', dataUrl: 'data:b' },
    ]);

    await store.collect(new Set(['kept']));

    expect(database.remove).toHaveBeenCalledExactlyOnceWith(
      'note-image:orphan'
    );
    expect(store.urlOf('kept')).toBe('data:a');
  });

  it('comes up empty rather than throwing when storage refuses to read', async () => {
    setup();
    database.loadPrefixed.mockRejectedValue(new Error('no storage'));

    await store.hydrate();

    expect(store.urls()).toEqual({});
  });
});
