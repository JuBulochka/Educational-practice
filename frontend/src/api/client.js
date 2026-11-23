const baseURL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
let csrfToken = '';

export class ApiError extends Error {
  constructor(status, data) {
    super(data?.detail || 'Запрос завершился с ошибкой.');
    this.status = status;
    this.data = data;
  }
}

export async function api(path, { method = 'GET', data, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (data !== undefined) headers['Content-Type'] = 'application/json';
  if (method !== 'GET' && csrfToken) headers['X-CSRFToken'] = csrfToken;

  const response = await fetch(`${baseURL}${path}`, {
    method,
    credentials: 'include',
    headers,
    body: data === undefined ? undefined : JSON.stringify(data),
    signal,
  });

  const result = response.headers.get('content-type')?.includes('application/json')
    ? await response.json() : null;
  if (!response.ok) throw new ApiError(response.status, result);
  if (result?.csrfToken) csrfToken = result.csrfToken;
  return result;
}
