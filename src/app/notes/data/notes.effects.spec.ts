import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of, toArray } from 'rxjs';
import { Note, NOTES_LIST_ID, NotesState } from '../model/notes.types';
import { NoteImageStore } from './note-image.store';
import { NotesActions } from './notes.actions';
import { notesListEffects } from './notes.effects';

const note = (id: string, images?: string[]): Note => {
  return {
    id,
    name: id,
    images,
  };
};

const loadedWith = (...items: Note[]): Action => {
  const state: NotesState = { list: { id: NOTES_LIST_ID, items } };
  return NotesActions.loaded(state);
};

const drain = () => {
  const effect = TestBed.runInInjectionContext(() =>
    notesListEffects.collectImages$()
  );
  return firstValueFrom(effect.pipe(toArray()));
};

describe('notesListEffects.collectImages$', () => {
  let actions$: Observable<Action>;
  let collect: ReturnType<typeof vi.fn>;

  const setup = () => {
    collect = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideMockActions(() => actions$),
        provideMockStore(),
        { provide: NoteImageStore, useValue: { collect } },
      ],
    });
  };

  it('collects against exactly the images the loaded notes reference', async () => {
    setup();
    const referencing = [note('a', ['img-1', 'img-2']), note('c', ['img-3'])];
    actions$ = of(loadedWith(referencing[0], note('b'), referencing[1]));

    await drain();

    expect(collect).toHaveBeenCalledExactlyOnceWith(
      new Set(['img-1', 'img-2', 'img-3'])
    );
  });

  it('collects nothing after a failed read, so every stored image survives', async () => {
    setup();
    actions$ = of(NotesActions.loaded(null));

    await drain();

    expect(collect).not.toHaveBeenCalled();
  });

  it('keeps collecting on later loads after one collect rejected', async () => {
    setup();
    collect.mockRejectedValueOnce(new Error('storage unavailable'));
    const first = note('a', ['img-1']);
    const second = note('b', ['img-2']);
    actions$ = of(loadedWith(first), loadedWith(second));

    await drain();

    expect(collect).toHaveBeenLastCalledWith(new Set(['img-2']));
    expect(collect).toHaveBeenCalledTimes(2);
  });
});
