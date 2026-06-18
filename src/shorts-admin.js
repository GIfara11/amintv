import { upload } from '@vercel/blob/client';

const form = document.querySelector('[data-publish-form]');
const submit = document.querySelector('[data-submit]');
const status = document.querySelector('[data-status]');
const progress = document.querySelector('[data-progress]');
const refreshButton = document.querySelector('[data-admin-refresh]');
const searchInput = document.querySelector('[data-admin-search]');
const filterStatus = document.querySelector('[data-filter-status]');
const filterSort = document.querySelector('[data-filter-sort]');
const adminStatus = document.querySelector('[data-admin-status]');
const statsRoot = document.querySelector('[data-admin-stats]');
const chartRoot = document.querySelector('[data-dashboard-chart]');
const healthRoot = document.querySelector('[data-dashboard-health]');
const insightsRoot = document.querySelector('[data-dashboard-insights]');
const activityRoot = document.querySelector('[data-dashboard-activity]');
const bulkToolbar = document.querySelector('[data-bulk-toolbar]');
const selectionCount = document.querySelector('[data-selection-count]');
const listRoot = document.querySelector('[data-admin-list]');

const state = {
  items: [],
  dashboard: null,
  selectedIds: new Set()
};

form.addEventListener('submit', handlePublish);
refreshButton.addEventListener('click', loadAdminPanel);
searchInput.addEventListener('input', renderAdminList);
filterStatus.addEventListener('change', renderAdminList);
filterSort.addEventListener('change', renderAdminList);
listRoot.addEventListener('click', handleAdminAction);
listRoot.addEventListener('change', handleListChange);
bulkToolbar.addEventListener('click', handleBulkToolbarClick);

async function handlePublish(event) {
  event.preventDefault();

  const data = new FormData(form);
  const file = data.get('video');
  if (!(file instanceof File) || !file.size) return;

  submit.disabled = true;
  progress.hidden = false;
  progress.value = 0;
  status.textContent = 'Проверяем видео...';

  try {
    await validateShort(file);
    const id = crypto.randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-100);
    status.textContent = 'Загрузка видео...';

    await upload(`shorts/videos/${id}-${safeName}`, file, {
      access: 'public',
      multipart: true,
      handleUploadUrl: '/api/shorts-upload',
      clientPayload: JSON.stringify({
        id,
        title: data.get('title'),
        caption: data.get('caption')
      }),
      onUploadProgress: ({ percentage }) => {
        progress.value = percentage;
        status.textContent = `Загрузка: ${Math.round(percentage)}%`;
      }
    });

    status.textContent = 'Готово. Ролик опубликован.';
    form.reset();
    progress.value = 100;
    await loadAdminPanel();
  } catch (error) {
    status.textContent = getUploadErrorMessage(error);
  } finally {
    submit.disabled = false;
  }
}

