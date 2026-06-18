(() => {
  const endpoint = '/api/analytics';
  const visitorKey = 'amin_analytics_visitor';
  const sessionKey = 'amin_analytics_session';
  const sessionStartedKey = 'amin_analytics_session_started';
  const sessionDuration = 30 * 60 * 1000;

  if (navigator.doNotTrack === '1') return;

  const visitorId = getOrCreateId(visitorKey, 'v');
  const sessionId = getSessionId();
  window.aminTrackEvent = sendEvent;
  sendEvent({ type: 'page_view' });

  function sendEvent(eventPayload) {
    const payload = {
      type: eventPayload?.type || 'page_view',
      path: location.pathname || '/',
      title: document.title || '',
      referrer: document.referrer || '',
      visitorId,
      sessionId,
      screenWidth: window.innerWidth || 0,
      language: navigator.language || '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      shortId: eventPayload?.shortId || '',
      shortTitle: eventPayload?.shortTitle || ''
    };

    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
      return;
    }

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true
    }).catch(() => {});
  }

  function getSessionId() {
    const started = Number(readStorage(sessionStorage, sessionStartedKey) || 0);
    const current = readStorage(sessionStorage, sessionKey);

    if (current && Date.now() - started < sessionDuration) {
      writeStorage(sessionStorage, sessionStartedKey, String(Date.now()));
      return current;
    }

    const next = createId('s');
    writeStorage(sessionStorage, sessionKey, next);
    writeStorage(sessionStorage, sessionStartedKey, String(Date.now()));
    return next;
  }

  function getOrCreateId(key, prefix) {
    const current = readStorage(localStorage, key);
    if (current) return current;

    const next = createId(prefix);
    writeStorage(localStorage, key, next);
    return next;
  }

  function readStorage(storage, key) {
    try {
      return storage.getItem(key);
    } catch {
      return '';
    }
  }

  function writeStorage(storage, key, value) {
    try {
      storage.setItem(key, value);
    } catch {}
  }

  function createId(prefix) {
    if (crypto?.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
})();
