import { inject, Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Store } from '@ngrx/store';
import { IDatastore, LoadedDatastore } from '../types';
import { migrate, VERSION } from './migrations';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  readonly #storageService = inject(Storage);
  readonly store = inject(Store);

  async create(): Promise<LoadedDatastore> {
    await this.#storageService.create();
    const loaded: LoadedDatastore = {
      tracking: await this.#loadAs('tracking'),
      settings: await this.#loadAs('settings'),
      officeTime: await this.#loadAs('officeTime'),
      notifications: await this.#loadAs('notifications'),
    };
    const { data, changed } = migrate(loaded, VERSION);
    if (changed) {
      await Promise.all([
        this.save('tracking', data.tracking),
        this.save('settings', data.settings),
        this.save('officeTime', data.officeTime),
        this.save('notifications', data.notifications),
      ]);
    }
    return data;
  }

  async #loadAs<T extends keyof IDatastore>(
    key: T
  ): Promise<IDatastore[T] | null> {
    return await this.#storageService.get('nptt-' + key);
  }

  async save<T extends keyof IDatastore>(
    key: T,
    value: IDatastore[T] | null | undefined
  ) {
    return await this.#storageService.set('nptt-' + key, value);
  }
}
