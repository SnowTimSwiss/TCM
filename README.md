# TCM – Webshop
## Projektstruktur

```
TCM/
├── backend/            # API, Logik, Datenverarbeitung
├── frontend/           # Webshop‑Oberfläche
|└──js/                 # Javascript
├── install_webshop.sh  # Automatisches Installationsskript
└── README.md
```

---

## Voraussetzungen

* Linux‑Server oder lokales Linux‑System
* Bash‑Unterstützung
* Python 1.13 (für das Backend)

---

## Installation

1. **Repository klonen:**

```bash
git clone https://github.com/SnowTimSwiss/TCM.git
cd TCM
```

2. **Installationsskript ausführen:**

```bash
chmod +x install_webshop.sh
./install_webshop.sh
```

Das Skript richtet alle benötigten Abhängigkeiten ein und startet die Grundkonfiguration.

3. **Backend und Frontend starten:**

Der Webserver wird automatisch auf port 5000 gehostet

---
