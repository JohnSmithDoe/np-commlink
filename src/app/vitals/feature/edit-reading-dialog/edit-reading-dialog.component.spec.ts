import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SelectCustomEvent } from '@ionic/angular/standalone';
import { provideTranslateService } from '@ngx-translate/core';
import { EmojiRecentsFacade } from '../../../@shared/data/emoji/emoji-recents.facade';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { EditItemMode } from '../../../@shared/model/base-item.types';
import { ProfilesFacade, ReadingsFacade } from '../../data';
import { Reading, READINGS_LIST_ID } from '../../model/vitals.types';
import { mockProfile, mockReading } from '../../testing/vitals.test-data';
import { createReading } from '../../util/vitals.factory';
import { todayISO } from '../../../@shared/util/formatting/date-format.utils';
import { EditReadingDialogComponent } from './edit-reading-dialog.component';

const cat = mockProfile({ id: 'cat', name: 'Katze', type: 'pet' });
const martin = mockProfile();

const myReadings = [
  mockReading({ id: 'old', name: '2026-01-01', grams: 79_000 }),
  mockReading({ id: 'recent', name: '2026-02-01', grams: 80_000 }),
];

const holderPicked = (value: string) =>
  ({ detail: { value } }) as SelectCustomEvent<string>;

const setup = (catReadings: Reading[] = [], persons = [martin]) => {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideTranslateService(),
      { provide: EmojiRecentsFacade, useValue: { remember: vi.fn() } },
      {
        provide: ReadingsFacade,
        useValue: {
          allItems: signal([...myReadings, ...catReadings]),
          profileReadings: signal(catReadings),
          saveItem: vi.fn(),
        },
      },
      {
        provide: ProfilesFacade,
        useValue: {
          persons: signal(persons),
          routeProfile: signal(cat),
        },
      },
    ],
  });
  const host = TestBed.inject(ItemDialogService);
  const component = TestBed.createComponent(
    EditReadingDialogComponent
  ).componentInstance;
  return { component, host };
};

const openFor = (
  host: ItemDialogService,
  item: Reading,
  editMode: EditItemMode = 'create'
) => host.open({ item, listId: READINGS_LIST_ID, editMode });

describe('EditReadingDialogComponent — the calculator', () => {
  it('suggests the holder’s nearest reading at or before the date', () => {
    const { component, host } = setup();
    openFor(host, createReading(cat.id, 0, '2026-01-15'));

    component.setHolder(holderPicked(martin.id));

    expect(component.holderGrams()).toBe(79_000);
  });

  it('starts on the only person there is, weight and all', () => {
    const { component, host } = setup();

    openFor(host, createReading(cat.id, 0, '2026-01-15'));

    expect(component.holderId()).toBe(martin.id);
    expect(component.holderGrams()).toBe(79_000);
  });

  it('picks nobody once a second person exists', () => {
    const flatmate = mockProfile({ id: 'flatmate', name: 'Rike' });
    const { component, host } = setup([], [martin, flatmate]);

    openFor(host, createReading(cat.id, 0, '2026-01-15'));

    expect(component.holderId()).toBe('');
    expect(component.holderGrams()).toBeNull();
  });

  it('writes the difference into the weight once both numbers are known', () => {
    const { component, host } = setup();
    openFor(host, createReading(cat.id, 0, '2026-02-10'));

    component.setHolder(holderPicked(martin.id));
    component.setCombinedGrams(84_300);

    expect(component.draft().grams).toBe(4300);
  });

  it('keeps an edited holder weight over the suggestion', () => {
    const { component, host } = setup();
    openFor(host, createReading(cat.id, 0, '2026-02-10'));

    component.setHolder(holderPicked(martin.id));
    component.setHolderGrams(80_500);
    component.setCombinedGrams(84_300);

    expect(component.draft().grams).toBe(3800);
  });

  it('stays out of the way while nobody is holding the cat', () => {
    const flatmate = mockProfile({ id: 'flatmate', name: 'Rike' });
    const { component, host } = setup([], [martin, flatmate]);
    openFor(host, createReading(cat.id, 0, '2026-02-10'));

    component.setCombinedGrams(84_300);

    expect(component.draft().grams).toBeNull();
  });

  it('is offered for a pet being created and never for an edit', () => {
    const { component, host } = setup();

    openFor(host, createReading(cat.id, 0, '2026-02-10'));
    expect(component.showCalculator()).toBe(true);

    openFor(host, mockReading({ profileId: cat.id }), 'update');
    expect(component.showCalculator()).toBe(false);
  });
});

describe('EditReadingDialogComponent — one reading per day', () => {
  it('refuses a date the profile already carries', () => {
    const today = todayISO();
    const { component, host } = setup([
      mockReading({ id: 'taken', name: today, profileId: cat.id }),
    ]);

    openFor(host, createReading(cat.id, 0, today));
    component.setHolder(holderPicked(martin.id));
    component.setCombinedGrams(84_300);

    expect(component.dateTaken()).toBe(true);
    expect(component.canSave()).toBe(false);
  });

  it('saves a date that is still free', () => {
    const { component, host } = setup([
      mockReading({ id: 'taken', name: '2026-02-01', profileId: cat.id }),
    ]);

    openFor(host, createReading(cat.id, 0, '2026-02-10'));
    component.setHolder(holderPicked(martin.id));
    component.setCombinedGrams(84_300);

    expect(component.dateTaken()).toBe(false);
    expect(component.canSave()).toBe(true);
  });
});