async function loadAdminPanel() {
  refreshButton.disabled = true;
  adminStatus.textContent = 'Загружаю дашборд и список роликов...';

  try {
    const response = await fetch('/api/shorts-admin', {
      cache: 'no-store'
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Не удалось загрузить админку');
    }

    state.items = Array.isArray(payload.items) ? payload.items : [];
    state.dashboard = payload.dashboard || null;
    cleanupSelection();
    renderStats(payload.stats || {});
    renderDashboard(payload.dashboard || null);
    renderAdminList();
    adminStatus.textContent = `Готово. Найдено роликов: ${state.items.length}.`;
  } catch (error) {
    adminStatus.textContent = error.message || 'Не удалось загрузить список';
    statsRoot.innerHTML = '';
    chartRoot.innerHTML = '';
    healthRoot.innerHTML = '';
    insightsRoot.innerHTML = '';
    activityRoot.innerHTML = '';
    listRoot.innerHTML = '';
    syncBulkToolbar();
  } finally {
    refreshButton.disabled = false;
  }
}

async function handleAdminAction(event) {
  const trigger = event.target.closest('[data-action]');
  if (!trigger) return;

  const card = trigger.closest('[data-short-id]');
  if (!card) return;

  const id = card.dataset.shortId;
  if (trigger.dataset.action === 'delete' && !window.confirm('Удалить ролик без возврата?')) {
    return;
  }

  setCardStatus(card, trigger.dataset.action === 'delete' ? 'Удаляю ролик...' : 'Сохраняю...');
  disableCard(card, true);

  try {
    if (trigger.dataset.action === 'delete') {
      await removeShort(id);
      state.selectedIds.delete(id);
      await loadAdminPanel();
      adminStatus.textContent = 'Ролик удалён.';
      return;
    }

    const title = card.querySelector('[data-field="title"]').value;
    const caption = card.querySelector('[data-field="caption"]').value;
    const statusValue =
      trigger.dataset.action === 'toggle'
        ? trigger.dataset.nextStatus
        : card.querySelector('[data-field="status"]').value;

    await updateShort({
      id,
      title,
      caption,
      status: statusValue
    });

    await loadAdminPanel();
    adminStatus.textContent = 'Изменения сохранены.';
  } catch (error) {
    setCardStatus(card, error.message || 'Не удалось выполнить действие');
    disableCard(card, false);
  }
}

function handleListChange(event) {
  const checkbox = event.target.closest('[data-select-short]');
  if (!checkbox) return;

  const id = checkbox.value;
  if (checkbox.checked) {
    state.selectedIds.add(id);
  } else {
    state.selectedIds.delete(id);
  }

  syncBulkToolbar();
  const card = checkbox.closest('[data-short-id]');
  if (card) {
    card.classList.toggle('is-selected', checkbox.checked);
  }
}

async function handleBulkToolbarClick(event) {
  const selectTrigger = event.target.closest('[data-bulk-select]');
  if (selectTrigger) {
    if (selectTrigger.dataset.bulkSelect === 'visible') {
      getVisibleItems().forEach((item) => state.selectedIds.add(item.id));
    } else {
      state.selectedIds.clear();
    }
    renderAdminList();
    return;
  }

  const actionTrigger = event.target.closest('[data-bulk-action]');
  if (!actionTrigger) return;

  const ids = [...state.selectedIds];
  if (!ids.length) {
    adminStatus.textContent = 'Сначала выбери ролики.';
    return;
  }

  const action = actionTrigger.dataset.bulkAction;
  if (action === 'delete' && !window.confirm(`Удалить выбранные ролики: ${ids.length} шт.?`)) {
    return;
  }

  setBulkDisabled(true);
  adminStatus.textContent = getBulkPendingMessage(action, ids.length);

  try {
    const response = await fetch('/api/shorts-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action,
        ids
      })
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Не удалось выполнить массовое действие');
    }

    state.selectedIds.clear();
    await loadAdminPanel();
    adminStatus.textContent = getBulkSuccessMessage(action, payload.processed || 0);
  } catch (error) {
    adminStatus.textContent = error.message || 'Не удалось выполнить массовое действие';
  } finally {
    setBulkDisabled(false);
  }
}

async function updateShort(payload) {
  const response = await fetch('/api/shorts-admin', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Не удалось сохранить ролик');
  }
  return data.item;
}

async function removeShort(id) {
  const response = await fetch('/api/shorts-admin', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Не удалось удалить ролик');
  }
  return data;
}

function renderStats(stats) {
  const safeStats = {
    total: Number(stats.total || 0),
    published: Number(stats.published || 0),
    hidden: Number(stats.hidden || 0),
    publicationRate: safePercent(stats.total ? (stats.published / stats.total) * 100 : 0),
    videoViews: Number(stats.videoViews || 0)
  };

  statsRoot.innerHTML = `
    <article class="admin-stat">
      <strong>${safeStats.total}</strong>
      <span>Всего роликов</span>
      <small>Вся база шортсов</small>
    </article>
    <article class="admin-stat">
      <strong>${safeStats.published}</strong>
      <span>В ленте</span>
      <small>${safeStats.publicationRate}% от всего контента</small>
    </article>
    <article class="admin-stat">
      <strong>${safeStats.hidden}</strong>
      <span>Скрыто</span>
      <small>Не видно пользователю</small>
    </article>
    <article class="admin-stat">
      <strong>${safeStats.videoViews}</strong>
      <span>Просмотры видео</span>
      <small>Запуски shorts</small>
    </article>
  `;
}

