import { Service } from '@angular/core';
import { Share, ShareOptions } from '@capacitor/share';

@Service()
export class ShareService {
  share(options: ShareOptions): Promise<unknown> {
    return Share.share(options);
  }
}
