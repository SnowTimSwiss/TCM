#!/bin/bash

# =============================================================================
# Webshop Installation Script - für einfaches deployen des TCM - Shops
# =============================================================================

# Farbdefinitionen für farbige Konsolenausgaben
# Jede Variable enthält ANSI Escape-Codes für bestimmte Farben
GREEN="\e[32m"    # Grün für Erfolgsmeldungen
RED="\e[31m"      # Rot für Fehlermeldungen
YELLOW="\e[33m"   # Gelb für Warnungen
BLUE="\e[34m"     # Blau für Informationsmeldungen
CYAN="\e[36m"     # Cyan für Schrittüberschriften
RESET="\e[0m"     # Reset für normale Textfarbe

# Funktionen für formatierte Ausgaben
# Jede Funktion gibt Text mit entsprechender Farbe und Prefix aus

# Normale Statusmeldungen (blau)
print_status() {
    echo -e "${BLUE}[INFO]${RESET} $1"
}

# Erfolgsmeldungen (grün)
print_success() {
    echo -e "${GREEN}[ERFOLG]${RESET} $1"
}

# Warnungen (gelb)
print_warning() {
    echo -e "${YELLOW}[WARNUNG]${RESET} $1"
}

# Fehlermeldungen (rot)
print_error() {
    echo -e "${RED}[FEHLER]${RESET} $1"
}

# Schrittüberschriften (cyan)
print_step() {
    echo -e "\n${CYAN}=== Schritt $1/7: $2 ===${RESET}"
}

# =============================================================================
# START DES INSTALLATIONSSKRIPTS
# =============================================================================

# ASCII-Art Banner für den Installer
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════╗"
echo "║           Webshop Installer                  ║"
echo "║              TCM - Shop                      ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${RESET}"

# ---------- VORBEDINGUNGEN PRÜFEN ----------
# Prüft ob Python 3 installiert ist (Hauptvoraussetzung)
print_step "1" "Prüfe Systemvoraussetzungen"

print_status "Prüfe Python 3 Installation..."
# Versucht Python-Version zu ermitteln
PYTHON_VERSION=$(python3 -c "import sys; print(f'Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')" 2>/dev/null)
# $? enthält den Exit-Status des letzten Befehls (0 = Erfolg)
if [ $? -eq 0 ]; then
    print_success "$PYTHON_VERSION gefunden"
else
    print_error "Python 3 ist nicht installiert oder nicht im PATH"
    print_status "Bitte installieren Sie Python 3.8 oder höher"
    exit 1  # Beendet das Skript mit Fehlercode 1
fi

# ---------- VIRTUELLE UMGEBUNG ERSTELLEN ----------
# Erstellt eine isolierte Python-Umgebung für das Projekt
print_step "2" "Erstelle virtuelle Python-Umgebung"

# Prüft ob virtuelle Umgebung bereits existiert
if [ -d "venv" ]; then
    print_warning "Virtuelle Umgebung 'venv' existiert bereits"
    # Fragt Benutzer ob bestehende Umgebung überschrieben werden soll
    read -p "Neue erstellen? (j/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Jj]$ ]]; then
        print_status "Entferne bestehende virtuelle Umgebung..."
        rm -rf venv  # Löscht das venv-Verzeichnis
    else
        print_status "Verwende bestehende virtuelle Umgebung"
    fi
fi

# Wenn venv nicht existiert (oder gerade gelöscht wurde), erstelle es
if [ ! -d "venv" ]; then
    print_status "Erstelle neue virtuelle Umgebung..."
    python3 -m venv venv  # Offizieller Weg um virtuelle Umgebung zu erstellen
    if [ $? -eq 0 ]; then
        print_success "Virtuelle Umgebung erfolgreich erstellt"
    else
        print_error "Fehler beim Erstellen der virtuellen Umgebung"
        exit 1
    fi
fi

# ---------- VIRTUELLE UMGEBUNG AKTIVIEREN ----------
# Aktiviert die virtuelle Umgebung für die aktuelle Shell-Sitzung
print_step "3" "Aktiviere virtuelle Umgebung"