function renderDashboard(dashboard) {
  if (!dashboard) {
    chartRoot.innerHTML = '';
    healthRoot.innerHTML = '';
    insightsRoot.innerHTML = '';
    activityRoot.innerHTML = '';
    return;
  }

  const timeline = Array.isArray(dashboard.timeline) ? dashboard.timeline : [];
  const maxCount = Math.max(...timeline.map((item) => item.count), 1);

  chartRoot.innerHTML = timeline.map((item) => {
    const height = Math.max(8, Math.round((item.count / maxCount) * 160));
    return `
      <article class="chart-day" aria-label="${escapeAttribute(item.fullLabel)}: ${item.count}">
        <div class="chart-value">${item.count}</div>
        <div class="chart-bar-wrap">
          <div class="chart-bar" style="height:${height}px"></div>
        </div>
        <div class="chart-label">${escapeHtml(item.shortLabel)}</div>
      </article>
    `;
  }).join('');

  const kpis = dashboard.kpis || {};
  const ratios = dashboard.ratios || {};

  healthRoot.innerHTML = `
    ${renderMeterCard('Покрытие ленты', 'Доля роликов, которые сейчас видны в shorts', safePercent(ratios.publicationRate), 'success')}
    ${renderMeterCard('Карточки с подписью', 'Насколько лента заполнена нормальными описаниями', safePercent(ratios.captionCoverage), ratios.captionCoverage >= 70 ? 'success' : 'danger')}
  `;

  insightsRoot.innerHTML = `
    ${renderInsightCard('Новых за 7 дней', `${Number(kpis.recentPublished || 0)}`, 'Сколько роликов вышло за последнюю неделю')}
    ${renderInsightCard('Обновлений за 7 дней', `${Number(kpis.recentUpdated || 0)}`, 'Сколько карточек правилось за последнюю неделю')}
    ${renderInsightCard('Без подписи', `${Number(kpis.withoutCaption || 0)}`, 'Ролики, у которых пустое описание')}
    ${renderInsightCard('Средняя длина заголовка', `${Number(kpis.averageTitleLength || 0)} симв.`, 'Помогает держать названия без мусора')}
    ${renderInsightCard('Средняя длина подписи', `${Number(kpis.averageCaptionLength || 0)} симв.`, 'Показывает, насколько ты вообще заполняешь описание')}
    ${renderInsightCard('Активных дней', `${Number(kpis.activeDays || 0)}`, 'Сколько дней живёт текущая база shorts')}
  `;

  const activity = Array.isArray(dashboard.activity) ? dashboard.activity : [];
  activityRoot.innerHTML = activity.length
    ? activity.map((item) => `
        <article class="activity-item">
          <strong>${escapeHtml(item.title)}</strong>
          <div class="activity-meta">
            <span>${item.action === 'updated' ? 'Обновлён' : 'Опубликован'} ${escapeHtml(formatDate(item.at))}</span>
            <span class="activity-status" data-status="${escapeAttribute(item.status)}">
              ${item.status === 'published' ? 'В ленте' : 'Скрыт'}
            </span>
          </div>
        </article>
      `).join('')
    : '<div class="admin-empty">Активности пока нет.</div>';
}

function renderMeterCard(title, description, percent, tone) {
  return `
    <article class="meter-card">
      <strong>${escapeHtml(title)}</strong>
      <div class="meter-copy">
        <span>${escapeHtml(description)}</span>
        <span>${percent}%</span>
      </div>
      <div class="meter-track" aria-hidden="true">
        <div class="meter-fill" data-tone="${escapeAttribute(tone)}" style="width:${percent}%"></div>
      </div>
    </article>
  `;
}

function renderInsightCard(title, value, description) {
  return `
    <article class="insight-card">
      <strong>${escapeHtml(title)}</strong>
      <div class="insight-copy">
        <span>${escapeHtml(description)}</span>
        <span>${escapeHtml(value)}</span>
      </div>
    </article>
  `;
}

function renderAdminList() {
  const items = getVisibleItems();

  syncBulkToolbar();

  if (!items.length) {
    listRoot.innerHTML = `<div class="admin-empty">${searchInput.value || filterStatus.value !== 'all' ? 'По текущему фильтру ничего нет.' : 'Роликов пока нет.'}</div>`;
    return;
  }

  listRoot.innerHTML = items.map(renderShortCard).join('');
}

