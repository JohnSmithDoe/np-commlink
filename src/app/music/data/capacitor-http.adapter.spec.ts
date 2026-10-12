import { HttpResponse } from '@capacitor/core';
import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { isAuthRefused } from '../util/jam-errors';
import { capacitorHttpAdapter } from './capacitor-http.adapter';

const config = (
  overrides: Partial<InternalAxiosRequestConfig> = {}
): InternalAxiosRequestConfig => ({
  url: '/jam/v1/session',
  baseURL: 'https://music.example.org',
  method: 'post',
  headers: new AxiosHeaders({ Authorization: 'Bearer jwt', 'X-Empty': null }),
  data: '{"name":"runner"}',
  ...overrides,
});

const answering = (response: Partial<HttpResponse>) => ({
  request: vi.fn(() =>
    Promise.resolve({
      status: 200,
      headers: {},
      url: '',
      data: {},
      ...response,
    })
  ),
});

describe('capacitorHttpAdapter', () => {
  it('sends the request natively with its headers and parsed body', async () => {
    const http = answering({ data: { ok: true } });

    const response = await capacitorHttpAdapter(http)(config());

    expect(http.request).toHaveBeenCalledWith({
      url: 'https://music.example.org/jam/v1/session',
      method: 'POST',
      headers: { Authorization: 'Bearer jwt' },
      data: { name: 'runner' },
      responseType: 'json',
    });
    expect(response.data).toEqual({ ok: true });
  });

  it('decodes a binary answer from base64', async () => {
    const http = answering({ data: btoa('AB') });

    const response = await capacitorHttpAdapter(http)(
      config({ method: 'get', data: undefined, responseType: 'arraybuffer' })
    );

    expect([...new Uint8Array(response.data as ArrayBuffer)]).toEqual([65, 66]);
  });

  it('turns a refusal into the error the gateway reads as one', async () => {
    const http = answering({ status: 401 });

    const failure = await capacitorHttpAdapter(http)(config()).catch(
      (error: unknown) => error
    );

    expect(failure).toBeInstanceOf(AxiosError);
    expect(isAuthRefused(failure)).toBe(true);
  });

  it('reports an unreachable server as a network error', async () => {
    const http = { request: vi.fn(() => Promise.reject(new Error('offline'))) };

    await expect(capacitorHttpAdapter(http)(config())).rejects.toMatchObject({
      code: AxiosError.ERR_NETWORK,
    });
  });
});
