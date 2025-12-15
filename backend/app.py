#!/usr/bin/env python3

# Importiert notwendige Standard-Bibliotheken
import os
import sqlite3
import argparse

# Importiert Flask-Komponenten für den Webserver und Session-Management
from flask import Flask, request, session, g, jsonify, send_from_directory
# Importiert Sicherheitsfunktionen zum Hashen und Überprüfen von Passwörtern
from werkzeug.security import generate_password_hash, check_password_hash
# Importiert dotenv, um Umgebungsvariablen aus einer .env Datei zu laden
from dotenv import load_dotenv

# --- Konfiguration ---
# Bestimmt das Basisverzeichnis der aktuellen Datei
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Lädt die .env Datei, falls sie im gleichen Ordner existiert
load_dotenv(os.path.join(BASE_DIR, ".env"))

# Konfigurationsvariablen setzen (mit Standardwerten, falls in .env nicht vorhanden)
DATABASE = os.getenv("DATABASE", "webshop.db")
SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret_for_demo") # Wichtig für Sessions/Cookies
DEBUG = os.getenv("DEBUG", "1") == "1"

# Initialisiert die Flask-App
# static_folder verweist auf den Ordner, in dem HTML/CSS/JS Dateien liegen
app = Flask(__name__, static_folder="../frontend", static_url_path="/static")
app.config["SECRET_KEY"] = SECRET_KEY
app.config["DATABASE"] = os.path.join(BASE_DIR, DATABASE)
app.config["DEBUG"] = DEBUG

# --- Datenbank-Hilfsfunktionen ---

def get_db():
    """
    Stellt eine Verbindung zur Datenbank her, falls noch keine für die 
    aktuelle Anfrage (Request) existiert. Speichert sie in 'g' (globaler Kontext).
    """
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = sqlite3.connect(app.config["DATABASE"])
        # Row_factory sorgt dafür, dass wir Spalten per Namen ansprechen können (wie ein Dictionary)
        db.row_factory = sqlite3.Row
        # Aktiviert Foreign-Key-Constraints (wichtig für Datenintegrität)
        db.execute("PRAGMA foreign_keys = ON;")
    return db

@app.teardown_appcontext
def close_connection(exception):
    """
    Schließt die Datenbankverbindung automatisch am Ende jeder Anfrage.
    """
    db = getattr(g, "_database", None)
    if db is not None:
        db.close()

def query_db(query, args=(), one=False):
    """
    Hilfsfunktion, um SQL-Abfragen einfacher auszuführen.
    one=True gibt nur einen Eintrag zurück, sonst eine Liste.
    """
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv

def init_db(with_seed=True):
    """
    Initialisiert die Datenbankstruktur.
    Liest das SQL-Schema aus 'models.sql' und führt es aus.
    """
    sql_path = os.path.join(BASE_DIR, "models.sql")
    with open(sql_path, "r", encoding="utf-8") as f:
        sql = f.read()
    db = get_db()
    db.executescript(sql)
    if with_seed:
        seed_db(db) # Füllt die DB mit Testdaten
    db.commit()

