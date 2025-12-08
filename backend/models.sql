-- Webshop Datenbank Schema
-- Aktiviert die Überprüfung von Fremdschlüssel-Beziehungen
-- Dies stellt sicher, dass verknüpfte Datensätze konsistent bleiben
PRAGMA foreign_keys = ON;

-- Tabelle für Benutzerkonten
-- Speichert alle registrierten Benutzer des Webshops
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,           -- Eindeutige ID, automatisch hochgezählt
  email TEXT UNIQUE NOT NULL,                     -- E-Mail-Adresse (muss eindeutig sein)
  password TEXT NOT NULL,                         -- Passwort (gehasht gespeichert)
  fullname TEXT,                                  -- Vollständiger Name des Benutzers
  address TEXT,                                   -- Straße und Hausnummer
  city TEXT,                                      -- Stadt
  postalcode TEXT,                                -- Postleitzahl
  is_admin INTEGER DEFAULT 0,                     -- 0 = normaler Benutzer, 1 = Administrator
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP   -- Erstellungsdatum (automatisch gesetzt)
);

-- Tabelle für Produkte
-- Enthält alle im Shop verfügbaren Artikel
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,           -- Eindeutige Produkt-ID
  name TEXT NOT NULL,                             -- Produktname (z.B. "Laptop XYZ")
  description TEXT,                               -- Detaillierte Produktbeschreibung
  price_cents INTEGER NOT NULL,                   -- Preis in Cent (vermeidet Rundungsfehler)
  stock INTEGER NOT NULL DEFAULT 0,               -- Verfügbarer Lagerbestand
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP   -- Datum der Produkteinpflegung
);

-- Tabelle für Bestellungen
-- Jede Bestellung eines Benutzers wird hier gespeichert
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,           -- Eindeutige Bestellnummer
  user_id INTEGER NOT NULL,                       -- Verweis auf den bestellenden Benutzer
  total_cents INTEGER NOT NULL,                   -- Gesamtbetrag der Bestellung in Cent
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- Bestelldatum
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  -- ON DELETE CASCADE: Wenn ein Benutzer gelöscht wird, 
  -- werden auch alle seine Bestellungen gelöscht
);

-- Tabelle für Bestellpositionen
-- Enthält die einzelnen Artikel einer Bestellung (Warenkorb-Inhalt)
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,           -- Eindeutige ID der Position
  order_id INTEGER NOT NULL,                      -- Zu welcher Bestellung gehört diese Position
  product_id INTEGER NOT NULL,                    -- Welches Produkt wurde bestellt
  qty INTEGER NOT NULL,                           -- Wie viele Stück wurden bestellt
  price_cents INTEGER NOT NULL,                   -- Preis pro Stück zum Zeitpunkt der Bestellung
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
  -- ON DELETE CASCADE: Wenn die Bestellung gelöscht wird,
  -- werden auch alle ihre Positionen gelöscht
  FOREIGN KEY(product_id) REFERENCES products(id)
  -- Verweis auf die Produkttabelle (ohne CASCADE, da Produkte
  -- erhalten bleiben sollten, auch wenn sie bestellt wurden)
);
