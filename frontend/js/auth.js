// Auth UI logic for index.html
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');
  const statusDiv = document.getElementById('status');
  
  document.getElementById('show-register').onclick = (e) => { 
    e.preventDefault(); 
    loginForm.style.display='none'; 
    regForm.style.display='block'; 
    statusDiv.innerText = '';
  };
  
  document.getElementById('show-login').onclick = (e) => { 
    e.preventDefault(); 
    regForm.style.display='none'; 
    loginForm.style.display='block'; 
    statusDiv.innerText = '';
  };

  document.getElementById('btn-login').onclick = async () => {
    try {
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      await api('/api/login', {method:'POST', body:{email,password}});
      window.location.href = '/shop';
    } catch (err) {
      alert(err.error || 'Login fehlgeschlagen');
    }
  };

  // E-Mail Validierung Funktion
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Adressprüfung mit OpenStreetMap API (Schweiz)
  async function validateAddressSwitzerland(address, city, postalcode) {
    try {
      // Kombiniere die Adressdaten für die Suche
      const query = encodeURIComponent(`${address}, ${postalcode} ${city}, Schweiz`);
      
      // OpenStreetMap Nominatim API für Schweiz
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&countrycodes=ch&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'TCM-Webshop/1.0 (schule@tcm.ch)'
          }
        }
      );
      
      if (!response.ok) {
        console.error('OpenStreetMap API Fehler:', response.status);
        return false;
      }
      
      const data = await response.json();
      
      // Wenn Ergebnisse vorhanden sind, ist die Adresse gültig
      return data && data.length > 0;
    } catch (error) {
      console.error('Adressvalidierung fehlgeschlagen:', error);
      return false; // Bei Fehler nicht registrieren lassen
    }
  }

  document.getElementById('btn-register').onclick = async () => {
    try {
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const fullname = document.getElementById('reg-fullname').value.trim();
      const address = document.getElementById('reg-address').value.trim();
      const city = document.getElementById('reg-city').value.trim();
      const postalcode = document.getElementById('reg-postal').value.trim();
      
      // Status zurücksetzen
      statusDiv.innerText = '';
      statusDiv.style.color = '#f87171';
      
      // 1. E-Mail Validierung
      if (!validateEmail(email)) {
        statusDiv.innerText = 'Bitte geben Sie eine gültige E-Mail Adresse ein.';
        document.getElementById('reg-email').classList.add('error');
        return;
      }
      
      // 2. PLZ Validierung (Schweiz: 4-stellig)
      const postalRegex = /^\d{4}$/;
      if (!postalRegex.test(postalcode)) {
        statusDiv.innerText = 'Die PLZ muss eine 4-stellige Zahl sein.';
        document.getElementById('reg-postal').classList.add('error');
        return;
      }
      
      // 3. Adressvalidierung mit OpenStreetMap
      statusDiv.innerText = 'Überprüfe Adresse...';
      statusDiv.style.color = '#60a5fa';
      
      const isAddressValid = await validateAddressSwitzerland(address, city, postalcode);
      
      if (!isAddressValid) {
        statusDiv.innerText = 'Die Adresse konnte nicht verifiziert werden. Bitte überprüfen Sie Strasse, PLZ und Stadt.';
        statusDiv.style.color = '#f87171';
        document.getElementById('reg-address').classList.add('error');
        document.getElementById('reg-city').classList.add('error');
        document.getElementById('reg-postal').classList.add('error');
        return;
      }
      
      // Alle Validierungen bestanden - Registrierung durchführen
      statusDiv.innerText = 'Registrierung wird durchgeführt...';
      statusDiv.style.color = '#4ade80';
      
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
      
      window.location.href = '/shop';
      
    } catch (err) {
      statusDiv.innerText = err.error || 'Registrierung fehlgeschlagen';
      statusDiv.style.color = '#f87171';
      
      // Spezifische Fehler anzeigen
      if (err.error && err.error.includes('Email bereits registriert')) {
        document.getElementById('reg-email').classList.add('error');
      }
    }
  };
});
