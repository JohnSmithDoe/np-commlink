/* ─── why ─────────────────────────────────────────────────────────
 * The APK's requests leave from native code, not from the WebView: a
 * native request carries no `Origin`, and jamserve's CORS check passes
 * those unconditionally. From the WebView every call would carry
 * `https://localhost` and need a server-side allow-list entry.
 * Scoped to axios — which only the Jam client uses — because
 * `CapacitorHttp.enabled` would reroute every fetch in the app.
 * ───────────────────────────────────────────────────────────────── */
import { CapacitorHttp, HttpResponse } from '@capacitor/core';
import axios, {
  AxiosAdapter,
  AxiosError,
  AxiosHeaders,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

type NativeHttp = Pick<typeof CapacitorHttp, 'request'>;

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++)
    bytes[index] = binary.codePointAt(index) ?? 0;
  return bytes.buffer;
};

const headersOf = (
  config: InternalAxiosRequestConfig
): Record<string, string> => {
  return Object.fromEntries(
    Object.entries(AxiosHeaders.from(config.headers).toJSON())
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)])
  );
};

const bodyOf = (config: InternalAxiosRequestConfig): unknown =>
  typeof config.data === 'string' ? JSON.parse(config.data) : config.data;

const toAxiosResponse = (
  config: InternalAxiosRequestConfig,
  response: HttpResponse
): AxiosResponse => {
  return {
    data:
      config.responseType === 'arraybuffer' && typeof response.data === 'string'
        ? base64ToArrayBuffer(response.data)
        : response.data,
    status: response.status,
    statusText: String(response.status),
    headers: AxiosHeaders.from(response.headers),
    config,
  };
};

const send = async (
  http: NativeHttp,
  config: InternalAxiosRequestConfig
): Promise<HttpResponse> => {
  const options = {
    url: axios.getUri(config),
    method: (config.method ?? 'get').toUpperCase(),
    headers: headersOf(config),
    data: bodyOf(config),
    responseType:
      config.responseType === 'arraybuffer'
        ? ('arraybuffer' as const)
        : ('json' as const),
  };
  try {
    return await http.request(options);
  } catch (error: unknown) {
    throw new AxiosError(
      error instanceof Error ? error.message : 'Network Error',
      AxiosError.ERR_NETWORK,
      config
    );
  }
};

export const capacitorHttpAdapter = (
  http: NativeHttp = CapacitorHttp
): AxiosAdapter => {
  return async (config) => {
    const response = await send(http, config);
    const result = toAxiosResponse(config, response);
    if (response.status >= 400) {
      throw new AxiosError(
        `Request failed with status code ${response.status}`,
        AxiosError.ERR_BAD_RESPONSE,
        config,
        undefined,
        result
      );
    }
    return result;
  };
};
