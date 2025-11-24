#!/bin/bash

# =============================================================================
# Webshop Installation Script - für einfaches deployen des TCM - Shops
# =============================================================================

# Farbdefinitionen für bessere Lesbarkeit
GREEN="\e[32m"
RED="\e[31m"
YELLOW="\e[33m"
BLUE="\e[34m"
CYAN="\e[36m"
RESET="\e[0m"

# Funktion für formatierte Ausgaben
print_status() {
    echo -e "${BLUE}[INFO]${RESET} $1"
}

print_success() {
    echo -e "${GREEN}[ERFOLG]${RESET} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNUNG]${RESET} $1"
}

print_error() {
    echo -e "${RED}[FEHLER]${RESET} $1"
}

print_step() {
    echo -e "\n${CYAN}=== Schritt $1/7: $2 ===${RESET}"
}

# =============================================================================
# START DES INSTALLATIONSSKRIPTS
# =============================================================================

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════╗"
echo "║           Webshop Installer                  ║"
echo "║              TCM - Shop                      ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${RESET}"

# ---------- VORBEDINGUNGEN PRÜFEN ----------
print_step "1" "Prüfe Systemvoraussetzungen"

print_status "Prüfe Python 3 Installation..."
PYTHON_VERSION=$(python3 -c "import sys; print(f'Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')" 2>/dev/null)
if [ $? -eq 0 ]; then
    print_success "$PYTHON_VERSION gefunden"
else
    print_error "Python 3 ist nicht installiert oder nicht im PATH"
    print_status "Bitte installieren Sie Python 3.8 oder höher"
    exit 1
fi

# ---------- VIRTUELLE UMGEBUNG ERSTELLEN ----------
print_step "2" "Erstelle virtuelle Python-Umgebung"

if [ -d "venv" ]; then
    print_warning "Virtuelle Umgebung 'venv' existiert bereits"
    read -p "Neue erstellen? (j/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Jj]$ ]]; then
        print_status "Entferne bestehende virtuelle Umgebung..."
        rm -rf venv
    else
        print_status "Verwende bestehende virtuelle Umgebung"
    fi
fi

if [ ! -d "venv" ]; then
    print_status "Erstelle neue virtuelle Umgebung..."
    python3 -m venv venv
    if [ $? -eq 0 ]; then
        print_success "Virtuelle Umgebung erfolgreich erstellt"
    else
        print_error "Fehler beim Erstellen der virtuellen Umgebung"
        exit 1
    fi
fi

# ---------- VIRTUELLE UMGEBUNG AKTIVIEREN ----------
print_step "3" "Aktiviere virtuelle Umgebung"

print_status "Aktiviere venv..."
source venv/bin/activate
if [ $? -eq 0 ]; then
    print_success "Virtuelle Umgebung aktiviert"
else
    print_error "Konnte virtuelle Umgebung nicht aktivieren"
    exit 1
fi

# ---------- PYTHON PAKETE INSTALLIEREN ----------
print_step "4" "Installiere Python-Abhängigkeiten"

print_status "Aktualisiere pip..."
pip install --upgrade pip
if [ $? -eq 0 ]; then
    print_success "pip erfolgreich aktualisiert"
else
    print_error "pip Aktualisierung fehlgeschlagen"
    exit 1
fi

print_status "Installiere Projektabhängigkeiten..."
pip install flask flask-cors python-dotenv werkzeug
if [ $? -eq 0 ]; then
    print_success "Alle Abhängigkeiten erfolgreich installiert"
else
    print_error "Fehler beim Installieren der Abhängigkeiten"
    exit 1
fi

# ---------- SICHERHEITSSCHLÜSSEL GENERIEREN ----------
print_step "5" "Konfiguriere Umgebungsvariablen"

print_status "Generiere sicheren Secret Key..."
SECRET_KEY=$(python3 -c "
import secrets
import string
alphabet = string.ascii_letters + string.digits + '!@#$%^&*'
print(''.join(secrets.choice(alphabet) for _ in range(50)))
")

if [ -n "$SECRET_KEY" ]; then
    # Erstelle .env Datei mit allen notwendigen Konfigurationen
    cat > backend/.env << EOF
# Webshop Konfiguration
# Automatisch generiert am $(date)

SECRET_KEY=$SECRET_KEY
FLASK_ENV=development
FLASK_DEBUG=True

# Datenbank Konfiguration
DATABASE_PATH=backend/webshop.db
EOF
    print_success "Umgebungsvariablen in backend/.env konfiguriert"
else
    print_error "Konnte Secret Key nicht generieren"
    exit 1
fi

# ---------- DATENBANK INITIALISIEREN ----------
print_step "6" "Initialisiere Datenbank"

print_status "Erstelle Datenbanktabellen..."
python3 backend/app.py --init-db
if [ $? -eq 0 ]; then
    print_success "Datenbank erfolgreich initialisiert"
else
    print_error "Fehler bei der Datenbankinitialisierung"
    exit 1
fi

# ---------- INSTALLATIONSBERICHT ----------
print_step "7" "Installationszusammenfassung"

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════╗"
echo "║           Installation abgeschlossen        ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${RESET}"

print_status "Versionsinformationen:"
echo "  - Python: $(python3 --version | cut -d' ' -f2)"
echo "  - pip: $(pip --version | cut -d' ' -f2)"

print_status "Installierte Pakete:"
pip list --format=columns | grep -E "(flask|Werkzeug|python-dotenv)"

print_status "Projektstruktur:"
if [ -f "backend/webshop.db" ]; then
    DB_SIZE=$(du -h "backend/webshop.db" | cut -f1)
    echo "  - Datenbank: backend/webshop.db ($DB_SIZE)"
else
    print_warning "  - Datenbankdatei nicht gefunden"
fi

# ---------- SERVER STARTEN ----------
echo -e "\n${GREEN}"
echo "╔══════════════════════════════════════════════╗"
echo "║              Webshop Backend                 ║"
echo "║               Startet jetzt                  ║"
echo "║   Shop verfügbar auf http://localhost:5000   ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${RESET}"

print_status "Server URL: http://localhost:5000"
print_status "API Documentation: http://localhost:5000/api/docs"
echo ""
print_warning "Drücken Sie Ctrl+C um den Server zu stoppen"
echo ""

# Starte den Flask Development Server
print_status "Starte Flask Development Server..."
python3 backend/app.py
