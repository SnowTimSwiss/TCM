# TCM – Webshop

---

## Projektübersicht

Dieses Projekt ist ein vollständiger Webshop als **Schultestprojekt** für den fiktiven Verkauf von Elektromobilen
(**PiDrive – Power Innovation Drive**).

Das Projekt dient ausschließlich Lern- und Testzwecken und zeigt folgende Inhalte:

* Frontend- und Backend-Entwicklung
* Datenbankdesign und -zugriff
* Benutzer-Authentifizierung
* Grundlegende E-Commerce-Funktionen

⚠️ **Hinweis:**
Dies ist kein produktives System. Es gibt **keine echte Zahlungsabwicklung**, keine Sicherheitsgarantien
und nur eine einfache SQLite-Datenbank.

---

## Funktionsumfang

* Benutzerregistrierung und Login
* Produktübersicht mit Warenkorb
* Bestellfunktion (Demo)
* Admin-Bereich zur Produkt- und Bestellverwaltung
* Adressvalidierung für Schweizer Adressen (OpenStreetMap / Nominatim)

---

## Projektstruktur

```text
TCM/
├── backend/                    # Backend: Flask-API und Logik
│   ├── app.py                  # Haupt-Flask-Anwendung
│   ├── models.sql              # Datenbankschema
│   ├── webshop.db              # SQLite-Datenbank (wird erstellt)
│   └── .env                    # Konfiguration (Secret Key)
├── frontend/                   # Frontend: Statische Dateien
│   ├── js/
│   │   ├── api.js              # API-Helper
│   │   ├── auth.js             # Login/Registrierung + Adressprüfung
│   │   └── shop.js             # Warenkorb & Bestellung
│   ├── admin.html              # Admin-Oberfläche
│   ├── index.html              # Login / Registrierung
│   └── shop.html               # Shop-Seite
├── install_webshop.sh          # Installationsskript
├── requirements.txt            # Python-Abhängigkeiten
└── README.md                   # Diese Dokumentation
```

---

## Voraussetzungen

* Linux-System
* Python 3.8 oder höher
* Git
* Bash-Shell
* Internetzugang (pip & Adressvalidierung)

---

## Installation

### Repository klonen

```bash
git clone https://github.com/SnowTimSwiss/TCM.git
cd TCM
```

### Installationsskript ausführen

```bash
chmod +x install_webshop.sh
./install_webshop.sh
```

### Das Installationsskript erledigt

* Prüfung der Voraussetzungen
* Erstellung einer virtuellen Python-Umgebung
* Installation der Abhängigkeiten
* Generierung eines Secret Keys
* Initialisierung der Datenbank mit Testdaten
* Start des Webservers unter `http://localhost:5000`

---


## Datenbankaufbau

Die Datenbank ist eine SQLite-Datenbank mit folgenden Tabellen:

### users

* id (Primärschlüssel)
* email (UNIQUE, NOT NULL)
* password (gehasht)
* fullname
* address
* city
* postalcode
* is_admin (0 oder 1)
* created_at

### products

* id (Primärschlüssel)
* name (NOT NULL)
* description
* price_cents
* stock
* created_at

### orders

* id (Primärschlüssel)
* user_id (Foreign Key → users)
* total_cents
* created_at

### order_items

* id (Primärschlüssel)
* order_id (Foreign Key → orders)
* product_id (Foreign Key → products)
* qty
* price_cents

Fremdschlüssel verwenden **ON DELETE CASCADE**.

---

## Testdaten

Nach der Installation sind folgende Testdaten vorhanden:

* **Admin-Benutzer**

  * E-Mail: `admin@example.com`
  * Passwort: `admin123`

* Mehrere Beispielprodukte

---

## Backend (Flask)

### Wichtige API-Endpunkte

#### Authentifizierung

* `POST /api/register` – Registrierung
* `POST /api/login` – Login
* `POST /api/logout` – Logout
* `GET /api/me` – Aktueller Benutzer

#### Shop

* `GET /api/products` – Alle Produkte
* `POST /api/order` – Bestellung aufgeben

#### Admin

* `POST /api/admin/product` – Produkt hinzufügen
* `DELETE /api/admin/product/<id>` – Produkt löschen
* `POST /api/admin/product/<id>/stock` – Lagerbestand ändern
* `GET /api/admin/orders` – Alle Bestellungen

### Sicherheit

* Passwort-Hashing
* Session-basierte Authentifizierung
* Admin-Rechteprüfung
* Parametrisierte SQL-Queries

---

## Frontend

### Seiten

* **index.html** – Login & Registrierung mit Adressvalidierung
* **shop.html** – Produktübersicht, Warenkorb, Bestellung
* **admin.html** – Admin-Panel

### JavaScript-Dateien

* `api.js` – Zentrale Fetch-Funktionen
* `auth.js` – Login, Registrierung, Adresse
* `shop.js` – Warenkorb und Bestellung

### Design

* Dunkles Theme
* Blaue Akzente
* Responsiv

---

## Admin-Bereich

* Erreichbar unter `/admin`
* Nur für eingeloggte Admin-Benutzer

### Funktionen

* Produkte hinzufügen
* Lagerbestand anpassen
* Produkte löschen (nur wenn nicht bestellt)
* Alle Bestellungen anzeigen (inkl. Kundendaten)

---

## Nutzung

1. Server starten
2. Browser öffnen: `http://localhost:5000`
3. Registrieren oder als Admin einloggen
4. Produkte bestellen
5. Admin-Bereich verwenden

---

## Sicherheitshinweise

* Gehashte Passwörter
* Schutz vor SQL-Injection
* Session-Handling
* Adressvalidierung über externe API

### Einschränkungen

* Keine Zahlungsabwicklung
* Keine HTTPS-Konfiguration
* Einfache SQLite-Datenbank
