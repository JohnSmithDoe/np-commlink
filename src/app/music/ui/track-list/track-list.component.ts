import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { addCircleOutline, star, starOutline } from 'ionicons/icons';
import { Track } from '../../model/music.types';
import { TrackTimePipe } from '../../util/track-time.pipe';

@Component({
  selector: 'app-music-track-list',
  templateUrl: './track-list.component.html',
  styleUrls: ['./track-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    TranslatePipe,
    TrackTimePipe,
  ],
})
export class TrackListComponent {
  readonly tracks = input.required<readonly Track[]>();
  readonly currentId = input<string>();
  readonly favorites = input(false, { transform: booleanAttribute });
  readonly showNumbers = input(false, { transform: booleanAttribute });

  readonly playTrack = output<Track>();
  readonly enqueueTrack = output<Track>();
  readonly favoriteTrack = output<Track>();

  constructor() {
    addIcons({ addCircleOutline, star, starOutline });
  }
}
