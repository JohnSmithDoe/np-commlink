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
      // grocery slices (null on a fresh install → each reducer's
      // loadedSuccessfully handler falls back to its initialState).
      products: await this.#loadProducts(),
      shopping: await this.#loadAs('shopping'),
      storage: await this.#loadAs('storage'),
      tasks: await this.#loadAs('tasks'),
      listSettings: await this.#loadAs('listSettings'),
      // cash ledger (null on a fresh install → reducer initialState)
      cash: await this.#loadAs('cash'),
      // trackplay slice (null on a fresh install → the reducer seeds the
      // default game types via its loadedSuccessfully handler).
      trackplay: await this.#loadAs('trackplay'),
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
    return await this.#storageService.get('npc-' + key);
  }

  // Expand/Contract rename (globals → products): read the new `npc-products`
  // key; if it's absent, fall back to the legacy `npc-globals` key once and
  // re-persist it under `npc-products` so existing local data survives the
  // rename instead of being wiped.
  async #loadProducts(): Promise<IDatastore['products'] | null> {
    const current = await this.#loadAs('products');
    if (current) return current;
    const legacy = (await this.#storageService.get('npc-globals')) as
      IDatastore['products'] | null;
    if (legacy) {
      await this.save('products', legacy);
    }
    return legacy ?? null;
  }

  async save<T extends keyof IDatastore>(
    key: T,
    value: IDatastore[T] | null | undefined
  ) {
    return await this.#storageService.set('npc-' + key, value);
  }
}
