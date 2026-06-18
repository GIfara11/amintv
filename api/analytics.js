import { list, put } from '@vercel/blob';
import { assertAdminRequest } from './_shorts-store.js';

const JSON_HEADERS = { 'Cache-Control': 'no-store' };
const MAX_EVENTS_PER_REPORT = 5000;
const RETENTION_DAYS = 30;

export async function POST(request) {
  try {
    const body = await request.json();
    const event = buildAnalyticsEvent(body, request);

    await put(`analytics/events/${event.day}/${event.id}.json`, JSON.stringify(event), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: 'application/json'
    });

    if (event.type === 'short_view' && event.shortId) {
      await incrementShortViewCounter(event);
    }

    return Response.json({ ok: true }, { headers: JSON_HEADERS });
  } catch (error) {
    console.error('Analytics write failed', error);
    return Response.json({ ok: false }, { status: 202, headers: JSON_HEADERS });
  }
}

export async function GET(request) {
  try {
    assertAdminRequest(request);

    const url = new URL(request.url);
    const days = clampNumber(url.searchParams.get('days'), 1, RETENTION_DAYS, 30);
    const events = await listAnalyticsEvents(days);

    return Response.json(buildAnalyticsReport(events, days), { headers: JSON_HEADERS });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analytics request failed';
    const status = message === 'Invalid admin session' || message === 'Invalid admin password' ? 401 : 500;
    return Response.json({ error: message }, { status, headers: JSON_HEADERS });
  }
}

export async function getShortViewStats(days = RETENTION_DAYS) {
  const counters = await listShortViewCounters();
  const byId = {};

  counters.forEach((counter) => {
    byId[counter.shortId] = {
      views: counter.views,
      title: counter.shortTitle,
      lastViewedAt: counter.lastViewedAt
    };
  });

  return {
    total: counters.reduce((sum, counter) => sum + counter.views, 0),
    byId
  };
}

async function incrementShortViewCounter(event) {
  const current = await readShortViewCounter(event.shortId);
  const next = {
    shortId: event.shortId,
    shortTitle: event.shortTitle,
    views: Number(current?.views || 0) + 1,
    lastViewedAt: event.createdAt,
    updatedAt: new Date().toISOString()
  };

  await put(shortViewCounterPath(event.shortId), JSON.stringify(next), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json'
  });
}

