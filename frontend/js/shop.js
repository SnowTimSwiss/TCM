// Shop logic: zeigt Produkte, verwaltet einfachen Warenkorb und sendet Bestellung.

// Globale Variable für den Warenkorb
// Speichert Produkt-ID als Schlüssel und Menge als Wert
let CART = {}; // product_id -> qty

// Hilfsfunktion zum Formatieren von Preisen
// Wandelt Cent-Beträge in Euro-Format um (z.B. 199 -> "1.99 €")
function formatPrice(cents) {
  return (cents/100).toFixed(2) + " €";
}

// Lädt alle Produkte vom Backend und zeigt sie an
async function loadProducts() {
  // API-Aufruf an den Server, um Produktdaten zu erhalten
  const data = await api('/api/products');
  const container = document.getElementById('products');
  container.innerHTML = ''; // Leert den Container
  
  // Iteriert durch alle erhaltenen Produkte
  data.products.forEach(p => {
    // Erstellt ein HTML-Element für jedes Produkt
    const el = document.createElement('div');
    el.className = 'product';
    
    // HTML-Struktur für die Produktanzeige
    el.innerHTML = `
      <h3>${p.name}</h3>
      <p>${p.description || ''}</p>
      <p>Preis: ${formatPrice(p.price_cents)} | Lager: ${p.stock}</p>
      <div>
        <input type="number" min="0" max="${p.stock}" value="0" id="qty-${p.id}" style="width:60px" />
        <button data-id="${p.id}">In den Warenkorb</button>
      </div>
    `;
    
    // Fügt das Produkt zum Container hinzu
    container.appendChild(el);
    
    // Event-Listener für den "In den Warenkorb"-Button
    el.querySelector('button').onclick = () => {
      // Holt die ausgewählte Menge aus dem Input-Feld
      const q = parseInt(document.getElementById('qty-'+p.id).value || "0");
      
      // Validierung: Menge muss größer 0 sein
      if (q <= 0) { 
        alert('Menge wählen'); 
        return; 
      }
      
      // Aktualisiert den Warenkorb
      // Falls Produkt schon im Warenkorb, addiere zur vorhandenen Menge
      CART[p.id] = (CART[p.id] || 0) + q;
      
      // Stellt sicher, dass Menge nicht den Lagerbestand überschreitet
      if (CART[p.id] > p.stock) CART[p.id] = p.stock;
      
      // Aktualisiert die Warenkorb-Anzeige
      renderCart();
    };
  });
}

// Aktualisiert die Warenkorb-Anzeige
function renderCart() {
  const itemsDiv = document.getElementById('cart-items');
  itemsDiv.innerHTML = ''; // Leert den Warenkorb
  let total = 0; // Gesamtsumme initialisieren
  
  // Holt aktuelle Produktdaten vom Server (für aktuelle Preise und Bestände)
  // Falls Fehler, wird leeres Array verwendet
  const dataPromise = api('/api/products').catch(()=>({products:[]}));
  
  dataPromise.then(data => {
    // Erstellt eine Map für schnellen Zugriff auf Produktdaten
    const prodMap = {};
    data.products.forEach(p => prodMap[p.id] = p);

    // Geht durch alle Produkte im Warenkorb
    Object.keys(CART).forEach(pid => {
      const qty = CART[pid];
      const p = prodMap[pid];
      
      // Überspringt Produkte, die nicht mehr existieren
      if (!p) return;
      
      // Erstellt eine Zeile für jedes Warenkorb-Item
      const line = document.createElement('div');
      line.innerText = `${p.name} x ${qty} = ${formatPrice(p.price_cents * qty)}`;
      itemsDiv.appendChild(line);
      
      // Addiert zur Gesamtsumme
      total += p.price_cents * qty;
    });
    
    // Aktualisiert die Gesamtsummen-Anzeige
    document.getElementById('cart-total').innerText = "Total: " + formatPrice(total);
  });
}

// Wird ausgeführt, wenn die Seite geladen ist
document.addEventListener('DOMContentLoaded', async () => {
  // Prüft ob der Benutzer eingeloggt ist
  const me = await api('/api/me');
  
  // Falls nicht eingeloggt, zurück zur Startseite
  if (!me.user) {
    window.location.href = '/';
    return;
  }
  
  // Event-Listener für den Logout-Button
  document.getElementById('btn-logout').onclick = async () => {
    await api('/api/logout', {method:'POST'}); // Sendet Logout-Request
    window.location.href = '/'; // Weiterleitung zur Startseite
  };
  
  // Initiales Laden der Produkte und Warenkorb
  await loadProducts();
  renderCart();

  // Event-Listener für den Bestell-Button
  document.getElementById('btn-order').onclick = async () => {
    // Konvertiert den Warenkorb in das API-Format
    const items = Object.keys(CART).map(k => ({
      product_id: parseInt(k), 
      qty: CART[k]
    }));
    
    // Validierung: Warenkorb darf nicht leer sein
    if (items.length === 0) { 
      alert('Warenkorb leer'); 
      return; 
    }
    
    try {
      // Sendet Bestellung an den Server
      const res = await api('/api/order', {
        method:'POST', 
        body:{items}
      });
      
      // Erfolgsmeldung mit Bestell-ID
      alert('Bestellung aufgenommen. ID: ' + res.order_id);
      
      // Leert den Warenkorb nach erfolgreicher Bestellung
      CART = {};
      
      // Lädt Produkte neu (für aktualisierte Lagerbestände)
      await loadProducts();
      
      // Aktualisiert die Warenkorb-Anzeige (leer)
      renderCart();
      
    } catch (err) {
      // Fehlerbehandlung bei fehlgeschlagener Bestellung
      alert(err.error || 'Bestellung fehlgeschlagen');
    }
  };
});
