import { inject, InjectionToken } from '@angular/core';
import { Store } from '@ngrx/store';
import axios from 'axios';
import { firstValueFrom } from 'rxjs';
import { Auth, Jam, JamConfiguration, JamService } from '../../../vendor/jam';
import { IS_NATIVE_PLATFORM } from '../../@shared/data/services/local-notifications.service';
import { MusicActions } from './music.actions';
import { selectJamSource } from './music.selector';
import { capacitorHttpAdapter } from './capacitor-http.adapter';

class StoreJamConfiguration extends JamConfiguration {
  override clientName = 'np-commlink';

  constructor(
    private readonly store: Store,
    private readonly native: boolean
  ) {
    super();
  }

  override domain(): string {
    return this.native ? '' : location.origin;
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
    const native = inject(IS_NATIVE_PLATFORM);
    axios.defaults.paramsSerializer = { indexes: null };
    if (native) axios.defaults.adapter = capacitorHttpAdapter();
    return new JamService(new StoreJamConfiguration(inject(Store), native));
  },
});
