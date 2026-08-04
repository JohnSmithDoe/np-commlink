import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { RECENT_EMOJIS } from '../../../@shared/util/emoji/recent-emojis.token';
import { mockSettingsState } from '../../testing/settings.test-data';
import { recentEmojisProvider } from './settings.providers';

const publish = (recentEmojis: string[]) => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideMockStore({
        initialState: { settings: mockSettingsState({ recentEmojis }) },
      }),
      recentEmojisProvider,
    ],
  });
  return {
    recents: TestBed.inject(RECENT_EMOJIS),
    store: TestBed.inject(MockStore),
  };
};

describe('recentEmojisProvider', () => {
  it('publishes the slice’s recents behind the kernel token', () => {
    expect(publish(['🥛', '🍞']).recents()).toEqual(['🥛', '🍞']);
  });

  it('follows the slice when another emoji is remembered', () => {
    const { recents, store } = publish(['🥛']);

    store.setState({
      settings: mockSettingsState({ recentEmojis: ['🍞', '🥛'] }),
    });

    expect(recents()).toEqual(['🍞', '🥛']);
  });
});
