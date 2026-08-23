import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { provideTestingProviders } from '../../@shared/testing/test-providers';
import { Note } from '../model/notes.types';
import { mockNote, mockNotesState } from '../testing/notes.test-data';
import { NotesActions } from './notes.actions';
import { NotesListPageFacade } from './notes-list-page.facade';

describe('NotesListPageFacade', () => {
  let facade: NotesListPageFacade;

  const setup = (notes: Note[]) => {
    TestBed.configureTestingModule({
      providers: [provideTestingProviders({ notes: mockNotesState(notes) })],
    });
    facade = TestBed.inject(NotesListPageFacade);
  };

  const pinned = mockNote({ id: 'a', name: 'Angeheftet', pinned: true });
  const other = mockNote({ id: 'b', name: 'Zuerst' });

  it('names both sections while both sides carry notes', () => {
    setup([pinned, other]);

    expect(facade.sections().map((section) => section.id)).toEqual([
      'pinned',
      'others',
    ]);
  });

  it('drops the side that is empty rather than sending an empty section', () => {
    setup([other]);

    expect(facade.sections().map((section) => section.id)).toEqual(['others']);
  });

  it('offers no section at all for an empty list', () => {
    setup([]);

    expect(facade.sections()).toEqual([]);
  });

  it('spans both sections in the items the empty state answers for', () => {
    setup([pinned, other]);

    expect(facade.items().map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('maps the section it was dragged in onto the pinned flag', () => {
    setup([pinned, other]);
    const dispatch = vi.spyOn(TestBed.inject(MockStore), 'dispatch');

    facade.reorder(['b', 'a'], 'pinned');
    facade.reorder(['d', 'c'], 'others');

    expect(dispatch).toHaveBeenCalledWith(
      NotesActions.reorderSection(true, ['b', 'a'])
    );
    expect(dispatch).toHaveBeenCalledWith(
      NotesActions.reorderSection(false, ['d', 'c'])
    );
  });

  it('offers no sort, so the shared toolbar never renders', () => {
    setup([pinned, other]);
    const dispatch = vi.spyOn(TestBed.inject(MockStore), 'dispatch');

    facade.setSortMode('name');

    expect(facade.hasToolbar()).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
