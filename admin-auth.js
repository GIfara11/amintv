(() => {
  const authShell = document.querySelector('[data-auth-shell]');
  const adminShell = document.querySelector('[data-admin-shell]');
  const authForm = document.querySelector('[data-auth-form]');
  const authStatus = document.querySelector('[data-auth-status]');
  const logoutButton = document.querySelector('[data-admin-logout]');
  const sessionLabel = document.querySelector('[data-session-label]');
  const passwordInput = document.querySelector('[data-admin-password]');
  const refreshButton = document.querySelector('[data-admin-refresh]');

  const sessionMarker = '__session__';

  if (!authShell || !adminShell || !authForm || !authStatus || !passwordInput) return;

  authForm.addEventListener('submit', handleLogin);
  logoutButton?.addEventListener('click', handleLogout);

  checkSession();

  async function checkSession() {
    setAuthStatus('Проверяю сессию...');

    try {
      const response = await fetch('/api/admin-auth', { cache: 'no-store' });
      if (!response.ok) throw new Error('Session not found');
      const payload = await response.json();
      showAdmin(payload.user?.label || 'AMIN TV admin');
    } catch {
      showLogin();
    }
  }

  async function handleLogin(event) {
    event.preventDefault();

    const submit = authForm.querySelector('[type="submit"]');
    const password = String(authForm.elements.password.value || '').trim();
    if (!password) {
      setAuthStatus('Введи пароль администратора.');
      return;
    }

    submit.disabled = true;
    setAuthStatus('Вхожу в админку...');

    try {
      const response = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Пароль неверный.');

      authForm.reset();
      showAdmin(payload.user?.label || 'AMIN TV admin');
    } catch (error) {
      setAuthStatus(error.message || 'Не удалось войти. Проверь пароль.');
    } finally {
      submit.disabled = false;
    }
  }

  async function handleLogout() {
    logoutButton.disabled = true;

    try {
      await fetch('/api/admin-auth', { method: 'DELETE' });
    } finally {
      passwordInput.value = '';
      clearAdminData();
      showLogin();
      logoutButton.disabled = false;
    }
  }

  function showAdmin(label) {
    passwordInput.value = sessionMarker;
    sessionLabel.textContent = label;
    document.body.classList.add('is-authenticated');
    authShell.hidden = true;
    adminShell.hidden = false;
    setAuthStatus('');
    refreshButton?.click();
  }

  function showLogin() {
    passwordInput.value = '';
    document.body.classList.remove('is-authenticated');
    authShell.hidden = false;
    adminShell.hidden = true;
    sessionLabel.textContent = 'Не авторизован';
    setAuthStatus('Сессии нет. Войди по паролю администратора.');
    authForm.elements.password.focus();
  }

  function clearAdminData() {
    document.querySelectorAll('[data-admin-stats], [data-dashboard-chart], [data-dashboard-health], [data-dashboard-insights], [data-dashboard-activity], [data-admin-list], [data-analytics-stats], [data-analytics-chart], [data-analytics-pages], [data-analytics-referrers], [data-analytics-devices], [data-analytics-recent]').forEach((node) => {
      node.innerHTML = '';
    });
  }

  function setAuthStatus(message) {
    authStatus.textContent = message;
  }
})();
