import { API_URL } from '@/lib/config';
import { supabase } from '@/lib/supabase';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/**
 * Calls the website's shared API (the same endpoints the website uses).
 * If someone is signed in, their Supabase access token is sent as `Authorization: Bearer ...`.
 */
export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  const { data } = await supabase.auth.getSession();
  if (data.session) headers.Authorization = `Bearer ${data.session.access_token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError('No connection. Check your internet and try again.', 0);
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(json.error || `Something went wrong (${res.status}).`, res.status);
  return json as T;
}
