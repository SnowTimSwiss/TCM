#!/usr/bin/env python3
"""
Ein einfaches Flask-Backend für den Schul-Webshop.
Unterstützt: Registrierung, Login (Session), Produkte abrufen, Bestellung speichern.
Bei Aufruf mit --init-db: erstellt die SQLite DB und fügt Beispielprodukte ein.
"""

import os
import sqlite3
import argparse
from flask import Flask, request, session, g, jsonify, send_from_directory, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

# Load .env wenn vorhanden
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

DATABASE = os.getenv("DATABASE", "webshop.db")
SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret_for_demo")
DEBUG = os.getenv("DEBUG", "1") == "1"

app = Flask(__name__, static_folder="../frontend", static_url_path="/static")
app.config["SECRET_KEY"] = SECRET_KEY
app.config["DATABASE"] = os.path.join(BASE_DIR, DATABASE)
app.config["DEBUG"] = DEBUG

# --- Database helpers ---
def get_db():
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = sqlite3.connect(app.config["DATABASE"])
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys = ON;")
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, "_database", None)
    if db is not None:
        db.close()

def query_db(query, args=(), one=False):
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv

def init_db(with_seed=True):
    # Erstellt Tabellen aus models.sql
    sql_path = os.path.join(BASE_DIR, "models.sql")
    with open(sql_path, "r", encoding="utf-8") as f:
        sql = f.read()
    db = get_db()
    db.executescript(sql)
    if with_seed:
        seed_db(db)
    db.commit()

def seed_db(db):
    # Einfaches Seeding: Beispielprodukte & Admin user (pass: admin123)
    cur = db.cursor()
    # Check if products exist
    cur.execute("SELECT COUNT(*) as c FROM products")
    if cur.fetchone()["c"] == 0:
        products = [
            ("T-Shirt - Demo", "Bequemes Baumwoll-T-Shirt.", 1999, 10),
            ("Kaffeebecher", "Keramikbecher 300ml.", 899, 25),
            ("USB-Stick 32GB", "Klein & schnell.", 1299, 5),
            ("Notizbuch", "A5 liniert", 599, 15),
        ]
        cur.executemany("INSERT INTO products (name,description,price_cents,stock) VALUES (?,?,?,?)", products)
        print("Seeded products.")
    # Admin user
    cur.execute("SELECT COUNT(*) as c FROM users WHERE email = ?", ("admin@example.com",))
    if cur.fetchone()["c"] == 0:
        pw = generate_password_hash("admin123")
        cur.execute("INSERT INTO users (email,password,fullname,is_admin) VALUES (?,?,?,1)", ("admin@example.com", pw, "Admin"))
        print("Created admin user: admin@example.com / admin123")
    db.commit()

# --- CLI for initializing DB ---
def cli_initdb():
    with app.app_context():
        init_db(with_seed=True)
        print("DB initialisiert unter:", app.config["DATABASE"])

# --- Auth helper ---
def current_user():
    uid = session.get("user_id")
    if not uid:
        return None
    row = query_db("SELECT id,email,fullname,is_admin,address,city,postalcode FROM users WHERE id = ?", (uid,), one=True)
    return dict(row) if row else None

def login_user(user_id):
    session.clear()
    session["user_id"] = user_id

# --- Routes: Frontend simple serving ---
@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/shop")
def shop_page():
    # Protect on frontend but allow direct static file; we also provide an endpoint to check auth.
    return send_from_directory(app.static_folder, "shop.html")

@app.route("/admin")
def admin_page():
    return send_from_directory(app.static_folder, "admin.html")

# --- API endpoints ---
@app.route("/api/status")
def api_status():
    return jsonify({"ok": True, "logged_in": current_user() is not None})

# Auth: register
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
        cur.execute("INSERT INTO users (email,password,fullname,address,city,postalcode) VALUES (?,?,?,?,?,?)",
                    (email, generate_password_hash(password), fullname, address, city, postalcode))
        db.commit()
        user_id = cur.lastrowid
        login_user(user_id)
        return jsonify({"ok": True, "user_id": user_id})
    except sqlite3.IntegrityError:
        return jsonify({"error": "Email bereits registriert"}), 400

# Auth: login
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

    if check_password_hash(user["password"], password):
        login_user(user["id"])
        return jsonify({"ok": True})
    else:
        return jsonify({"error": "Ungültige Anmeldedaten"}), 400

# Auth: logout
@app.route("/api/logout", methods=["POST"])
def api_logout():
    session.clear()
    return jsonify({"ok": True})

# Get current user profile
@app.route("/api/me")
def api_me():
    u = current_user()
    if not u:
        return jsonify({"user": None})
    return jsonify({"user": u})

# Products
@app.route("/api/products")
def api_products():
    rows = query_db("SELECT id,name,description,price_cents,stock FROM products ORDER BY id")
    products = [dict(r) for r in rows]
    return jsonify({"products": products})

# Place an order (requires login)
@app.route("/api/order", methods=["POST"])
def api_order():
    u = current_user()
    if not u:
        return jsonify({"error": "Nicht angemeldet"}), 401

    data = request.json or {}
    items = data.get("items", [])  # [{product_id, qty}, ...]
    if not items:
        return jsonify({"error": "Keine Artikel im Warenkorb"}), 400

    db = get_db()
    cur = db.cursor()
    total = 0
    # Validate and compute total
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

    # Create order
    cur.execute("INSERT INTO orders (user_id,total_cents) VALUES (?,?)", (u["id"], total))
    order_id = cur.lastrowid
    for it in items:
        pid = int(it.get("product_id"))
        qty = int(it.get("qty", 0))
        if qty <= 0:
            continue
        p = query_db("SELECT price_cents,stock FROM products WHERE id = ?", (pid,), one=True)
        cur.execute("INSERT INTO order_items (order_id,product_id,qty,price_cents) VALUES (?,?,?,?)",
                    (order_id, pid, qty, p["price_cents"]))
        # reduce stock
        cur.execute("UPDATE products SET stock = stock - ? WHERE id = ?", (qty, pid))

    db.commit()
    return jsonify({"ok": True, "order_id": order_id})

# Admin: add product (simple)
@app.route("/api/admin/product", methods=["POST"])
def api_admin_add_product():
    u = current_user()
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

# Static assets fallback (for JS/CSS)
@app.route("/static/<path:filename>")
def static_files(filename):
    # Serve files from frontend directory (../frontend/js etc.)
    frontend_root = os.path.join(os.path.dirname(BASE_DIR), "frontend")
    return send_from_directory(frontend_root, filename)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--init-db", action="store_true", help="Init DB and seed data")
    args = parser.parse_args()
    if args.init_db:
        with app.app_context():
            init_db(with_seed=True)
        print("DB initialisiert.")
    else:
        app.run(host="0.0.0.0", port=5000, debug=app.config["DEBUG"])
