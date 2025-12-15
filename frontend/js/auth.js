// Auth UI logic for index.html
// Diese Datei enthält die Logik für Login und Registrierung auf der Startseite

// Wartet bis das DOM vollständig geladen ist
document.addEventListener('DOMContentLoaded', () => {
  // DOM-Elemente referenzieren
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');
  const statusDiv = document.getElementById('status');
  
  // Event-Listener für "Zur Registrierung"-Button
  // Zeigt das Registrierungsformular und versteckt das Login-Formular
  document.getElementById('show-register').onclick = (e) => { 
    e.preventDefault(); // Verhindert Standard-Link-Verhalten
    loginForm.style.display='none'; // Versteckt Login-Formular
    regForm.style.display='block'; // Zeigt Registrierungsformular
    statusDiv.innerText = ''; // Leert Statusmeldung
  };
  
  // Event-Listener für "Zum Login"-Button
  // Zeigt das Login-Formular und versteckt das Registrierungsformular
  document.getElementById('show-login').onclick = (e) => { 
    e.preventDefault(); // Verhindert Standard-Link-Verhalten
    regForm.style.display='none'; // Versteckt Registrierungsformular
    loginForm.style.display='block'; // Zeigt Login-Formular
    statusDiv.innerText = ''; // Leert Statusmeldung
  };

  // Event-Listener für Login-Button
  document.getElementById('btn-login').onclick = async () => {
    try {
      // Holt Eingabewerte aus Login-Formular
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      // Sendet Login-Request an API
      await api('/api/login', {
        method:'POST', 
        body:{email, password}
      });
      
      // Bei Erfolg: Weiterleitung zum Shop
      window.location.href = '/shop';
      
    } catch (err) {
      // Fehlerbehandlung: Zeigt Fehlermeldung
      alert(err.error || 'Login fehlgeschlagen');
    }
  };

  // Hilfsfunktion: E-Mail Validierung
  // Prüft ob eine gültige E-Mail-Adresse vorliegt
  function validateEmail(email) {
    // Regex für E-Mail-Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Hilfsfunktion: Adressvalidierung für Schweiz mit OpenStreetMap API
  // Prüft ob Adresse, Stadt und PLZ eine gültige Schweizer Adresse ergeben
  async function validateAddressSwitzerland(address, city, postalcode) {
    try {
      // Kombiniert Adressdaten zu einem Suchstring
      const query = encodeURIComponent(`${address}, ${postalcode} ${city}, Schweiz`);
      
      // Ruft OpenStreetMap Nominatim API auf
      // countrycodes=ch filtert nur Schweizer Adressen
      // format=json für JSON-Antwort
      // limit=1 für nur ein Ergebnis
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&countrycodes=ch&format=json&limit=1`,
        {
          headers: {
            // User-Agent ist erforderlich für Nominatim API
            'User-Agent': 'TCM-Webshop/1.0 (schule@tcm.ch)'
          }
        }
      );
      
      // Prüft ob HTTP-Request erfolgreich war
      if (!response.ok) {
        console.error('OpenStreetMap API Fehler:', response.status);
        return false;
      }
      
      // Parst JSON-Antwort
      const data = await response.json();
      
      // Wenn Ergebnisse vorhanden sind, ist die Adresse gültig
      return data && data.length > 0;
      
    } catch (error) {
      // Fehlerbehandlung bei Netzwerkproblemen oder anderen Fehlern
      console.error('Adressvalidierung fehlgeschlagen:', error);
      return false; // Bei Fehler nicht registrieren lassen
    }
  }

  // Event-Listener für Registrierungs-Button
  document.getElementById('btn-register').onclick = async () => {
    try {
      // Holt alle Eingabewerte aus Registrierungsformular
      // .trim() entfernt Leerzeichen am Anfang/Ende
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const fullname = document.getElementById('reg-fullname').value.trim();
      const address = document.getElementById('reg-address').value.trim();
      const city = document.getElementById('reg-city').value.trim();
      const postalcode = document.getElementById('reg-postal').value.trim();
      
      // Status-Div zurücksetzen
      statusDiv.innerText = '';
      statusDiv.style.color = '#f87171'; // Rot (Tailwind: red-400)
      
      // ========== VALIDIERUNGEN ==========
      
      // 1. E-Mail Validierung
      if (!validateEmail(email)) {
        statusDiv.innerText = 'Bitte geben Sie eine gültige E-Mail Adresse ein.';
        document.getElementById('reg-email').classList.add('error'); // CSS-Klasse für Fehler-Anzeige
        return; // Stoppt weitere Verarbeitung
      }
      
      // 2. PLZ Validierung (Schweiz: 4-stellig)
      const postalRegex = /^\d{4}$/;
      if (!postalRegex.test(postalcode)) {
        statusDiv.innerText = 'Die PLZ muss eine 4-stellige Zahl sein.';
        document.getElementById('reg-postal').classList.add('error');
        return;
      }
      
      // 3. Adressvalidierung mit OpenStreetMap API
      statusDiv.innerText = 'Überprüfe Adresse...';
      statusDiv.style.color = '#60a5fa'; // Blau (Tailwind: blue-400)
      
      // Ruft externe API zur Adressvalidierung auf
      const isAddressValid = await validateAddressSwitzerland(address, city, postalcode);
      
      if (!isAddressValid) {
        statusDiv.innerText = 'Die Adresse konnte nicht verifiziert werden. Bitte überprüfen Sie Strasse, PLZ und Stadt.';
        statusDiv.style.color = '#f87171'; // Rot zurück
        // Markiert alle Adressfelder als fehlerhaft
        document.getElementById('reg-address').classList.add('error');
        document.getElementById('reg-city').classList.add('error');
        document.getElementById('reg-postal').classList.add('error');
        return;
      }
      
      // ========== REGISTRIERUNG ==========
      // Alle Validierungen bestanden
      
      statusDiv.innerText = 'Registrierung wird durchgeführt...';
      statusDiv.style.color = '#4ade80'; // Grün (Tailwind: green-400)
      
      // Sendet Registrierungs-Request an Backend-API
      await api('/api/register', {
        method: 'POST', 
        body: {
          email,
          password,
          fullname,
          address,
          city,
          postalcode
        }
      });
      
      // Bei Erfolg: Weiterleitung zum Shop
      window.location.href = '/shop';
      
    } catch (err) {
      // ========== FEHLERBEHANDLUNG ==========
      
      statusDiv.innerText = err.error || 'Registrierung fehlgeschlagen';
      statusDiv.style.color = '#f87171'; // Rot für Fehler
      
      // Spezifische Fehler behandeln
      if (err.error && err.error.includes('Email bereits registriert')) {
        // Markiert E-Mail-Feld bei Duplikat
        document.getElementById('reg-email').classList.add('error');
      }
    }
  };
});
