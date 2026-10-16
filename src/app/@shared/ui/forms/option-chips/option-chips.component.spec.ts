import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OptionChipsComponent } from './option-chips.component';

type Lead = { kind: 'days'; days: number };

const pressedOf = (selected: string | readonly string[] | undefined) => {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
  const fixture = TestBed.createComponent(OptionChipsComponent<Lead>);
  fixture.componentRef.setInput('options', [
    { key: 'days:0', value: { kind: 'days', days: 0 }, label: 'on the day' },
    { key: 'days:3', value: { days: 3, kind: 'days' }, label: '3 days' },
  ]);
  fixture.componentRef.setInput('selected', selected);
  fixture.detectChanges();
  const host = fixture.nativeElement as HTMLElement;
  return [...host.querySelectorAll('[data-testid="chip"]')].map((chip) =>
    chip.getAttribute('aria-pressed')
  );
};

describe('OptionChipsComponent', () => {
  it('marks a chip by its key, whatever order its value was built in', () => {
    expect(pressedOf('days:3')).toEqual(['false', 'true']);
  });

  it('marks every chip a multi-select names', () => {
    expect(pressedOf(['days:0', 'days:3'])).toEqual(['true', 'true']);
  });
});