async function listShortViewCounters() {
  const counters = [];
  let cursor;

  do {
    const page = await list({
      prefix: 'analytics/short-views/',
      limit: 1000,
      ...(cursor ? { cursor } : {})
    });

    const items = await Promise.all(page.blobs.map(readShortViewCounterBlob));
    counters.push(...items.filter(Boolean));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return counters;
}

async function readShortViewCounter(shortId) {
  const { blobs } = await list({ prefix: shortViewCounterPath(shortId), limit: 1 });
  if (!blobs.length) return null;
  return readShortViewCounterBlob(blobs[0]);
}

async function readShortViewCounterBlob(blob) {
  try {
    const response = await fetch(blob.url, { cache: 'no-store' });
    if (!response.ok) return null;
    const payload = await response.json();
    const shortId = sanitizeShortId(payload?.shortId);
    if (!shortId) return null;

    return {
      shortId,
      shortTitle: sanitizeText(payload?.shortTitle, 160),
      views: Math.max(0, Math.round(Number(payload?.views || 0))),
      lastViewedAt: normalizeIsoDate(payload?.lastViewedAt),
      updatedAt: normalizeIsoDate(payload?.updatedAt)
    };
  } catch {
    return null;
  }
}

function shortViewCounterPath(shortId) {
  return `analytics/short-views/${shortId}.json`;
}

function buildAnalyticsEvent(body, request) {
  const now = new Date();
  const type = body?.type === 'short_view' ? 'short_view' : 'page_view';
  const path = sanitizePath(body?.path);
  const title = sanitizeText(body?.title, 160);
  const referrer = sanitizeReferrer(body?.referrer);
  const visitorId = sanitizeId(body?.visitorId, 'visitor');
  const sessionId = sanitizeId(body?.sessionId, 'session');
  const userAgent = request.headers.get('user-agent') || '';
  const country = request.headers.get('x-vercel-ip-country') || 'unknown';

  return {
    id: crypto.randomUUID(),
    type,
    day: now.toISOString().slice(0, 10),
    createdAt: now.toISOString(),
    path,
    title,
    shortId: type === 'short_view' ? sanitizeShortId(body?.shortId) : '',
    shortTitle: type === 'short_view' ? sanitizeText(body?.shortTitle, 160) : '',
    referrer,
    visitorId,
    sessionId,
    device: getDeviceType(userAgent, body?.screenWidth),
    browser: getBrowser(userAgent),
    os: getOs(userAgent),
    country: sanitizeText(country, 32) || 'unknown',
    language: sanitizeText(body?.language, 32),
    timezone: sanitizeText(body?.timezone, 80)
  };
}

async function listAnalyticsEvents(days) {
  const keys = [...getRecentDayKeys(days)].reverse();
  const events = [];

  for (const day of keys) {
    let cursor;
    do {
      const page = await list({
        prefix: `analytics/events/${day}/`,
        limit: 1000,
        ...(cursor ? { cursor } : {})
      });

      const items = await Promise.all(page.blobs.map(readEventBlob));
      events.push(...items.filter(Boolean));
      cursor = page.hasMore && events.length < MAX_EVENTS_PER_REPORT ? page.cursor : undefined;
    } while (cursor && events.length < MAX_EVENTS_PER_REPORT);

    if (events.length >= MAX_EVENTS_PER_REPORT) break;
  }

  return events.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
}

async function readEventBlob(blob) {
  try {
    const response = await fetch(blob.url, { cache: 'no-store' });
    if (!response.ok) return null;
    return normalizeEvent(await response.json());
  } catch {
    return null;
  }
}

function normalizeEvent(event) {
  const createdAt = new Date(event?.createdAt);
  if (Number.isNaN(createdAt.getTime())) return null;

  return {
    type: event?.type === 'short_view' ? 'short_view' : 'page_view',
    createdAt: createdAt.toISOString(),
    day: createdAt.toISOString().slice(0, 10),
    path: sanitizePath(event?.path),
    title: sanitizeText(event?.title, 160),
    shortId: sanitizeShortId(event?.shortId),
    shortTitle: sanitizeText(event?.shortTitle, 160),
    referrer: sanitizeReferrer(event?.referrer),
    visitorId: sanitizeId(event?.visitorId, 'visitor'),
    sessionId: sanitizeId(event?.sessionId, 'session'),
    device: ['desktop', 'mobile', 'tablet'].includes(event?.device) ? event.device : 'desktop',
    browser: sanitizeText(event?.browser, 40) || 'Other',
    os: sanitizeText(event?.os, 40) || 'Other',
    country: sanitizeText(event?.country, 32) || 'unknown',
    language: sanitizeText(event?.language, 32),
    timezone: sanitizeText(event?.timezone, 80)
  };
}

function buildAnalyticsReport(events, days) {
  const pageEvents = events.filter((event) => event.type === 'page_view');
  const shortEvents = events.filter((event) => event.type === 'short_view');
  const uniqueVisitors = new Set(pageEvents.map((event) => event.visitorId)).size;
  const uniqueSessions = new Set(pageEvents.map((event) => event.sessionId)).size;
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayEvents = pageEvents.filter((event) => event.day === todayKey);
  const todayShortEvents = shortEvents.filter((event) => event.day === todayKey);

  return {
    rangeDays: days,
    generatedAt: new Date().toISOString(),
    totals: {
      pageViews: pageEvents.length,
      videoViews: shortEvents.length,
      visitors: uniqueVisitors,
      sessions: uniqueSessions,
      todayPageViews: todayEvents.length,
      todayVideoViews: todayShortEvents.length,
      todayVisitors: new Set(todayEvents.map((event) => event.visitorId)).size
    },
    timeline: buildTimeline(pageEvents, days),
    pages: topBy(pageEvents, (event) => event.path, 8),
    videos: topBy(shortEvents, (event) => event.shortTitle || event.shortId, 8),
    referrers: topBy(pageEvents, getReferrerLabel, 8),
    devices: topBy(pageEvents, (event) => event.device, 5),
    browsers: topBy(pageEvents, (event) => event.browser, 6),
    countries: topBy(pageEvents, (event) => event.country, 8),
    recent: pageEvents.slice(0, 12).map((event) => ({
      at: event.createdAt,
      path: event.path,
      referrer: getReferrerLabel(event),
      device: event.device,
      country: event.country
    }))
  };
}

function buildTimeline(events, days) {
  const views = new Map();
  const visitors = new Map();

  events.forEach((event) => {
    views.set(event.day, (views.get(event.day) || 0) + 1);
    if (!visitors.has(event.day)) visitors.set(event.day, new Set());
    visitors.get(event.day).add(event.visitorId);
  });

  return getRecentDayKeys(days).map((key) => {
    const date = new Date(`${key}T00:00:00.000Z`);
    return {
      key,
      shortLabel: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      views: views.get(key) || 0,
      visitors: visitors.get(key)?.size || 0
    };
  });
}

function topBy(events, keyGetter, limit) {
  const counts = new Map();
  events.forEach((event) => {
    const key = keyGetter(event) || 'unknown';
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function getRecentDayKeys(days) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - (days - index - 1));
    return date.toISOString().slice(0, 10);
  });
}

function getReferrerLabel(event) {
  if (!event.referrer) return 'direct';
  try {
    const host = new URL(event.referrer).host.replace(/^www\./, '');
    return host || 'direct';
  } catch {
    return 'other';
  }
}

function getDeviceType(userAgent, screenWidth) {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return 'tablet';
  if (/mobile|iphone|android/.test(ua)) return 'mobile';
  const width = Number(screenWidth || 0);
  if (width > 0 && width < 740) return 'mobile';
  return 'desktop';
}

function getBrowser(userAgent) {
  if (/Edg\//.test(userAgent)) return 'Edge';
  if (/OPR\//.test(userAgent)) return 'Opera';
  if (/Chrome\//.test(userAgent)) return 'Chrome';
  if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) return 'Safari';
  if (/Firefox\//.test(userAgent)) return 'Firefox';
  return 'Other';
}

function getOs(userAgent) {
  if (/Windows/i.test(userAgent)) return 'Windows';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
  if (/Android/i.test(userAgent)) return 'Android';
  if (/Mac OS X/i.test(userAgent)) return 'macOS';
  if (/Linux/i.test(userAgent)) return 'Linux';
  return 'Other';
}

function sanitizePath(value) {
  const path = String(value || '/').trim().slice(0, 240);
  return path.startsWith('/') ? path : '/';
}

function sanitizeReferrer(value) {
  const referrer = String(value || '').trim().slice(0, 400);
  if (!referrer) return '';
  try {
    const url = new URL(referrer);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function sanitizeText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function sanitizeId(value, prefix) {
  const id = String(value || '').trim();
  if (/^[a-zA-Z0-9._:-]{8,120}$/.test(id)) return id;
  return `${prefix}-${crypto.randomUUID()}`;
}

function sanitizeShortId(value) {
  const id = String(value || '').trim();
  return /^[a-zA-Z0-9-]{10,80}$/.test(id) ? id : '';
}

function normalizeIsoDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.round(number)));
}
