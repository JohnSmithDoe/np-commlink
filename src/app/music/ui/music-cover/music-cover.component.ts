import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { discOutline } from 'ionicons/icons';
import { CoverLoader, CoverRef } from '../../model/music.types';

@Component({
  selector: 'app-music-cover',
  templateUrl: './music-cover.component.html',
  styleUrls: ['./music-cover.component.scss'],
  imports: [IonIcon],
})
export class MusicCoverComponent {
  readonly cover = input<CoverRef>();
  readonly loader = input.required<CoverLoader>();
  readonly label = input('');

  protected readonly src = signal<string | undefined>(undefined);
  readonly #visible = signal(false);

  constructor() {
    addIcons({ discOutline });
    const host = inject(ElementRef<HTMLElement>);
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const observer = new IntersectionObserver(([entry]) => {
        if (!entry?.isIntersecting) return;
        this.#visible.set(true);
        observer.disconnect();
      });
      observer.observe(host.nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
    effect(() => {
      const cover = this.cover();
      this.src.set(undefined);
      if (!cover || !this.#visible()) return;
      void this.loader()(cover).then((source) => {
        if (this.cover() === cover) this.src.set(source);
      });
    });
  }
}
