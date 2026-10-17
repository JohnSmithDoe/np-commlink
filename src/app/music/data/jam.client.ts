import { inject, InjectionToken } from '@angular/core';
import { Store } from '@ngrx/store';
import axios from 'axios';
import { firstValueFrom } from 'rxjs';
import {
  Auth,
  Jam,
  JamConfiguration as JamConfig,
  JamService,
} from '../../../vendor/jam';
import { NATIVE_PLATFORM } from '../../@shared/data/services/local-notifications.service';
import { MusicActions } from './music.actions';
import { selectJamSource } from './music.selector';
import { capacitorHttpAdapter } from './capacitor-http.adapter';

class StoreJamConfig extends JamConfig {
  override clientName = 'np-commlink';

  constructor(
    private readonly store: Store,
    private readonly isNative: boolean
  ) {
    super();
  }

  override domain(): string {
    return this.isNative ? '' : location.origin;
  }

  override userChangeNotify(): Promise<void> {
    return Promise.resolve();
  }

  override async fromStorage(): Promise<
    { user: Jam.SessionUser; auth: Auth } | undefined
  > {
    const jam = await firstValueFrom(this.store.select(selectJamSource));
    return jam?.session;
  }

  override toStorage(
    data: { user: Jam.SessionUser; auth: Auth } | undefined
  ): Promise<void> {
    this.store.dispatch(
      data
        ? MusicActions.jamConnected({ auth: data.auth, user: data.user })
        : MusicActions.jamSignedOut()
    );
    return Promise.resolve();
  }
}

export const JAM_CLIENT = new InjectionToken<JamService>('Jam client', {
  providedIn: 'root',
  factory: () => {
    const isNative = inject(NATIVE_PLATFORM);
    axios.defaults.paramsSerializer = { indexes: null };
    if (isNative) axios.defaults.adapter = capacitorHttpAdapter();
    return new JamService(new StoreJamConfig(inject(Store), isNative));
  },
});
