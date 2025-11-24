// Auth UI logic for index.html
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');
  document.getElementById('show-register').onclick = (e) => { e.preventDefault(); loginForm.style.display='none'; regForm.style.display='block'; };
  document.getElementById('show-login').onclick = (e) => { e.preventDefault(); regForm.style.display='none'; loginForm.style.display='block'; };

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

  document.getElementById('btn-register').onclick = async () => {
    try {
      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;
      const fullname = document.getElementById('reg-fullname').value;
      const address = document.getElementById('reg-address').value;
      const city = document.getElementById('reg-city').value;
      const postalcode = document.getElementById('reg-postal').value;
      await api('/api/register', {method:'POST', body:{email,password,fullname,address,city,postalcode}});
      window.location.href = '/shop';
    } catch (err) {
      alert(err.error || 'Registrierung fehlgeschlagen');
    }
  };
});
