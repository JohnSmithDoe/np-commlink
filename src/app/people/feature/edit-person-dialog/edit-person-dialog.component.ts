import { Component, inject } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import {
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { addOutline, closeOutline } from 'ionicons/icons';
import { BaseEditItemDialog } from '../../../@shared/feature/item-lists/edit-item-dialog/base-edit-item-dialog';
import { ItemListId } from '../../../@shared/model/item-list.types';
import { PersonKind } from '../../../@shared/model/person.types';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { DateInputComponent } from '../../../@shared/ui/forms/date-input/date-input.component';
import { PeopleFacade } from '../../data';
import {
  CHILD_SIZES,
  LETTER_SIZES,
  SHOE_SIZES,
} from '../../model/people.consts';
import { Address, PEOPLE_LIST_ID, Person } from '../../model/people.types';
import { createAddress, createPerson } from '../../util/people.factory';
import { isBlankAddress } from '../../util/people.utils';

type PersonForm = {
  name: string;
  kind: PersonKind;
  birthDate: string;
  top: string;
  bottom: string;
  shoe: number | '';
  addresses: Address[];
};

@Component({
  selector: 'app-edit-person-dialog',
  templateUrl: './edit-person-dialog.component.html',
  styleUrl: './edit-person-dialog.component.scss',
  imports: [
    FormField,
    IonButton,
    IonIcon,
    IonInput,
    IonItem,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    TranslatePipe,
    DateInputComponent,
    ItemEditModalComponent,
  ],
})
export class EditPersonDialogComponent extends BaseEditItemDialog<
  Person,
  PersonForm
> {
  readonly #people = inject(PeopleFacade);

  protected readonly listId: ItemListId = PEOPLE_LIST_ID;
  readonly siblings = this.#people.allItems;

  readonly clothingSizes = [...LETTER_SIZES, ...CHILD_SIZES];
  readonly shoeSizes = SHOE_SIZES;

  constructor() {
    super();
    addIcons({ addOutline, closeOutline });
  }

  protected blank(): Person {
    return createPerson('');
  }

  protected override toForm(person: Person): PersonForm {
    return {
      name: person.name,
      kind: person.kind,
      birthDate: person.birthDate ?? '',
      top: person.sizes.top ?? '',
      bottom: person.sizes.bottom ?? '',
      shoe: person.sizes.shoe ?? '',
      addresses: person.addresses.map((address) => ({ ...address })),
    };
  }

  protected override fromForm(draft: PersonForm, seed: Person): Person {
    return {
      ...seed,
      name: draft.name,
      kind: draft.kind,
      birthDate: draft.birthDate || undefined,
      sizes:
        draft.kind === 'pet'
          ? {}
          : {
              top: draft.top || undefined,
              bottom: draft.bottom || undefined,
              shoe: draft.shoe || undefined,
            },
      addresses: draft.addresses
        .map(({ street, postalCode, city, country }) => ({
          street,
          postalCode,
          city,
          country,
        }))
        .filter((address) => !isBlankAddress(address)),
    };
  }

  protected save(item: Person): void {
    this.#people.saveItem(item);
  }

  addAddress(): void {
    this.patch({ addresses: [...this.draft().addresses, createAddress()] });
  }

  removeAddress(index: number): void {
    this.patch({
      addresses: this.draft().addresses.filter((_, at) => at !== index),
    });
  }
}
