import { provideLocationMocks } from '@angular/common/testing';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { mockBaseItem } from '../../testing/test-data';
import { ItemDialogService } from './item-dialog.service';

@Component({ template: '' })
class BlankPage {}

describe('ItemDialogService', () => {
  let host: ItemDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: '**', component: BlankPage }]),
        provideLocationMocks(),
      ],
    });
    host = TestBed.inject(ItemDialogService);
  });

  const openOnProbeList = () =>
    host.open({ item: mockBaseItem(), listId: '_probe', editMode: 'update' });

  it('copies the item, so reopening the same row reseeds the wrappers‘ draft', () => {
    const item = mockBaseItem();

    host.open({ item, listId: '_probe', editMode: 'update' });

    expect(host.request()?.item).toEqual(item);
    expect(host.request()?.item).not.toBe(item);
  });

  it('closes on request', () => {
    openOnProbeList();

    host.close();

    expect(host.request()).toBeNull();
  });

  it('expires the command when the app navigates away', async () => {
    openOnProbeList();

    await TestBed.inject(Router).navigateByUrl('/elsewhere');

    expect(host.request()).toBeNull();
  });
});