def seed_db(db):
    """
    Füllt die Datenbank mit Elektromobil-Produkten und einem Admin-Benutzer,
    falls diese noch nicht existieren.
    """
    cur = db.cursor()
    # Prüfen, ob Produkte existieren
    cur.execute("SELECT COUNT(*) as c FROM products")
    if cur.fetchone()["c"] == 0:
        # TCM Elektromobile Produkte
        products = [
            # (name, description, price_cents, stock)
            (
                "Elektrofighter Typhoon",
                "Dieser Jet fliegt so leise, dass er nicht nur die Feinde überrascht – auch der Stromzähler hat keine Chance, mitzuzählen!",
                67000000,  # 670'000 Euro in Cent
                5
            ),
            (
                "PorschE 911",
                "Rennstrecke? Einfach einstecken und loszischen – Ampere inklusive.",
                18700000,  # 187'000 Euro in Cent
                8
            ),
            (
                "Vermeiren Mercurius 4D",
                "Der erste Wagen, der nicht nur die Strasse, sondern auch die Zeit leicht biegt – und dabei völlig emissionsfrei bleibt.",
                2500000,  # 25'000 Euro in Cent
                12
            ),
            (
                "Harley d'E vidsons",
                "Klassisches Harley-Feeling mit Elektro-Kick: knattert nicht mehr, summt nur charmant wie ein Bienenvolk auf Koffein.",
                2000000,  # 20'000 Euro in Cent
                15
            ),
            (
                "USS E-Ntreprise",
                "Leise wie ein Schatten, stark wie ein Blitz – und immer galaktisch stylisch.",
                5400000000,  # 54'000'000 Euro in Cent
                2
            ),
            (
                "USS Gerald E Ford",
                "Modern, mächtig und elektrisch – jetzt können Flugzeugträger auch leise und umweltfreundlich patrouillieren, ohne dass die Fische wegrennen.",
                9200000000,  # 92'000'000 Euro in Cent
                1
            ),
            (
                "E-SaturnV",
                "Die legendäre Rakete mit Elektroantrieb: der Countdown endet, der Blitz startet – und die Erde wird sanft in Richtung Mond geschubst.",
                10000000000100,  # 100'000'000'001 Euro in Cent
                1
            ),
            (
                "E-Nuke",
                "Kleine Elektroschockwelle beim Einschlag",
                42000000000,  # 420'000'000 Euro in Cent
                3
            ),
            (
                "E-Rbus 380",
                "Jumbojet trifft E-Mobilität: so gross, dass selbst die Wolken den Kopf einziehen.",
                1000000000,  # 10'000'000 Euro in Cent (Platzhalter, da kein Preis angegeben)
                2
            ),
            (
                "Tupol-Volt 144",
                "„Abstürze? Nur, wenn du vergisst, ihn wieder aufzuladen!“",
                2550,  # 25.5 Euro in Cent
                25
            ),
            (
                "DeLorean DMC-12",
                "Der DeLorean DMC-12 ist eine ikonische Design-Legende mit Edelstahlkarosserie und Flügeltüren, die als Kultfahrzeug sogar für Zeitreisen steht und futurisches Denken sowie Innovation verkörpert.",
                100000000000000,  # 1'000'000'000'000 Euro in Cent
                1
            ),
            (
                "E-Landrover Serie III",
                "Der bekannte Landrover der Serie III jetzt als Elektrofahrzeug.",
                6700000,  # 67'000 Euro in Cent
                7
            ),
        ]
        cur.executemany("INSERT INTO products (name,description,price_cents,stock) VALUES (?,?,?,?)", products)
        print("TCM Elektromobile Produkte wurden geladen.")
    
    # Erstellt einen Admin-User (admin@example.com / admin123)
    cur.execute("SELECT COUNT(*) as c FROM users WHERE email = ?", ("admin@example.com",))
    if cur.fetchone()["c"] == 0:
        pw = generate_password_hash("admin123")
        cur.execute("INSERT INTO users (email,password,fullname,is_admin) VALUES (?,?,?,1)", ("admin@example.com", pw, "Admin"))
        print("Created admin user: admin@example.com / admin123")
    db.commit()

# --- Authentifizierungs-Hilfsfunktionen ---

def current_user():
    """
    Holt den aktuell eingeloggten Benutzer basierend auf der Session-ID.
    Gibt None zurück, wenn niemand eingeloggt ist.
    """
    uid = session.get("user_id")
    if not uid:
        return None
    row = query_db("SELECT id,email,fullname,is_admin,address,city,postalcode FROM users WHERE id = ?", (uid,), one=True)
    return dict(row) if row else None

def login_user(user_id):
    """
    Loggt einen Benutzer ein, indem die user_id in der verschlüsselten Session gespeichert wird.
    """
    session.clear()
    session["user_id"] = user_id

# --- Routen: Frontend (liefert HTML-Dateien aus) ---
# Diese Funktionen geben einfach die statischen HTML-Dateien aus dem frontend-Ordner zurück.

@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/shop")
def shop_page():
    return send_from_directory(app.static_folder, "shop.html")

@app.route("/admin")
def admin_page():
    return send_from_directory(app.static_folder, "admin.html")

# --- API Endpunkte (JSON Backend) ---

@app.route("/api/status")
def api_status():
    """Prüft, ob die API läuft und ob der Nutzer eingeloggt ist."""
    return jsonify({"ok": True, "logged_in": current_user() is not None})

