import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AlbumEntry, CoverLoader } from '../../model/music.types';
import { MusicCoverComponent } from '../music-cover/music-cover.component';

@Component({
  selector: 'app-music-album-grid',
  templateUrl: './album-grid.component.html',
  styleUrls: ['./album-grid.component.scss'],
  imports: [TranslatePipe, MusicCoverComponent],
})
export class AlbumGridComponent {
  readonly albums = input.required<readonly AlbumEntry[]>();
  readonly loader = input.required<CoverLoader>();
  readonly showArtist = input(true);

  readonly openAlbum = output<AlbumEntry>();
}