print_status "Aktiviere venv..."
source venv/bin/activate  # Lädt die Aktivierungs-Skripte
if [ $? -eq 0 ]; then
    print_success "Virtuelle Umgebung aktiviert"
else
    print_error "Konnte virtuelle Umgebung nicht aktivieren"
    exit 1
fi

# ---------- PYTHON PAKETE INSTALLIEREN ----------
# Installiert alle benötigten Python-Bibliotheken
print_step "4" "Installiere Python-Abhängigkeiten"

print_status "Aktualisiere pip..."
pip install --upgrade pip  # Aktualisiert den Paketmanager selbst
if [ $? -eq 0 ]; then
    print_success "pip erfolgreich aktualisiert"
else
    print_error "pip Aktualisierung fehlgeschlagen"
    exit 1
fi

print_status "Installiere Projektabhängigkeiten..."
# Installiert spezifische Pakete für das Webshop-Projekt
pip install flask flask-cors python-dotenv werkzeug
if [ $? -eq 0 ]; then
    print_success "Alle Abhängigkeiten erfolgreich installiert"
else
    print_error "Fehler beim Installieren der Abhängigkeiten"
    exit 1
fi

# ---------- SICHERHEITSSLÜSSEL GENERIEREN ----------
# Erstellt eine .env Datei mit Konfigurationen und Secret Key
print_step "5" "Konfiguriere Umgebungsvariablen"

print_status "Generiere sicheren Secret Key..."
# Generiert einen zufälligen 50-stelligen Secret Key für Flask
SECRET_KEY=$(python3 -c "
import secrets
import string
alphabet = string.ascii_letters + string.digits + '!@#$%^&*'
print(''.join(secrets.choice(alphabet) for _ in range(50)))
")

# Prüft ob Secret Key erfolgreich generiert wurde
if [ -n "$SECRET_KEY" ]; then
    # Erstellt .env Datei im backend/ Verzeichnis
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
# Initialisiert die SQLite Datenbank mit Tabellen
print_step "6" "Initialisiere Datenbank"

print_status "Erstelle Datenbanktabellen..."
# Ruft die Flask-App mit speziellem Flag zur DB-Initialisierung auf
python3 backend/app.py --init-db
if [ $? -eq 0 ]; then
    print_success "Datenbank erfolgreich initialisiert"
else
    print_error "Fehler bei der Datenbankinitialisierung"
    exit 1
fi

# ---------- INSTALLATIONSBERICHT ----------
# Zeigt Zusammenfassung der Installation
print_step "7" "Installationszusammenfassung"

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════╗"
echo "║           Installation abgeschlossen        ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${RESET}"

print_status "Versionsinformationen:"
echo "  - Python: $(python3 --version | cut -d' ' -f2)"  # Extrahiert nur die Versionsnummer
echo "  - pip: $(pip --version | cut -d' ' -f2)"         # Extrahiert pip Version

print_status "Installierte Pakete:"
# Listet nur die relevanten installierten Pakete auf
pip list --format=columns | grep -E "(flask|Werkzeug|python-dotenv)"

print_status "Projektstruktur:"
# Prüft ob Datenbankdatei existiert und zeigt Größe an
if [ -f "backend/webshop.db" ]; then
    DB_SIZE=$(du -h "backend/webshop.db" | cut -f1)  # Größe in lesbarem Format
    echo "  - Datenbank: backend/webshop.db ($DB_SIZE)"
else
    print_warning "  - Datenbankdatei nicht gefunden"
fi

# ---------- SERVER STARTEN ----------
# Startet den Flask-Development-Server
echo -e "\n${GREEN}"
echo "╔══════════════════════════════════════════════╗"
echo "║              Webshop Backend                 ║"
echo "║               Startet jetzt                  ║"
echo "║   Shop verfügbar auf http://localhost:5000   ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${RESET}"

print_warning "Drücken Sie Ctrl+C um den Server zu stoppen"
echo ""

# Startet die Flask-Anwendung
python3 backend/app.py
