import { Component, computed, inject, signal } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import {
  IonItem,
  IonNote,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { BaseEditItemDialog } from '../../../@shared/feature/item-lists/edit-item-dialog/base-edit-item-dialog';
import { ItemListId } from '../../../@shared/model/item-list.types';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { ProfilesFacade } from '../../data';
import { ZODIAC_SIGNS } from '../../model/astro.consts';
import { ZodiacSign } from '../../model/astro.types';
import { Profile, PROFILES_LIST_ID } from '../../model/vitals.types';
import { zodiacSignFor } from '../../util/zodiac.utils';

type AstroForm = {
  name: string;
  sun: ZodiacSign | '';
  ascendant: ZodiacSign | '';
};

const NOBODY: Profile = { id: '', name: '', kind: 'person' };

@Component({
  selector: 'app-edit-profile-dialog',
  templateUrl: './edit-profile-dialog.component.html',
  imports: [
    FormField,
    IonItem,
    IonNote,
    IonSelect,
    IonSelectOption,
    TranslatePipe,
    ItemEditModalComponent,
  ],
})
export class EditProfileDialogComponent extends BaseEditItemDialog<
  Profile,
  AstroForm
> {
  readonly #profiles = inject(ProfilesFacade);

  protected readonly listId: ItemListId = PROFILES_LIST_ID;
  readonly siblings = signal<readonly Profile[]>([]);

  readonly signs = ZODIAC_SIGNS;
  readonly derivedSign = computed(() =>
    zodiacSignFor(this.seedItem()?.birthDate ?? '')
  );

  protected override uniqueName(): boolean {
    return false;
  }

  protected blank(): Profile {
    return NOBODY;
  }

  protected override toForm(profile: Profile): AstroForm {
    return {
      name: profile.name,
      sun: profile.sun ?? '',
      ascendant: profile.ascendant ?? '',
    };
  }

  protected override fromForm(draft: AstroForm, seed: Profile): Profile {
    return {
      ...seed,
      sun: draft.sun || undefined,
      ascendant: draft.ascendant || undefined,
    };
  }

  protected save({ id, sun, ascendant }: Profile): void {
    this.#profiles.saveAstro(id, { sun, ascendant });
  }
}
