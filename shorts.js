const feed = document.querySelector('[data-shorts-feed]');
const WHATSAPP_PHONE = '992980656565';
let observer;
const trackedViews = new Set();

loadShorts();

async function loadShorts() {
  try {
    const response = await fetch('/api/shorts');
    if (!response.ok) throw new Error('Не удалось загрузить ленту');
    const shorts = await response.json();
    render(shorts);
  } catch (error) {
    feed.innerHTML = `<div class="feed-state">${escapeHtml(error.message)}</div>`;
  }
}

function render(shorts) {
  if (!shorts.length) {
    feed.innerHTML = '<div class="feed-state">Первый short скоро появится.</div>';
    return;
  }

  feed.innerHTML = shorts.map((short) => `
    <article class="short-card" data-short-id="${escapeAttribute(short.id)}" data-short-title="${escapeAttribute(short.title)}">
      <video src="${escapeAttribute(short.videoUrl)}" playsinline muted loop preload="metadata"></video>
      <div class="short-copy">
        <h2>${escapeHtml(short.title)}</h2>
        ${short.caption ? `<p>${escapeHtml(short.caption)}</p>` : ''}
        <a
          class="short-ticket"
          href="${escapeAttribute(buildTicketLink(short.title))}"
          target="_blank"
          rel="noopener"
        >
          Купить билет
        </a>
      </div>
      <button class="sound-toggle" type="button" aria-label="Включить звук">Звук</button>
    </article>
  `).join('');

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target.querySelector('video');
      if (entry.isIntersecting && entry.intersectionRatio >= 0.72) {
        document.querySelectorAll('.short-card video').forEach((item) => {
          if (item !== video) item.pause();
        });
        video.play().catch(() => {});
        trackShortView(entry.target);
      } else {
        video.pause();
      }
    });
  }, { root: feed, threshold: [0.72] });

  document.querySelectorAll('.short-card').forEach((card) => {
    observer.observe(card);
    const video = card.querySelector('video');
    const button = card.querySelector('.sound-toggle');
    button.addEventListener('click', () => {
      video.muted = !video.muted;
      button.textContent = video.muted ? 'Звук' : 'Тихо';
      button.setAttribute('aria-label', video.muted ? 'Включить звук' : 'Выключить звук');
      video.play().catch(() => {});
    });
  });
}

function trackShortView(card) {
  const shortId = card.dataset.shortId || '';
  if (!shortId || trackedViews.has(shortId)) return;

  trackedViews.add(shortId);
  const payload = {
    type: 'short_view',
    shortId,
    shortTitle: card.dataset.shortTitle || ''
  };

  if (typeof window.aminTrackEvent === 'function') {
    window.aminTrackEvent(payload);
    return;
  }

  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      path: location.pathname || '/',
      title: document.title || '',
      referrer: document.referrer || '',
      visitorId: getOrCreateId('amin_analytics_visitor', 'v'),
      sessionId: getSessionId(),
      screenWidth: window.innerWidth || 0,
      language: navigator.language || '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    }),
    keepalive: true
  }).catch(() => {});
}

function buildTicketLink(title) {
  const message = `Здравствуйте, хочу купить билет: ${title}`;
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}

function getSessionId() {
  const sessionKey = 'amin_analytics_session';
  const startedKey = 'amin_analytics_session_started';
  const duration = 30 * 60 * 1000;
  const started = Number(readStorage(sessionStorage, startedKey) || 0);
  const current = readStorage(sessionStorage, sessionKey);

  if (current && Date.now() - started < duration) {
    writeStorage(sessionStorage, startedKey, String(Date.now()));
    return current;
  }

  const next = createId('s');
  writeStorage(sessionStorage, sessionKey, next);
  writeStorage(sessionStorage, startedKey, String(Date.now()));
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

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (mark) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[mark]));
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
