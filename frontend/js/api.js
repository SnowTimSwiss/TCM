// Robuster API-Helper
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
  
  let data;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    // If JSON parsing fails, create a simple response object
    data = { success: res.ok, status: res.status };
  }
  
  if (!res.ok) {
    throw data;
  }
  return data;
}

// Erweiterte Admin-Funktionen
async function adminAddProduct(productData) {
  return await api('/api/admin/product', {
    method: 'POST',
    body: productData
  });
}

async function adminUpdateStock(productId, change) {
  return await api(`/api/admin/product/${productId}/stock`, {
    method: 'POST',
    body: { change }
  });
}

async function adminDeleteProduct(productId) {
  return await api(`/api/admin/product/${productId}`, {
    method: 'DELETE'
  });
}
