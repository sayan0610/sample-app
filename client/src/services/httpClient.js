export class HttpClient {
  constructor(baseURL, defaultHeaders = {}) {
    this.baseURL = baseURL.replace(/\/+$/, '');
    this.defaultHeaders = { 'Content-Type': 'application/json', ...defaultHeaders };
  }
  async request(path, { method = 'GET', body, signal, headers } = {}) {
    const url = `${this.baseURL}${path}`;
    const res = await fetch(url, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: { ...this.defaultHeaders, ...headers },
      signal
    });

    const ct = res.headers.get('content-type') || '';

    if (!res.ok) {
      // Try to extract JSON error message; else text.
      let errText;
      if (ct.includes('application/json')) {
        try { const j = await res.json(); errText = j.error || JSON.stringify(j); }
        catch { errText = await res.text().catch(() => ''); }
      } else {
        errText = await res.text().catch(() => '');
      }
      throw new Error(`HTTP ${res.status}: ${errText || 'Request failed'} (${url})`);
    }

    if (res.status === 204) return null;

    // Guard: non‑JSON response
    if (!ct.includes('application/json')) {
      const text = await res.text();
      throw new Error(`Non‑JSON response from ${url}. First chars: ${text.slice(0,60)}`);
    }

    return res.json();
  }
  get(path, opts) { return this.request(path, { ...opts, method: 'GET' }); }
  post(path, body, opts) { return this.request(path, { ...opts, method: 'POST', body }); }
  patch(path, body, opts) { return this.request(path, { ...opts, method: 'PATCH', body }); }
  put(path, body, opts) { return this.request(path, { ...opts, method: 'PUT', body }); }
  delete(path, opts) { return this.request(path, { ...opts, method: 'DELETE' }); }
}