import { toast } from "sonner";

/**
 * Same-origin fetch for the admin app. Uses the **session cookie** (no NextAuth JWT).
 * Mirrors Ecommerce-dashboard `lib/api-client` shape so `cmsApi` works unchanged.
 */
function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
}

async function fetcher<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${getBaseUrl()}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
    };
    const errorMessage =
      errorData.error || errorData.message || `API Error (${response.status})`;
    toast.error(errorMessage, { id: errorMessage });
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(
    endpoint: string,
    options?: RequestInit & {
      params?: Record<
        string,
        string | number | boolean | string[] | undefined | null
      >;
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
        url += (url.includes("?") ? "&" : "?") + queryString;
      }
    }
    return fetcher<T>(url, { ...options, method: "GET" });
  },

  post: <T>(endpoint: string, body: unknown, options?: RequestInit) => {
    const isFormData = body instanceof FormData;
    const headers = { ...options?.headers } as Record<string, string>;
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }
    return fetcher<T>(endpoint, {
      ...options,
      method: "POST",
      body: isFormData ? (body as BodyInit) : JSON.stringify(body),
      headers,
    });
  },

  patch: <T>(endpoint: string, body: unknown, options?: RequestInit) => {
    const isFormData = body instanceof FormData;
    const headers = { ...options?.headers } as Record<string, string>;
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }
    return fetcher<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: isFormData ? (body as BodyInit) : JSON.stringify(body),
      headers,
    });
  },

  put: <T>(endpoint: string, body: unknown, options?: RequestInit) => {
    const isFormData = body instanceof FormData;
    const headers = { ...options?.headers } as Record<string, string>;
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }
    return fetcher<T>(endpoint, {
      ...options,
      method: "PUT",
      body: isFormData ? (body as BodyInit) : JSON.stringify(body),
      headers,
    });
  },

  delete: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    fetcher<T>(endpoint, {
      ...options,
      method: "DELETE",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    }),
};
