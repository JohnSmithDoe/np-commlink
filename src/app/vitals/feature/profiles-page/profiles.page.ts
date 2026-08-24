import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonIcon, IonNote } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { createOutline, paw, person, star } from 'ionicons/icons';
import { ListPageComponent } from '../../../@shared/feature/item-lists/list-page/list-page.component';
import { ListItemComponent } from '../../../@shared/ui/base-item/list-item/list-item.component';
import { LIST_FACADE } from '../../../@shared/util/item-lists/list-page.facade';
import { ProfilesFacade, ProfilesPageFacade } from '../../data';
import { Profile, ProfileSummary, VitalsId } from '../../model/vitals.types';
import { VITALS_EDIT_SWIPE_ACTION } from '../../ui/swipe-actions';
import { WeightPipe } from '../../util/weight.pipe';
import { EditProfileDialogComponent } from '../edit-profile-dialog/edit-profile-dialog.component';

const NO_SUMMARY: ProfileSummary = { count: 0 };

@Component({
  selector: 'app-page-vitals-profiles',
  templateUrl: './profiles.page.html',
  styleUrls: ['./profiles.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonIcon,
    IonNote,
    TranslatePipe,
    ListPageComponent,
    ListItemComponent,
    WeightPipe,
    EditProfileDialogComponent,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: ProfilesPageFacade }],
})
export class VitalsProfilesPage {
  readonly editSwipeAction = VITALS_EDIT_SWIPE_ACTION;

  readonly #profiles = inject(ProfilesFacade);
  readonly #router = inject(Router);

  readonly summaries = this.#profiles.summaries;
  readonly favorite = this.#profiles.favoriteProfile;

  constructor() {
    addIcons({ createOutline, paw, person, star });
  }

  summaryFor(profile: Profile): ProfileSummary {
    return this.summaries()[profile.id] ?? NO_SUMMARY;
  }

  isFavorite(profile: Profile): boolean {
    return profile.id === this.favorite()?.id;
  }

  goToProfile(id: VitalsId): void {
    void this.#router.navigate(['/vitals/profile', id]);
  }

  openProfileEdit(profile: Profile): void {
    this.#profiles.showEditDialog(profile);
  }

  deleteProfile(profile: Profile): void {
    this.#profiles.removeItem(profile);
  }
}
