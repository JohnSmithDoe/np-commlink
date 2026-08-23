import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MockStore } from '@ngrx/store/testing';
import { mockRouterState } from '../../@shared/testing/test-data';
import { provideTestingProviders } from '../../@shared/testing/test-providers';
import { Note } from '../model/notes.types';
import { mockNote, mockNotesState } from '../testing/notes.test-data';
import { NoteEditorFacade } from './note-editor.facade';
import { NotesActions } from './notes.actions';

describe('NoteEditorFacade', () => {
  let facade: NoteEditorFacade;
  let dispatch: ReturnType<typeof vi.spyOn>;

  const setup = (note: Note = mockNote()) => {
    TestBed.configureTestingModule({
      providers: [
        provideTestingProviders({
          notes: mockNotesState([note]),
          router: mockRouterState({ parameters: { id: note.id } }),
        }),
      ],
    });
    dispatch = vi.spyOn(TestBed.inject(MockStore), 'dispatch');
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    facade = TestBed.inject(NoteEditorFacade);
  };

  type UpdateAction = ReturnType<typeof NotesActions.updateItem>;

  const lastUpdate = (): UpdateAction | undefined =>
    (dispatch.mock.calls as UpdateAction[][])
      .map(([action]) => action)
      .findLast((action) => action.type === NotesActions.updateItem.type);

  it('writes nothing until the edit is flushed', () => {
    setup();

    facade.edit({ body: 'Milch' });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('collapses several edits into one write', () => {
    setup();

    facade.edit({ name: 'Markt' });
    facade.edit({ body: 'Milch' });
    facade.flush();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(lastUpdate()?.item).toMatchObject({
      id: 'note-1',
      name: 'Markt',
      body: 'Milch',
    });
  });

  it('has nothing left to write after a flush', () => {
    setup();

    facade.edit({ body: 'Milch' });
    facade.flush();
    facade.flush();

    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it('stamps every write, so the list can sort by last edited', () => {
    setup();

    facade.edit({ body: 'Milch' });
    facade.flush();

    expect(lastUpdate()?.item.updatedAt).toBeDefined();
  });

  it('appends an image as an id, and never as bytes in the slice', () => {
    setup(mockNote({ images: ['img-1'] }));

    facade.addImage('data:b');

    type AddAction = ReturnType<typeof NotesActions.addImage>;
    const added = (dispatch.mock.calls as AddAction[][])
      .map(([action]) => action)
      .findLast((action) => action.type === NotesActions.addImage.type);

    expect(added).toMatchObject({ noteId: 'note-1', dataUrl: 'data:b' });
    expect(added?.imageId).toBeTruthy();
    expect(lastUpdate()).toBeUndefined();
  });

  it('discards a note left blank, without offering an undo', () => {
    setup(mockNote({ name: '' }));

    facade.leave('note-1');

    expect(dispatch).toHaveBeenCalledWith(NotesActions.discardBlank('note-1'));
  });

  it('keeps a note that carries only an image', () => {
    setup(mockNote({ name: '', images: ['img-1'] }));

    facade.leave('note-1');

    expect(dispatch).not.toHaveBeenCalledWith(
      NotesActions.discardBlank('note-1')
    );
  });

  it('drops a pending edit when the note is deleted outright', () => {
    setup();

    facade.edit({ body: 'Milch' });
    facade.removeNote();
    facade.flush();

    expect(dispatch).toHaveBeenCalledWith(NotesActions.removeItem(mockNote()));
    expect(lastUpdate()).toBeUndefined();
  });

  it('leaves no back-tap to the deleted note', () => {
    setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');

    facade.removeNote();

    expect(navigate).toHaveBeenCalledWith(['/notes'], { replaceUrl: true });
  });
});
