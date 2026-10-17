import { TestBed } from '@angular/core/testing';
import { provideTestingProviders } from '../../@shared/testing/test-providers';
import { mockJamSource } from '../testing/music.fakes';
import { JAM_CLIENT } from './jam.client';
import { JamGateway } from './jam.gateway';

const refused = new Error('Request failed with status code 401');

function fakeJamClient(isLoggedIn = true) {
  return {
    auth: {
      login: vi.fn(() => Promise.resolve()),
      logout: vi.fn(() => Promise.resolve()),
      clear: vi.fn(() => Promise.resolve()),
      load: vi.fn(() => Promise.resolve()),
      isLoggedIn: vi.fn(() => isLoggedIn),
    },
    session: { session: vi.fn(() => Promise.resolve({ user: { id: 'u' } })) },
    nowplaying: { scrobble: vi.fn(() => Promise.resolve()) },
    stream: { streamUrl: vi.fn(() => 'https://jam/stream') },
    image: { imageUrl: vi.fn(() => 'https://jam/image') },
  };
}

const setup = (client = fakeJamClient()) => {
  TestBed.configureTestingModule({
    providers: [
      provideTestingProviders({ music: { sources: [mockJamSource()] } }),
      JamGateway,
      { provide: JAM_CLIENT, useValue: client },
    ],
  });
  return { gateway: TestBed.inject(JamGateway), client };
};

describe('JamGateway', () => {
  it('reads the jam source and its session from the store', () => {
    const { gateway } = setup();

    expect(gateway.sourceId()).toBe('jam-1');
    expect(gateway.connected()).toBe(true);
  });

  it('logs in against the normalized address and a trimmed name', async () => {
    const { gateway, client } = setup();

    const outcome = await gateway.connect({
      server: 'music.example.org/jam/v1/',
      username: ' runner ',
      password: 'secret',
    });

    expect(outcome).toBe('connected');
    expect(client.auth.login).toHaveBeenCalledWith(
      'https://music.example.org',
      'runner',
      'secret'
    );
  });

  it('turns a failed login into the outcome the form shows', async () => {
    const client = fakeJamClient();
    client.auth.login.mockRejectedValue(refused);
    const { gateway } = setup(client);

    expect(
      await gateway.connect({ server: 'x', username: 'a', password: 'b' })
    ).toBe('refused');
  });

  it('restores a stored login before the first request', async () => {
    const { gateway, client } = setup(fakeJamClient(false));
    const call = vi.fn(() => Promise.resolve('ok'));

    await gateway.request(call);

    expect(client.auth.load.mock.invocationCallOrder[0]).toBeLessThan(
      call.mock.invocationCallOrder[0]
    );
  });

  it('drops the session when the server refuses a request', async () => {
    const { gateway, client } = setup();

    await expect(gateway.request(() => Promise.reject(refused))).rejects.toBe(
      refused
    );
    expect(client.auth.clear).toHaveBeenCalled();
  });

  it('keeps the session through any other failure', async () => {
    const { gateway, client } = setup();

    await expect(
      gateway.request(() => Promise.reject(new Error('timeout')))
    ).rejects.toThrow('timeout');
    expect(client.auth.clear).not.toHaveBeenCalled();
  });

  it('expires a session the server no longer knows', async () => {
    const client = fakeJamClient();
    client.session.session.mockResolvedValue({ user: undefined } as never);
    const { gateway } = setup(client);

    await gateway.verify();

    expect(client.auth.clear).toHaveBeenCalled();
  });

  it('signs out even when the server is gone', async () => {
    const client = fakeJamClient();
    client.auth.logout.mockRejectedValue(new Error('offline'));
    const { gateway } = setup(client);

    await expect(gateway.signOut()).resolves.toBeUndefined();
  });

  it('scrobbles and builds stream and image addresses through the client', async () => {
    const { gateway, client } = setup();

    await gateway.scrobble('t1');

    expect(client.nowplaying.scrobble).toHaveBeenCalledWith({ id: 't1' });
    expect(gateway.streamUrl('t1')).toBe('https://jam/stream');
    expect(client.stream.streamUrl).toHaveBeenCalledWith({ id: 't1' });
    expect(gateway.imageUrl('a1', 300)).toBe('https://jam/image');
    expect(client.image.imageUrl).toHaveBeenCalledWith({ id: 'a1', size: 300 });
  });
});
