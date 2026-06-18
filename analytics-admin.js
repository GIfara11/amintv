(() => {
  const refreshButton = document.querySelector('[data-admin-refresh]');
  const rangeSelect = document.querySelector('[data-analytics-range]');
  const statusRoot = document.querySelector('[data-analytics-status]');
  const statsRoot = document.querySelector('[data-analytics-stats]');
  const chartRoot = document.querySelector('[data-analytics-chart]');
  const pagesRoot = document.querySelector('[data-analytics-pages]');
  const referrersRoot = document.querySelector('[data-analytics-referrers]');
  const devicesRoot = document.querySelector('[data-analytics-devices]');
  const recentRoot = document.querySelector('[data-analytics-recent]');

  if (!rangeSelect || !statusRoot || !statsRoot || !chartRoot || !pagesRoot || !referrersRoot || !devicesRoot || !recentRoot) {
    return;
  }

  refreshButton?.addEventListener('click', loadAnalytics);
  rangeSelect.addEventListener('change', loadAnalytics);

  async function loadAnalytics() {
    statusRoot.textContent = 'Загружаю статистику сайта...';

    try {
      const response = await fetch(`/api/analytics?days=${encodeURIComponent(rangeSelect.value)}`, {
        cache: 'no-store'
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Не удалось загрузить статистику сайта');

      renderAnalytics(payload);
      statusRoot.textContent = `Обновлено ${formatDate(payload.generatedAt)}. История начинает собираться с момента установки счётчика.`;
    } catch (error) {
      statusRoot.textContent = error.message || 'Не удалось загрузить статистику сайта';
      statsRoot.innerHTML = '';
      chartRoot.innerHTML = '';
      pagesRoot.innerHTML = '';
      referrersRoot.innerHTML = '';
      devicesRoot.innerHTML = '';
      recentRoot.innerHTML = '';
    }
  }

  function renderAnalytics(report) {
    const totals = report.totals || {};
    statsRoot.innerHTML = [
      ['Просмотры', totals.pageViews || 0, 'Все page view события'],
      ['Видео', totals.videoViews || 0, 'Запуски shorts'],
      ['Посетители', totals.visitors || 0, 'Уникальные браузеры'],
      ['Сессии', totals.sessions || 0, '30 минут активности'],
      ['Сегодня', totals.todayPageViews || 0, `${totals.todayVisitors || 0} посетителей / ${totals.todayVideoViews || 0} видео`]
    ].map(([label, value, description]) => `
      <article class="admin-stat">
        <strong>${escapeHtml(value)}</strong>
        <span>${escapeHtml(label)}</span>
        <small>${escapeHtml(description)}</small>
      </article>
    `).join('');

    renderTimeline(report.timeline || []);
    pagesRoot.innerHTML = renderRankList(report.pages || [], 'Пока нет просмотров страниц.');
    referrersRoot.innerHTML = renderRankList(report.referrers || [], 'Пока нет источников.');
    devicesRoot.innerHTML = renderRankList(report.devices || [], 'Пока нет данных по устройствам.');
    recentRoot.innerHTML = renderRecent(report.recent || []);
  }

  function renderTimeline(timeline) {
    const maxViews = Math.max(...timeline.map((item) => item.views), 1);
    chartRoot.innerHTML = timeline.map((item) => {
      const height = Math.max(8, Math.round((item.views / maxViews) * 160));
      return `
        <article class="chart-day" aria-label="${escapeAttribute(item.shortLabel)}: ${item.views}">
          <div class="chart-value">${Number(item.views || 0)}</div>
          <div class="chart-bar-wrap">
            <div class="chart-bar" style="height:${height}px"></div>
          </div>
          <div class="chart-label">${escapeHtml(item.shortLabel)}</div>
        </article>
      `;
    }).join('');
  }

  function renderRankList(items, emptyText) {
    if (!items.length) return `<div class="admin-empty">${escapeHtml(emptyText)}</div>`;

    const maxCount = Math.max(...items.map((item) => item.count), 1);
    return `
      <div class="rank-list">
        ${items.map((item) => {
          const width = Math.max(4, Math.round((item.count / maxCount) * 100));
          return `
            <article class="rank-item">
              <div class="rank-copy">
                <strong>${escapeHtml(item.label)}</strong>
                <span>${Number(item.count || 0)}</span>
              </div>
              <div class="meter-track" aria-hidden="true">
                <div class="meter-fill" data-tone="success" style="width:${width}%"></div>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderRecent(items) {
    if (!items.length) return '<div class="admin-empty">Пока нет последних визитов.</div>';

    return items.map((item) => `
      <article class="activity-item">
        <strong>${escapeHtml(item.path)}</strong>
        <div class="activity-meta">
          <span>${escapeHtml(formatDate(item.at))}</span>
          <span>${escapeHtml(item.device)} / ${escapeHtml(item.country || 'unknown')}</span>
          <span>${escapeHtml(item.referrer || 'direct')}</span>
        </div>
      </article>
    `).join('');
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
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
})();
