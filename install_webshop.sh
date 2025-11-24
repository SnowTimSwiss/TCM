#!/bin/bash

# Farben
GREEN="\e[32m"
RED="\e[31m"
YELLOW="\e[33m"
RESET="\e[0m"

echo -e "${GREEN}==== Webshop Installer gestartet ====${RESET}"

# ---------- CHECKS ----------
echo -e "${YELLOW}[CHECK] Prüfe Python-Version...${RESET}"
PYVER=$(python3 -c "import sys; print(sys.version_info.major)")
if [ "$PYVER" != "3" ]; then
    echo -e "${RED}Python3 nicht gefunden! Installiere es zuerst.${RESET}"
    exit 1
fi


# ---------- STEP 1: VENV ----------
echo -e "${YELLOW}[1/7] Erstelle virtuelle Umgebung...${RESET}"
python3 -m venv venv || { echo -e "${RED}Fehler beim Erstellen der venv!${RESET}"; exit 1; }


# ---------- STEP 2: ACTIVATE VENV ----------
echo -e "${YELLOW}[2/7] Aktiviere venv...${RESET}"
source venv/bin/activate || { echo -e "${RED}venv konnte nicht aktiviert werden!${RESET}"; exit 1; }


# ---------- STEP 3: INSTALL REQUIREMENTS ----------
echo -e "${YELLOW}[3/7] Installiere Python-Pakete...${RESET}"
pip install --upgrade pip || { echo -e "${RED}pip Upgrade fehlgeschlagen!${RESET}"; exit 1; }
pip install flask flask-cors python-dotenv werkzeug || {
    echo -e "${RED}Fehler beim Installieren der Pakete!${RESET}"
    exit 1
}


# ---------- STEP 4: SECRET KEY ----------
echo -e "${YELLOW}[4/7] Erstelle SECRET_KEY...${RESET}"
SECRET=$(python3 - <<EOF
import secrets
print(secrets.token_hex(32))
EOF
)

if [ -z "$SECRET" ]; then
    echo -e "${RED}SECRET_KEY konnte nicht generiert werden!${RESET}"
    exit 1
fi

echo "SECRET_KEY=$SECRET" > backend/.env


# ---------- STEP 5: INIT DB ----------
echo -e "${YELLOW}[5/7] Initialisiere Datenbank...${RESET}"
python3 backend/app.py --init-db || {
    echo -e "${RED}Fehler bei der Datenbank-Initialisierung!${RESET}"
    exit 1
}


# ---------- STEP 6: DEBUG INFOS ----------
echo -e "${YELLOW}[6/7] Debug Infos:${RESET}"
echo -e "${GREEN}Python Version:${RESET}"
python3 --version
echo ""
echo -e "${GREEN}Installierte Pakete:${RESET}"
pip list
echo ""
echo -e "${GREEN}Datenbankdatei:${RESET}"
ls -l backend/webshop.db || echo -e "${RED}Datenbank nicht gefunden!${RESET}"


# ---------- STEP 7: START SERVER ----------
echo -e "${YELLOW}[7/7] Starte Webshop Backend...${RESET}"
echo ""
echo -e "${GREEN}============================================${RESET}"
echo -e "${GREEN}  Der Webshop läuft jetzt unter:${RESET}"
echo -e "${GREEN}      http://localhost:5000${RESET}"
echo -e "${GREEN}============================================${RESET}"
echo ""
echo -e "${YELLOW}Log-Ausgabe folgt unten (CTRL + C zum Stoppen)${RESET}"
echo ""

python3 backend/app.py
