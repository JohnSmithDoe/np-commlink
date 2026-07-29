import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { BLANK_TEXT, DUPLICATE_NAME } from '../../../util/form-rules';
import { ItemNameInputComponent } from './item-name-input.component';

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

  const reportErrors = (...kinds: string[]) =>
    fixture.componentRef.setInput(
      'errors',
      kinds.map((kind) => ({ kind }))
    );

  // The control validates nothing itself — it renders what the bound field
  // found, which is what let the duplicate-name rule move into the schema.
  it('names the error the bound field reports', () => {
    reportErrors(BLANK_TEXT.kind);
    expect(component.errorText()).toBe('edit.item.dialog.name.empty.error');

    reportErrors(DUPLICATE_NAME.kind);
    expect(component.errorText()).toBe('edit.item.dialog.name.duplicate.error');
  });

  it('says nothing while the field is valid', () => {
    expect(component.errorText()).toBeUndefined();
  });

  // A blank name and a duplicate are both possible in principle; the specific
  // complaint is the useful one.
  it('prefers the duplicate message when both are reported', () => {
    reportErrors(BLANK_TEXT.kind, DUPLICATE_NAME.kind);
    expect(component.errorText()).toBe('edit.item.dialog.name.duplicate.error');
  });

  // An unknown kind must not put a raw i18n key on screen.
  it('renders no message for a kind it does not know', () => {
    reportErrors('somethingElse');
    expect(component.errorText()).toBeUndefined();
  });
});
