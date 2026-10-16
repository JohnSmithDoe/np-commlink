import { TestBed } from '@angular/core/testing';
import {
  providePersonEditor,
  provideTestingProviders,
} from '../../../@shared/testing/test-providers';
import { PersonEditor } from '../../../@shared/util/people/person-editor.token';
import {
  mockProfilesState,
  mockVitalsState,
} from '../../testing/vitals.test-data';
import { ProfilesPageFacade } from './profiles-page.facade';

describe('ProfilesPageFacade', () => {
  it('creates a person from the search term on enter, without leaving', () => {
    const editor: PersonEditor = { create: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideTestingProviders({
          vitals: mockVitalsState({
            profiles: mockProfilesState({ searchQuery: 'Ronja' }),
          }),
        }),
        providePersonEditor(editor),
      ],
    });

    TestBed.inject(ProfilesPageFacade).addItemFromSearch();

    expect(editor.create).toHaveBeenCalledWith('Ronja');
  });
});
