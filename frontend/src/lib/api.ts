/**
 * Tiny fetch-based API client.
 *
 * - Reads token from localStorage (set on login) and sends as Bearer header
 * - Sends credentials so the httpOnly cookie path also works
 * - Unwraps the backend's `{ status, data }` envelope so callers receive `data` directly
 * - Throws ApiError on any non-2xx so React Query treats it as a failed query
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';
const TOKEN_KEY = 'aurelia-token';

export class ApiError extends Error {
  status: number;
  details?: Array<{ field: string; message: string }>;

  constructor(status: number, message: string, details?: ApiError['details']) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export const tokenStore = {
  get(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(TOKEN_KEY);
  },
};

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
};

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = new URL(`${API_URL}${path}`);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.append(k, String(v));
      }
    });
  }
  return url.toString();
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, query, headers, ...rest } = options;
  const token = tokenStore.get();

  const res = await fetch(buildUrl(path, query), {
    ...rest,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 204 No Content — return undefined cast to T
  if (res.status === 204) return undefined as T;

  const payload = await res.json().catch(() => ({} as any));

  if (!res.ok) {
    throw new ApiError(
      res.status,
      payload?.message || `Request failed (${res.status})`,
      payload?.details
    );
  }

  return payload.data as T;
}

/**
 * Multipart upload. Content-Type is deliberately omitted so the browser sets
 * the multipart boundary itself.
 */
async function upload<T>(
  path: string,
  formData: FormData,
  query?: RequestOptions['query']
): Promise<T> {
  const token = tokenStore.get();

  const res = await fetch(buildUrl(path, query), {
    method: 'POST',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const payload = await res.json().catch(() => ({} as any));

  if (!res.ok) {
    throw new ApiError(res.status, payload?.message || `Upload failed (${res.status})`, payload?.details);
  }

  return payload.data as T;
}

export const api = {
  get: <T>(path: string, query?: RequestOptions['query']) => request<T>(path, { method: 'GET', query }),
  upload,
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
