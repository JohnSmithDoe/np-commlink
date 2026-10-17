import {
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import {
  IonButton,
  IonContent,
  IonFooter,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
} from '@ionic/angular/standalone';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  addOutline,
  logInOutline,
  logOutOutline,
  refreshOutline,
  trashOutline,
} from 'ionicons/icons';
import { Marker } from '../../../@shared/model/app.types';
import { EmptyStateComponent } from '../../../@shared/ui/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { SourcesFacade } from '../../data';
import { ConnectOutcome, JamConnection, Source } from '../../model/music.types';
import { PlayerBarComponent } from '../../smart-ui/player-bar/player-bar.component';

const OUTCOME_MESSAGES: Record<ConnectOutcome, Marker> = {
  connected: marker('music.sources.outcome.connected'),
  refused: marker('music.sources.outcome.refused'),
  rejected: marker('music.sources.outcome.rejected'),
  unreachable: marker('music.sources.outcome.unreachable'),
};

@Component({
  selector: 'app-page-music-sources',
  templateUrl: './sources.page.html',
  styleUrls: ['./sources.page.scss'],
  imports: [
    FormField,
    IonButton,
    IonContent,
    IonFooter,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    TranslatePipe,
    EmptyStateComponent,
    PageHeaderComponent,
    PlayerBarComponent,
  ],
})
export class MusicSourcesPage {
  readonly #sources = inject(SourcesFacade);

  readonly #draft = linkedSignal<JamConnection>(() => {
    return {
      server: this.jam()?.server ?? '',
      username: this.jam()?.username ?? '',
      password: '',
    };
  });

  readonly foldersSupported = this.#sources.foldersSupported;
  readonly jam = this.#sources.jam;
  readonly connected = this.#sources.connected;
  readonly needsPassword = this.#sources.needsPassword;
  readonly folders = this.#sources.folders;
  readonly scanning = this.#sources.scanning;
  readonly lostSourceIds = this.#sources.lostSourceIds;
  readonly trackCounts = this.#sources.trackCounts;

  readonly connection = form(this.#draft);
  readonly connecting = signal(false);
  readonly outcome = signal<ConnectOutcome | undefined>(undefined);

  readonly outcomeMessage = computed(() => {
    const outcome = this.outcome();
    return outcome && OUTCOME_MESSAGES[outcome];
  });

  readonly canConnect = computed(() => {
    const draft = this.#draft();
    return (
      !this.connecting() &&
      !!draft.server.trim() &&
      !!draft.username.trim() &&
      !!draft.password
    );
  });

  constructor() {
    addIcons({
      addOutline,
      logInOutline,
      logOutOutline,
      refreshOutline,
      trashOutline,
    });
  }

  async connect(): Promise<void> {
    this.connecting.set(true);
    const outcome = await this.#sources.connect(this.#draft());
    this.connecting.set(false);
    this.outcome.set(outcome);
    if (outcome === 'connected')
      this.#draft.update((draft) => ({ ...draft, password: '' }));
  }

  signOut(): void {
    this.outcome.set(undefined);
    void this.#sources.signOut();
  }

  addFolder(): void {
    void this.#sources.addFolder();
  }

  rescan(): void {
    void this.#sources.rescan();
  }

  remove(source: Source): void {
    this.outcome.set(undefined);
    void this.#sources.removeSource(source);
  }
}
