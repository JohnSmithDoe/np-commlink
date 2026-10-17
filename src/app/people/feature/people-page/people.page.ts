import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { IonNote } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { paw, person } from 'ionicons/icons';
import { TodayService } from '../../../@shared/data/services/today.service';
import { ListPageComponent } from '../../../@shared/feature/item-lists/list-page/list-page.component';
import { ListItemComponent } from '../../../@shared/ui/base-item/list-item/list-item.component';
import { LIST_FACADE } from '../../../@shared/util/item-lists/list-page.facade';
import { PeopleFacade, PeoplePageFacade } from '../../data';
import { Person } from '../../model/people.types';
import { addressLines, ageOn } from '../../util/people.utils';

@Component({
  selector: 'app-page-people',
  templateUrl: './people.page.html',
  styleUrls: ['./people.page.scss'],
  imports: [
    DatePipe,
    IonNote,
    TranslatePipe,
    ListPageComponent,
    ListItemComponent,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: PeoplePageFacade }],
})
export class PeoplePage {
  readonly #people = inject(PeopleFacade);
  readonly #today = inject(TodayService).today;

  constructor() {
    addIcons({ paw, person });
  }

  ageOf(person: Person): number | undefined {
    return person.birthDate
      ? ageOn(person.birthDate, this.#today())
      : undefined;
  }

  hasSizes(person: Person): boolean {
    return Object.values(person.sizes).some((size) => size !== undefined);
  }

  firstAddress(person: Person): string | undefined {
    const [address] = person.addresses;
    return address ? addressLines(address).join(', ') : undefined;
  }

  openPersonEdit(person: Person): void {
    this.#people.showEditDialog(person);
  }

  deletePerson(person: Person): void {
    this.#people.removeItem(person);
  }
}
