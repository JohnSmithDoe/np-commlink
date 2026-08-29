import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Platform } from '@ionic/angular/standalone';
import { provideTranslateService } from '@ngx-translate/core';
import { BLANK_TEXT, DUPLICATE_NAME } from '../../../util/forms/form-rules';
import { ItemNameInputComponent } from './item-name-input.component';

const createOn = (platform: string) => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [ItemNameInputComponent],
    providers: [
      provideTranslateService(),
      provideZonelessChangeDetection(),
      { provide: Platform, useValue: { is: (p: string) => p === platform } },
    ],
  });
  return TestBed.createComponent(ItemNameInputComponent).componentInstance;
};

const offersPicker = (component: ItemNameInputComponent) =>
  (component as unknown as { offersEmojiPicker: boolean }).offersEmojiPicker;

describe('ItemNameInputComponent', () => {
  let fixture: ComponentFixture<ItemNameInputComponent>;
  let component: ItemNameInputComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ItemNameInputComponent],
      providers: [provideTranslateService(), provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(ItemNameInputComponent);
    component = fixture.componentInstance;
  });

  const reportErrors = (...kinds: string[]) => {
    fixture.componentRef.setInput('dirty', true);
    fixture.componentRef.setInput(
      'errors',
      kinds.map((kind) => ({ kind }))
    );
  };

  it('names the error the bound field reports', () => {
    reportErrors(BLANK_TEXT.kind);
    expect(component.errorText()).toBe('edit.item.dialog.name.empty.error');

    reportErrors(DUPLICATE_NAME.kind);
    expect(component.errorText()).toBe('edit.item.dialog.name.duplicate.error');
  });

  it('says nothing while the field is valid', () => {
    expect(component.errorText()).toBeUndefined();
  });

  it('prefers the duplicate message when both are reported', () => {
    reportErrors(BLANK_TEXT.kind, DUPLICATE_NAME.kind);
    expect(component.errorText()).toBe('edit.item.dialog.name.duplicate.error');
  });

  it('renders no message for a kind it does not know', () => {
    reportErrors('somethingElse');
    expect(component.errorText()).toBeUndefined();
  });

  describe('while the field is untouched', () => {
    it('stays silent about an error it already holds', () => {
      fixture.componentRef.setInput('errors', [{ kind: BLANK_TEXT.kind }]);
      expect(component.errorText()).toBeUndefined();
    });

    it('speaks up once the field has been blurred', () => {
      fixture.componentRef.setInput('errors', [{ kind: BLANK_TEXT.kind }]);
      fixture.componentRef.setInput('touched', true);
      expect(component.errorText()).toBe('edit.item.dialog.name.empty.error');
    });
  });

  describe('the emoji picker gate', () => {
    it('offers the picker on desktop', () => {
      expect(offersPicker(createOn('desktop'))).toBe(true);
    });

    it('leaves it to the keyboard on mobile', () => {
      expect(offersPicker(createOn('mobile'))).toBe(false);
    });
  });
});
