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
    pick: (glyph: string) => void;
  };
  const internals = () => component as unknown as Internals;

  const open = async () => {
    fixture.componentRef.setInput('isOpen', true);
    await fixture.whenStable();
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

  it('emits the picked glyph', async () => {
    await open();
    const picked = vi.fn();
    component.picked.subscribe(picked);

    internals().pick('🥛');

    expect(picked).toHaveBeenCalledWith('🥛');
  });

  it('clears the query on the next open, not on the pick', async () => {
    await open();
    internals().query.set('milch');

    internals().pick('🥛');
    expect(
      internals()
        .visible()
        .map((entry) => entry.glyph)
    ).toContain('🥛');

    fixture.componentRef.setInput('isOpen', false);
    await open();

    expect(internals().visible()[0]?.glyph).toBe('😀');
  });

  describe('mode', () => {
    it('closes on the first pick when single', async () => {
      await open();
      const closed = vi.fn();
      component.closed.subscribe(closed);

      internals().pick('🥛');

      expect(closed).toHaveBeenCalledTimes(1);
    });

    it('stays open across picks when multiple', async () => {
      fixture.componentRef.setInput('mode', 'multiple');
      await open();
      const closed = vi.fn();
      const picked = vi.fn();
      component.closed.subscribe(closed);
      component.picked.subscribe(picked);

      internals().pick('🥛');
      internals().pick('🍞');

      expect(picked).toHaveBeenCalledTimes(2);
      expect(closed).not.toHaveBeenCalled();
    });
  });
});
