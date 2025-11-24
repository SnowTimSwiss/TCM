// Kleiner API-Helper
async function api(path, opts = {}) {
  opts.headers = opts.headers || {};
  if (!opts.headers['Content-Type']) {
    // default JSON for POST/PUT
    if (opts.method && opts.method.toUpperCase() !== 'GET') {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = opts.body ? JSON.stringify(opts.body) : null;
    }
  }
  const res = await fetch(path, opts);
  const data = await res.json().catch(()=>({}));
  if (!res.ok) {
    throw data;
  }
  return data;
}
