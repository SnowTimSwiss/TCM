// Shop logic: zeigt Produkte, verwaltet einfachen Warenkorb und sendet Bestellung.
let CART = {}; // product_id -> qty

function formatPrice(cents) {
  return (cents/100).toFixed(2) + " €";
}

async function loadProducts() {
  const data = await api('/api/products');
  const container = document.getElementById('products');
  container.innerHTML = '';
  data.products.forEach(p => {
    const el = document.createElement('div');
    el.className = 'product';
    el.innerHTML = `
      <h3>${p.name}</h3>
      <p>${p.description || ''}</p>
      <p>Preis: ${formatPrice(p.price_cents)} | Lager: ${p.stock}</p>
      <div>
        <input type="number" min="0" max="${p.stock}" value="0" id="qty-${p.id}" style="width:60px" />
        <button data-id="${p.id}">In den Warenkorb</button>
      </div>
    `;
    container.appendChild(el);
    el.querySelector('button').onclick = () => {
      const q = parseInt(document.getElementById('qty-'+p.id).value || "0");
      if (q <= 0) { alert('Menge wählen'); return; }
      CART[p.id] = (CART[p.id] || 0) + q;
      if (CART[p.id] > p.stock) CART[p.id] = p.stock;
      renderCart();
    };
  });
}

function renderCart() {
  const itemsDiv = document.getElementById('cart-items');
  itemsDiv.innerHTML = '';
  let total = 0;
  const dataPromise = api('/api/products').catch(()=>({products:[]})); // try to get latest prices/stock
  dataPromise.then(data => {
    const prodMap = {};
    data.products.forEach(p => prodMap[p.id] = p);

    Object.keys(CART).forEach(pid => {
      const qty = CART[pid];
      const p = prodMap[pid];
      if (!p) return;
      const line = document.createElement('div');
      line.innerText = `${p.name} x ${qty} = ${formatPrice(p.price_cents * qty)}`;
      itemsDiv.appendChild(line);
      total += p.price_cents * qty;
    });
    document.getElementById('cart-total').innerText = "Total: " + formatPrice(total);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // check auth
  const me = await api('/api/me');
  if (!me.user) {
    window.location.href = '/';
    return;
  }
  document.getElementById('btn-logout').onclick = async () => {
    await api('/api/logout', {method:'POST'});
    window.location.href = '/';
  };
  await loadProducts();
  renderCart();

  document.getElementById('btn-order').onclick = async () => {
    const items = Object.keys(CART).map(k => ({product_id: parseInt(k), qty: CART[k]}));
    if (items.length === 0) { alert('Warenkorb leer'); return; }
    try {
      const res = await api('/api/order', {method:'POST', body:{items}});
      alert('Bestellung aufgenommen. ID: ' + res.order_id);
      CART = {};
      await loadProducts();
      renderCart();
    } catch (err) {
      alert(err.error || 'Bestellung fehlgeschlagen');
    }
  };
});