# Auth: Registrierung
@app.route("/api/register", methods=["POST"])
def api_register():
    data = request.json or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    fullname = data.get("fullname", "")
    address = data.get("address", "")
    city = data.get("city", "")
    postalcode = data.get("postalcode", "")

    if not email or not password:
        return jsonify({"error": "Email und Passwort benötigt"}), 400

    db = get_db()
    cur = db.cursor()
    try:
        # Passwort hashen und User in DB speichern
        cur.execute("INSERT INTO users (email,password,fullname,address,city,postalcode) VALUES (?,?,?,?,?,?)",
                    (email, generate_password_hash(password), fullname, address, city, postalcode))
        db.commit()
        user_id = cur.lastrowid
        login_user(user_id) # Direkt einloggen nach Registrierung
        return jsonify({"ok": True, "user_id": user_id})
    except sqlite3.IntegrityError:
        return jsonify({"error": "Email bereits registriert"}), 400

# Auth: Login
@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.json or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email und Passwort benötigt"}), 400

    user = query_db("SELECT id,password FROM users WHERE email = ?", (email,), one=True)
    if not user:
        return jsonify({"error": "Ungültige Anmeldedaten"}), 400

    # Passwort-Hash vergleichen
    if check_password_hash(user["password"], password):
        login_user(user["id"])
        return jsonify({"ok": True})
    else:
        return jsonify({"error": "Ungültige Anmeldedaten"}), 400

# Auth: Logout
@app.route("/api/logout", methods=["POST"])
def api_logout():
    session.clear() # Session-Cookie leeren
    return jsonify({"ok": True})

# Gibt das Profil des aktuellen Users zurück
@app.route("/api/me")
def api_me():
    u = current_user()
    if not u:
        return jsonify({"user": None})
    return jsonify({"user": u})

# Produkte auflisten
@app.route("/api/products")
def api_products():
    rows = query_db("SELECT id,name,description,price_cents,stock FROM products ORDER BY id")
    products = [dict(r) for r in rows]
    return jsonify({"products": products})

# Bestellung aufgeben (benötigt Login)
@app.route("/api/order", methods=["POST"])
def api_order():
    u = current_user()
    if not u:
        return jsonify({"error": "Nicht angemeldet"}), 401

    data = request.json or {}
    items = data.get("items", [])  # Erwartet Liste: [{product_id, qty}, ...]
    if not items:
        return jsonify({"error": "Keine Artikel im Warenkorb"}), 400

    db = get_db()
    cur = db.cursor()
    total = 0
    
    # 1. Validierung: Prüfen ob Produkte existieren und genug Bestand da ist
    for it in items:
        pid = int(it.get("product_id"))
        qty = int(it.get("qty", 0))
        if qty <= 0:
            continue
        p = query_db("SELECT id,price_cents,stock FROM products WHERE id = ?", (pid,), one=True)
        if not p:
            return jsonify({"error": f"Produkt {pid} existiert nicht"}), 400
        if qty > p["stock"]:
            return jsonify({"error": f"Nicht genug Lagerbestand für Produkt {pid}"}), 400
        total += p["price_cents"] * qty

    # 2. Bestellung in DB anlegen
    cur.execute("INSERT INTO orders (user_id,total_cents) VALUES (?,?)", (u["id"], total))
    order_id = cur.lastrowid
    
    # 3. Items anlegen und Lagerbestand reduzieren
    for it in items:
        pid = int(it.get("product_id"))
        qty = int(it.get("qty", 0))
        if qty <= 0:
            continue
        p = query_db("SELECT price_cents,stock FROM products WHERE id = ?", (pid,), one=True)
        cur.execute("INSERT INTO order_items (order_id,product_id,qty,price_cents) VALUES (?,?,?,?)",
                    (order_id, pid, qty, p["price_cents"]))
        # Bestand verringern
        cur.execute("UPDATE products SET stock = stock - ? WHERE id = ?", (qty, pid))

    db.commit()
    return jsonify({"ok": True, "order_id": order_id})

# Admin: Produkt hinzufügen
@app.route("/api/admin/product", methods=["POST"])
def api_admin_add_product():
    u = current_user()
    # Nur Admins dürfen diese Route nutzen
    if not u or u.get("is_admin") != 1:
        return jsonify({"error": "Nicht autorisiert"}), 403
    data = request.json or {}
    name = data.get("name")
    desc = data.get("description","")
    price_cents = int(data.get("price_cents",0))
    stock = int(data.get("stock",0))
    
    if not name or price_cents <= 0:
        return jsonify({"error": "Ungültige Daten"}), 400
    
    db = get_db()
    cur = db.cursor()
    cur.execute("INSERT INTO products (name,description,price_cents,stock) VALUES (?,?,?,?)",
                (name,desc,price_cents,stock))
    db.commit()
    return jsonify({"ok": True, "product_id": cur.lastrowid})

