import { Injectable } from '@angular/core';
import { Share, ShareOptions } from '@capacitor/share';

@Injectable({ providedIn: 'root' })
export class ShareService {
  share(options: ShareOptions): Promise<unknown> {
    return Share.share(options);
  }
}
