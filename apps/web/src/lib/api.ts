const API_URL = typeof window === 'undefined'
  ? process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:4000'
  : '';

export type ApiError = {
  statusCode: number;
  message: string | string[];
  error?: string;
};

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const isFormData = init.body instanceof FormData;
  const headers = new Headers(init.headers);
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response = await fetch(`${API_URL}/api/v1${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });

  // Attempt token refresh on 401 Unauthorized
  if (response.status === 401 && !path.startsWith('/auth/')) {
    const refreshRes = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshRes.ok) {
      // Retry original request
      response = await fetch(`${API_URL}/api/v1${path}`, {
        ...init,
        credentials: 'include',
        headers,
      });
    }
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => ({
      statusCode: response.status,
      message: response.statusText,
    }))) as ApiError;
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

const api = {
  get: <T = any>(path: string, init?: RequestInit) => 
    apiFetch<T>(path, { ...init, method: 'GET' }).then(data => ({ data })),
  post: <T = any>(path: string, body?: any, init?: RequestInit) => 
    apiFetch<T>(path, { ...init, method: 'POST', body: body ? JSON.stringify(body) : undefined }).then(data => ({ data })),
  patch: <T = any>(path: string, body?: any, init?: RequestInit) => 
    apiFetch<T>(path, { ...init, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }).then(data => ({ data })),
  delete: <T = any>(path: string, init?: RequestInit) => 
    apiFetch<T>(path, { ...init, method: 'DELETE' }).then(data => ({ data })),
};

export default api;