function renderShortCard(item) {
  const nextStatus = item.status === 'published' ? 'hidden' : 'published';
  const toggleLabel = nextStatus === 'hidden' ? 'Скрыть из ленты' : 'Вернуть в ленту';
  const isSelected = state.selectedIds.has(item.id);

  return `
    <article class="short-admin-card${isSelected ? ' is-selected' : ''}" data-short-id="${escapeAttribute(item.id)}">
      <div class="short-admin-side">
        <label class="short-admin-select">
          <input type="checkbox" data-select-short value="${escapeAttribute(item.id)}"${isSelected ? ' checked' : ''}>
          <span>Выбрать ролик</span>
        </label>
        <video class="short-admin-preview" src="${escapeAttribute(item.videoUrl)}" controls preload="metadata" muted playsinline></video>
      </div>
      <div class="short-admin-main">
        <div class="short-admin-meta">
          <span class="short-admin-badge" data-status="${escapeAttribute(item.status)}">
            ${item.status === 'published' ? 'Опубликован' : 'Скрыт'}
          </span>
          <span class="short-admin-views">${Number(item.views || 0).toLocaleString('ru-RU')} просмотров${item.lastViewedAt ? ` · Последний: ${escapeHtml(formatDate(item.lastViewedAt))}` : ''}</span>
          <span class="short-admin-dates">Опубликован: ${escapeHtml(formatDate(item.publishedAt))}</span>
          <span class="short-admin-dates">Обновлён: ${escapeHtml(formatDate(item.updatedAt))}</span>
        </div>
        <div class="short-admin-id">ID: ${escapeHtml(item.id)}</div>
        <label class="field">Название
          <input data-field="title" maxlength="120" value="${escapeAttribute(item.title)}">
        </label>
        <label class="field">Подпись
          <textarea data-field="caption" maxlength="500">${escapeHtml(item.caption || '')}</textarea>
        </label>
        <label class="field">Статус
          <select data-field="status">
            <option value="published"${item.status === 'published' ? ' selected' : ''}>В ленте</option>
            <option value="hidden"${item.status === 'hidden' ? ' selected' : ''}>Скрыт</option>
          </select>
        </label>
        <div class="short-admin-actions">
          <button class="short-admin-action" type="button" data-action="save">Сохранить</button>
          <button class="ghost-button" type="button" data-action="toggle" data-next-status="${escapeAttribute(nextStatus)}">${toggleLabel}</button>
          <a class="short-admin-action" href="${escapeAttribute(item.videoUrl)}" target="_blank" rel="noopener">Открыть видео</a>
          <button class="danger-button" type="button" data-action="delete">Удалить</button>
        </div>
        <p class="short-admin-inline-status" data-inline-status></p>
      </div>
    </article>
  `;
}

function getVisibleItems() {
  const query = String(searchInput.value || '').trim().toLowerCase();
  const statusValue = filterStatus.value;
  const sortValue = filterSort.value;

  const items = state.items.filter((item) => {
    const matchesStatus = statusValue === 'all' ? true : item.status === statusValue;
    const matchesSearch = query
      ? `${item.title} ${item.caption || ''}`.toLowerCase().includes(query)
      : true;
    return matchesStatus && matchesSearch;
  });

  return items.sort((left, right) => {
    if (sortValue === 'oldest') {
      return new Date(left.publishedAt).getTime() - new Date(right.publishedAt).getTime();
    }
    if (sortValue === 'updated') {
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    }
    if (sortValue === 'title') {
      return left.title.localeCompare(right.title, 'ru');
    }
    return new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime();
  });
}

function syncBulkToolbar() {
  cleanupSelection();
  selectionCount.textContent = `Выбрано: ${state.selectedIds.size}`;
  bulkToolbar.hidden = state.items.length === 0;
}

function cleanupSelection() {
  const available = new Set(state.items.map((item) => item.id));
  state.selectedIds.forEach((id) => {
    if (!available.has(id)) {
      state.selectedIds.delete(id);
    }
  });
}

function setBulkDisabled(disabled) {
  bulkToolbar.querySelectorAll('button').forEach((button) => {
    button.disabled = disabled;
  });
}

function setCardStatus(card, message) {
  const node = card.querySelector('[data-inline-status]');
  if (node) node.textContent = message;
}

function disableCard(card, disabled) {
  card.querySelectorAll('button, input, textarea, select').forEach((element) => {
    element.disabled = disabled;
  });
}

function getBulkPendingMessage(action, count) {
  if (action === 'delete') return `Удаляю ролики: ${count} шт...`;
  if (action === 'hide') return `Скрываю ролики: ${count} шт...`;
  return `Возвращаю в ленту ролики: ${count} шт...`;
}

function getBulkSuccessMessage(action, count) {
  if (action === 'delete') return `Удалено роликов: ${count}.`;
  if (action === 'hide') return `Скрыто роликов: ${count}.`;
  return `Возвращено в ленту роликов: ${count}.`;
}

function getUploadErrorMessage(error) {
  const message = error?.message || '';
  if (message.includes('client token')) {
    return 'Не удалось получить токен загрузки. Проверь пароль администратора и попробуй ещё раз.';
  }
  if (message.includes('Invalid admin password')) {
    return 'Пароль администратора неверный.';
  }
  return message || 'Не удалось опубликовать ролик';
}

function validateShort(file) {
  if (file.size > 500 * 1024 * 1024) {
    return Promise.reject(new Error('Видео превышает лимит 500 МБ'));
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);

    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (video.videoHeight <= video.videoWidth) {
        reject(new Error('Для shorts нужно вертикальное видео'));
      } else if (video.duration > 180) {
        reject(new Error('Short должен быть не длиннее 3 минут'));
      } else {
        resolve();
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Браузер не смог прочитать видео'));
    };

    video.src = url;
  });
}

function formatDate(value) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function safePercent(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value || 0))));
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
