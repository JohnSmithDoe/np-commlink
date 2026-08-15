import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COMMON_TEST_PROVIDERS } from '../../testing/test-providers';
import { EMOJI_GROUP_IDS } from '../../util/emoji/emoji.catalog';
import { EmojiPickerComponent } from './emoji-picker.component';

describe('EmojiPickerComponent', () => {
  let fixture: ComponentFixture<EmojiPickerComponent>;
  let component: EmojiPickerComponent;

  type Internals = {
    visible: () => readonly { glyph: string }[];
    query: { set: (value: string) => void };
    activeGroup: { set: (value: (typeof EMOJI_GROUP_IDS)[number]) => void };
    pick: (glyph: string) => Promise<void>;
    backspace: () => Promise<void>;
    presented: () => Promise<void>;
    text: () => string;
  };
  const internals = () => component as unknown as Internals;

  const open = async () => {
    fixture.componentRef.setInput('isOpen', true);
    await fixture.whenStable();
  };

  const openOver = async (value: string) => {
    const native = document.createElement('input');
    native.value = value;
    fixture.componentRef.setInput('field', {
      getInputElement: () => Promise.resolve(native),
    });
    await open();
    await internals().presented();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EmojiPickerComponent],
      providers: COMMON_TEST_PROVIDERS,
    });
    TestBed.overrideComponent(EmojiPickerComponent, { set: { template: '' } });
    fixture = TestBed.createComponent(EmojiPickerComponent);
    component = fixture.componentInstance;
  });

  it('loads nothing until it is opened', () => {
    expect(internals().visible()).toEqual([]);
  });

  it('shows the active group once open', async () => {
    await open();

    expect(internals().visible().length).toBeGreaterThan(100);
    expect(internals().visible()[0]?.glyph).toBe('😀');
  });

  it('switches the grid with the segment', async () => {
    await open();
    internals().activeGroup.set('food');

    expect(internals().visible()[0]?.glyph).toBe('🍇');
  });

  it('searches across groups, ignoring the segment', async () => {
    await open();
    internals().activeGroup.set('symbols');
    internals().query.set('milch');

    expect(
      internals()
        .visible()
        .map((entry) => entry.glyph)
    ).toContain('🥛');
  });

  it('reports an empty result rather than falling back to a group', async () => {
    await open();
    internals().query.set('zzzznothing');

    expect(internals().visible()).toEqual([]);
  });

  it('takes its text off the field it is attached to', async () => {
    await openOver('Vollmilch');
    const changed = vi.fn();
    component.changed.subscribe(changed);

    await internals().pick('🥛');

    expect(changed).toHaveBeenCalledWith('Vollmilch🥛');
  });

  it('clears the query on the next open, not on the pick', async () => {
    await open();
    internals().query.set('milch');

    await internals().pick('🥛');
    expect(
      internals()
        .visible()
        .map((entry) => entry.glyph)
    ).toContain('🥛');

    fixture.componentRef.setInput('isOpen', false);
    await open();

    expect(internals().visible()[0]?.glyph).toBe('😀');
  });

  it('keeps the catalog through a close, so the dismiss shows no empty grid', async () => {
    await open();
    expect(internals().visible().length).toBeGreaterThan(100);

    fixture.componentRef.setInput('isOpen', false);
    await fixture.whenStable();

    expect(internals().visible().length).toBeGreaterThan(100);
  });

  it('stays open across picks, and lands them in order', async () => {
    await openOver('Milch');
    const closed = vi.fn();
    component.closed.subscribe(closed);

    await internals().pick('🥛');
    await internals().pick('🍞');

    expect(internals().text()).toBe('Milch🥛🍞');
    expect(closed).not.toHaveBeenCalled();
  });

  describe('backspace', () => {
    it('takes the whole emoji before the caret', async () => {
      await openOver('Milch👨‍👩‍👧');

      await internals().backspace();

      expect(internals().text()).toBe('Milch');
    });

    it('does nothing when there is nothing to delete', async () => {
      await openOver('');

      await internals().backspace();

      expect(internals().text()).toBe('');
    });
  });
});