# Admin: Produkt löschen
@app.route("/api/admin/product/<int:product_id>", methods=["DELETE"])
def api_admin_delete_product(product_id):
    u = current_user()
    if not u or u.get("is_admin") != 1:
        return jsonify({"error": "Nicht autorisiert"}), 403
    
    db = get_db()
    cur = db.cursor()
    
    # Prüfen, ob Produkt existiert
    p = query_db("SELECT id FROM products WHERE id = ?", (product_id,), one=True)
    if not p:
        return jsonify({"error": "Produkt nicht gefunden"}), 404
    
    # Sicherheitscheck: Darf nicht gelöscht werden, wenn es bereits bestellt wurde
    order_count = query_db(
        "SELECT COUNT(*) as count FROM order_items WHERE product_id = ?", 
        (product_id,), one=True
    )["count"]
    
    if order_count > 0:
        return jsonify({
            "error": f"Produkt kann nicht gelöscht werden, da es in {order_count} Bestellung(en) enthalten ist",
            "order_count": order_count
        }), 400
    
    # Produkt löschen
    cur.execute("DELETE FROM products WHERE id = ?", (product_id,))
    db.commit()
    
    return jsonify({"ok": True, "message": "Produkt gelöscht"})
# Admin: Lagerbestand aktualisieren
@app.route("/api/admin/product/<int:product_id>/stock", methods=["POST"])
def api_admin_update_stock(product_id):
    u = current_user()
    if not u or u.get("is_admin") != 1:
        return jsonify({"error": "Nicht autorisiert"}), 403
    
    data = request.json or {}
    change = int(data.get("change", 0))
    
    if change <= 0:
        return jsonify({"error": "Änderung muss positiv sein"}), 400
    
    db = get_db()
    cur = db.cursor()
    
    # Prüfen ob Produkt existiert
    p = query_db("SELECT id, stock FROM products WHERE id = ?", (product_id,), one=True)
    if not p:
        return jsonify({"error": "Produkt nicht gefunden"}), 404
    
    # Neuen Bestand berechnen und speichern
    new_stock = p["stock"] + change
    cur.execute("UPDATE products SET stock = ? WHERE id = ?", (new_stock, product_id))
    db.commit()
    
    return jsonify({"ok": True, "new_stock": new_stock})
# --- NEU: Admin: Alle Bestellungen abrufen ---
@app.route("/api/admin/orders")
def api_admin_orders():
    u = current_user()
    if not u or u.get("is_admin") != 1:
        return jsonify({"error": "Nicht autorisiert"}), 403

    db = get_db()
    
    # 1. Alle Bestellungen mit User-Infos holen (JOIN)
    # Wir holen auch Adresse etc. aus der users Tabelle
    query = """
        SELECT o.id, o.total_cents, o.created_at,
               u.fullname, u.email, u.address, u.city, u.postalcode
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
    """
    rows = query_db(query)
    orders = [dict(r) for r in rows]

    # 2. Für jede Bestellung die einzelnen Artikel holen (Detailansicht)
    for order in orders:
        items_query = """
            SELECT p.name, oi.qty, oi.price_cents
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        """
        items_rows = query_db(items_query, (order["id"],))
        order["items"] = [dict(i) for i in items_rows]

    return jsonify({"orders": orders})
# Statische Dateien (CSS/JS/Bilder) ausliefern, falls URL auf /static/... zeigt
@app.route("/static/<path:filename>")
def static_files(filename):
    frontend_root = os.path.join(os.path.dirname(BASE_DIR), "frontend")
    return send_from_directory(frontend_root, filename)

# --- Hauptprogramm ---
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    # Ermöglicht den Aufruf "python app.py --init-db" um die Datenbank neu aufzusetzen
    parser.add_argument("--init-db", action="store_true", help="Init DB and seed data")
    args = parser.parse_args()
    
    if args.init_db:
        with app.app_context():
            init_db(with_seed=True)
        print("DB initialisiert mit TCM Elektromobilen.")
    else:
        # Startet den Webserver
        app.run(host="0.0.0.0", port=5000, debug=app.config["DEBUG"])
