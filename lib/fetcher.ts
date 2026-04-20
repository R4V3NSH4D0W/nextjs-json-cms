import { notFound } from 'next/navigation';
import { toast } from 'sonner';

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

type FetcherOptions = RequestInit & {
  /**
   * When true (default), shows a sonner toast on error.
   * Pass false to suppress toast and handle errors yourself.
   */
  showErrorToast?: boolean;
  next?: {
    tags?: string[];
    revalidate?: false | number;
  };
};

async function fetcher<T>(endpoint: string, options: FetcherOptions = {}): Promise<T> {
  const { showErrorToast = true, ...fetchOptions } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!(fetchOptions.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...fetchOptions,
    credentials: 'include',
    headers,
  });

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { message?: string; error?: string };
    const message = errorData.error || errorData.message || `API Error (${response.status})`;
    if (showErrorToast && typeof window !== 'undefined') {
      toast.error(message, { id: message });
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(
    endpoint: string,
    options?: FetcherOptions & {
      params?: Record<string, null | string | number | boolean | string[] | undefined>;
    },
  ) => {
    let url = endpoint;
    if (options?.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => searchParams.append(key, String(v)));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }
    return fetcher<T>(url, { ...options, method: 'GET' });
  },

  post: <T>(endpoint: string, body: unknown, options?: FetcherOptions) =>
    fetcher<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body: unknown, options?: FetcherOptions) =>
    fetcher<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: <T>(endpoint: string, body: unknown, options?: FetcherOptions) =>
    fetcher<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: <T>(endpoint: string, body?: unknown, options?: FetcherOptions) =>
    fetcher<T>(endpoint, {
      ...options,
      method: 'DELETE',
      ...(body !== undefined
        ? { body: body instanceof FormData ? body : JSON.stringify(body) }
        : {}),
    }),
};
