import { Component, computed, inject, signal } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRange,
  RangeCustomEvent,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  pauseOutline,
  playOutline,
  playSkipBackOutline,
  playSkipForwardOutline,
  repeatOutline,
  shuffleOutline,
  trashOutline,
} from 'ionicons/icons';
import { Marker } from '../../../@shared/model/app.types';
import { EmptyStateComponent } from '../../../@shared/ui/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { CoverStore, PlayerFacade } from '../../data';
import { CoverRef, QueueEntry, RepeatMode } from '../../model/music.types';
import { MusicCoverComponent } from '../../ui/music-cover/music-cover.component';
import { TrackTimePipe } from '../../util/track-time.pipe';

const REPEAT_LABELS: Record<RepeatMode, Marker> = {
  off: marker('music.queue.repeat-off'),
  all: marker('music.queue.repeat-all'),
  one: marker('music.queue.repeat-one'),
};

@Component({
  selector: 'app-page-music-queue',
  templateUrl: './queue.page.html',
  styleUrls: ['./queue.page.scss'],
  imports: [
    IonButton,
    IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonRange,
    TranslatePipe,
    EmptyStateComponent,
    PageHeaderComponent,
    MusicCoverComponent,
    TrackTimePipe,
  ],
})
export class MusicQueuePage {
  readonly #player = inject(PlayerFacade);
  readonly #covers = inject(CoverStore);

  readonly queue = this.#player.queue;
  readonly current = this.#player.current;
  readonly playing = this.#player.playing;
  readonly positionMs = this.#player.positionMs;
  readonly durationMs = this.#player.durationMs;
  readonly #scrubMs = signal<number | undefined>(undefined);
  readonly shownPositionMs = computed(
    () => this.#scrubMs() ?? this.positionMs()
  );
  readonly repeat = this.#player.repeat;
  readonly repeatLabel = computed(() => REPEAT_LABELS[this.repeat()]);
  readonly loadCover = (cover: CoverRef) => this.#covers.load(cover);

  constructor() {
    addIcons({
      pauseOutline,
      playOutline,
      playSkipBackOutline,
      playSkipForwardOutline,
      repeatOutline,
      shuffleOutline,
      trashOutline,
    });
  }

  scrub(event: RangeCustomEvent): void {
    const value = event.detail.value;
    if (typeof value === 'number') this.#scrubMs.set(value);
  }

  async seek(event: RangeCustomEvent): Promise<void> {
    const value = event.detail.value;
    if (typeof value === 'number') await this.#player.seek(value);
    this.#scrubMs.set(undefined);
  }

  togglePlay(): void {
    void this.#player.togglePlay();
  }

  next(): void {
    void this.#player.next();
  }

  previous(): void {
    void this.#player.previous();
  }

  cycleRepeat(): void {
    void this.#player.cycleRepeat();
  }

  shuffle(): void {
    void this.#player.shuffleUpcoming();
  }

  skipTo(entry: QueueEntry): void {
    void this.#player.skipTo(entry);
  }

  remove(entry: QueueEntry): void {
    void this.#player.remove(entry);
  }
}
