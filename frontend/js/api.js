// Robuster API-Helper
// Zentrale Funktion für alle API-Aufrufe mit integrierter Fehlerbehandlung
async function api(path, opts = {}) {
  // Initialisiert headers Objekt falls nicht vorhanden
  opts.headers = opts.headers || {};
  
  // Setzt Content-Type Header automatisch für nicht-GET Requests
  if (!opts.headers['Content-Type']) {
    // Standardmäßig JSON für POST/PUT/PATCH/DELETE Requests
    if (opts.method && opts.method.toUpperCase() !== 'GET') {
      opts.headers['Content-Type'] = 'application/json';
      // Stringifiziert den Body wenn vorhanden
      opts.body = opts.body ? JSON.stringify(opts.body) : null;
    }
  }
  
  // Führt den fetch-Request aus
  const res = await fetch(path, opts);
  
  // Variable für geparste Response-Daten
  let data;
  
  // Versucht Response als JSON zu parsen
  try {
    // Holt zuerst den Response als Text
    const text = await res.text();
    // Versucht Text in JSON zu konvertieren (falls nicht leer)
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    // Fallback bei JSON-Parsing-Fehlern
    // Erstellt einfaches Response-Objekt mit Statusinformationen
    data = { 
      success: res.ok,       // Boolean: true bei 2xx Status
      status: res.status     // HTTP Status Code (z.B. 200, 404, 500)
    };
  }
  
  // Prüft ob Request erfolgreich war (HTTP Status 200-299)
  if (!res.ok) {
    // Wirft Fehler mit Response-Daten als Error-Objekt
    throw data;
  }
  
  // Gibt geparste Daten zurück bei erfolgreichem Request
  return data;
}

// ============================================================================
// ERWEITERTE ADMIN-FUNKTIONEN
// ============================================================================

/**
 * Erstellt ein neues Produkt im System
 * @param {Object} productData - Produktdaten für die Erstellung
 * @param {string} productData.name - Produktname (erforderlich)
 * @param {string} productData.description - Produktbeschreibung
 * @param {number} productData.price_cents - Preis in Cent (erforderlich)
 * @param {number} productData.stock - Lagerbestand (erforderlich)
 * @param {string} productData.category - Produktkategorie
 * @param {string} productData.image_url - URL zum Produktbild
 * @returns {Promise<Object>} Response vom Server
 * 
 * Beispiel-Aufruf:
 * adminAddProduct({
 *   name: "Neues Produkt",
 *   price_cents: 1999,
 *   stock: 10,
 *   description: "Beschreibung",
 *   category: "Elektronik"
 * });
 */
async function adminAddProduct(productData) {
  return await api('/api/admin/product', {
    method: 'POST',                // HTTP POST für Erstellung
    body: productData              // Produktdaten als JSON
  });
}

/**
 * Aktualisiert den Lagerbestand eines Produkts
 * @param {number} productId - ID des zu aktualisierenden Produkts
 * @param {number} change - Änderung des Bestands (positiv: hinzufügen, negativ: entfernen)
 * @returns {Promise<Object>} Aktualisiertes Produkt
 * 
 * Beispiel-Aufrufe:
 * adminUpdateStock(1, 10)   // Fügt 10 Einheiten hinzu
 * adminUpdateStock(2, -5)   // Entfernt 5 Einheiten
 * adminUpdateStock(3, 0)    // Keine Änderung (sinnlos)
 */
async function adminUpdateStock(productId, change) {
  return await api(`/api/admin/product/${productId}/stock`, {
    method: 'POST',                // HTTP POST für Update
    body: { change }               // Änderungswert als Objekt
  });
}

/**
 * Löscht ein Produkt aus dem System
 * @param {number} productId - ID des zu löschenden Produkts
 * @returns {Promise<Object>} Bestätigung der Löschung
 * 
 * Beispiel-Aufruf:
 * adminDeleteProduct(42)  // Löscht Produkt mit ID 42
 * 
 * ACHTUNG: Löschung ist endgültig!
 */
async function adminDeleteProduct(productId) {
  return await api(`/api/admin/product/${productId}`, {
    method: 'DELETE'               // HTTP DELETE für Löschung
  });
}

/**
 * Ruft alle Bestellungen aus dem System ab
 * @returns {Promise<Array>} Liste aller Bestellungen
 * 
 * Beispiel-Rückgabeformat:
 * [
 *   {
 *     id: 1,
 *     user_id: 5,
 *     total_cents: 2999,
 *     status: "completed",
 *     created_at: "2024-01-15T10:30:00Z",
 *     items: [
 *       { product_id: 1, qty: 2, price_cents: 999 }
 *     ]
 *   }
 * ]
 */
async function adminGetOrders() {
  return await api('/api/admin/orders');  // GET Request ohne Parameter
}
