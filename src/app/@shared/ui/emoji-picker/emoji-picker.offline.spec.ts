/* ─── why ─────────────────────────────────────────────────────────
 * The claim under test is one line of Angular semantics: `value()` THROWS
 * in the error state (v21), so `visible()` must never read it unguarded or
 * a chunk that will not load takes the render down instead of showing a
 * message.
 *
 * The failure is induced through `APP_LANGUAGE` because the obvious lever
 * is unavailable: `vi.mock` on a relative import is rejected outright by
 * the Angular unit-test builder. A language with no entry in
 * `DATA_BY_LANGUAGE` fails the loader exactly where an absent chunk does —
 * inside `loadEmojiCatalog`, before any catalog exists.
 *
 * A file of its own so the token override cannot reach the main spec.
 * ───────────────────────────────────────────────────────────────── */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Language } from '../../model/app.types';
import { COMMON_TEST_PROVIDERS } from '../../testing/test-providers';
import { APP_LANGUAGE } from '../../util/theme/language.boot';
import { EmojiPickerComponent } from './emoji-picker.component';

describe('EmojiPickerComponent, catalog unavailable', () => {
  let fixture: ComponentFixture<EmojiPickerComponent>;
  let component: EmojiPickerComponent;

  type Internals = {
    visible: () => readonly { glyph: string }[];
    failed: () => boolean;
    isLoading: () => boolean;
  };
  const internals = () => component as unknown as Internals;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [EmojiPickerComponent],
      providers: [
        ...COMMON_TEST_PROVIDERS,
        { provide: APP_LANGUAGE, useValue: 'no-such-language' as Language },
      ],
    });
    TestBed.overrideComponent(EmojiPickerComponent, { set: { template: '' } });
    fixture = TestBed.createComponent(EmojiPickerComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('isOpen', true);
    await fixture.whenStable();
  });

  it('reports an empty grid rather than throwing out of the render', () => {
    expect(() => internals().visible()).not.toThrow();
    expect(internals().visible()).toEqual([]);
  });

  it('says it failed, so the template can offer a retry', () => {
    expect(internals().failed()).toBe(true);
    expect(internals().isLoading()).toBe(false);
  });
});
