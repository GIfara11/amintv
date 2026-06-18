import {
  assertAdminRequest,
  deleteShortAssets,
  listAllShorts,
  readShortById,
  sanitizeCaption,
  sanitizeStatus,
  sanitizeTitle,
  validateShortId,
  writeShortMetadata,
  SHORT_STATUS
} from './_shorts-store.js';
import { getShortViewStats } from './analytics.js';

const JSON_HEADERS = { 'Cache-Control': 'no-store' };

export const GET = handleGet;
export const PATCH = handlePatch;
export const DELETE = handleDelete;
export const POST = handlePost;

async function handleGet(request) {
  try {
    assertAdminRequest(request);

    const [items, viewStats] = await Promise.all([
      listAllShorts(),
      getShortViewStats(30)
    ]);
    const enrichedItems = attachViewStats(items, viewStats);

    return Response.json(
      {
        stats: buildStats(enrichedItems, viewStats),
        dashboard: buildDashboard(enrichedItems, viewStats),
        items: enrichedItems
      },
      { headers: JSON_HEADERS }
    );
  } catch (error) {
    return createErrorResponse(error, 500);
  }
}

async function handlePatch(request) {
  try {
    const body = await request.json();
    assertAdminRequest(request, body?.password);

    const current = await readShortById(body?.id);
    if (!current) {
      return Response.json({ error: 'Short not found' }, { status: 404, headers: JSON_HEADERS });
    }

    const next = await writeShortMetadata({
      ...current,
      id: validateShortId(body.id),
      title: sanitizeTitle(body.title) || current.title,
      caption: sanitizeCaption(body.caption),
      status: sanitizeStatus(body.status),
      updatedAt: new Date().toISOString()
    });

    return Response.json({ item: next }, { headers: JSON_HEADERS });
  } catch (error) {
    return createErrorResponse(error, 400);
  }
}

async function handleDelete(request) {
  try {
    const body = await request.json();
    assertAdminRequest(request, body?.password);

    const item = await readShortById(body?.id);
    if (!item) {
      return Response.json({ error: 'Short not found' }, { status: 404, headers: JSON_HEADERS });
    }

    await deleteShortAssets(item);

    return Response.json({ ok: true, id: item.id }, { headers: JSON_HEADERS });
  } catch (error) {
    return createErrorResponse(error, 400);
  }
}

async function handlePost(request) {
  try {
    const body = await request.json();
    assertAdminRequest(request, body?.password);

    const ids = normalizeIdList(body?.ids);
    if (!ids.length) {
      return Response.json({ error: 'No shorts selected' }, { status: 400, headers: JSON_HEADERS });
    }

    if (body?.action === 'delete') {
      const deletedIds = [];

      for (const id of ids) {
        const item = await readShortById(id);
        if (!item) continue;
        await deleteShortAssets(item);
        deletedIds.push(id);
      }

      return Response.json(
        { ok: true, action: 'delete', processed: deletedIds.length, ids: deletedIds },
        { headers: JSON_HEADERS }
      );
    }

    const nextStatus = getBulkStatus(body?.action);
    const updatedIds = [];

    for (const id of ids) {
      const current = await readShortById(id);
      if (!current) continue;

      await writeShortMetadata({
        ...current,
        status: nextStatus,
        updatedAt: new Date().toISOString()
      });
      updatedIds.push(id);
    }

    return Response.json(
      { ok: true, action: body.action, processed: updatedIds.length, ids: updatedIds },
      { headers: JSON_HEADERS }
    );
  } catch (error) {
    return createErrorResponse(error, 400);
  }
}

function attachViewStats(items, viewStats) {
  const byId = viewStats?.byId || {};
  return items.map((item) => ({
    ...item,
    views: Number(byId[item.id]?.views || 0),
    lastViewedAt: byId[item.id]?.lastViewedAt || null
  }));
}

function buildStats(items, viewStats) {
  const published = items.filter((item) => item.status === SHORT_STATUS.PUBLISHED).length;
  const hidden = items.filter((item) => item.status === SHORT_STATUS.HIDDEN).length;

  return {
    total: items.length,
    published,
    hidden,
    videoViews: Number(viewStats?.total || 0)
  };
}

function buildDashboard(items, viewStats) {
  const total = items.length;
  const published = items.filter((item) => item.status === SHORT_STATUS.PUBLISHED).length;
  const hidden = total - published;
  const withoutCaption = items.filter((item) => !item.caption).length;
  const withCaption = total - withoutCaption;
  const now = new Date();
  const recentThreshold = startOfDay(daysAgo(now, 6));
  const recentPublished = items.filter((item) => new Date(item.publishedAt) >= recentThreshold).length;
  const recentUpdated = items.filter((item) => new Date(item.updatedAt) >= recentThreshold).length;
  const earliestPublishedAt = items.length ? items[items.length - 1].publishedAt : null;
  const activeDays = earliestPublishedAt
    ? Math.max(1, Math.ceil((now.getTime() - new Date(earliestPublishedAt).getTime()) / 86400000) + 1)
    : 0;

  return {
    kpis: {
      total,
      published,
      hidden,
      withoutCaption,
      videoViews: Number(viewStats?.total || 0),
      recentPublished,
      recentUpdated,
      activeDays,
      averageTitleLength: average(items.map((item) => item.title.length)),
      averageCaptionLength: average(items.map((item) => item.caption.length))
    },
    ratios: {
      publicationRate: total ? Math.round((published / total) * 100) : 0,
      captionCoverage: total ? Math.round((withCaption / total) * 100) : 0
    },
    timeline: buildDailyTimeline(items, 7),
    activity: items
      .slice()
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status,
        action: item.updatedAt !== item.publishedAt ? 'updated' : 'published',
        at: item.updatedAt !== item.publishedAt ? item.updatedAt : item.publishedAt
      })),
    latestPublishedAt: items[0]?.publishedAt || null,
    oldestPublishedAt: earliestPublishedAt
  };
}

function buildDailyTimeline(items, days) {
  const counts = new Map();

  items.forEach((item) => {
    const key = startOfDay(new Date(item.publishedAt)).toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from({ length: days }, (_, index) => {
    const day = startOfDay(daysAgo(new Date(), days - index - 1));
    const key = day.toISOString().slice(0, 10);

    return {
      key,
      shortLabel: day.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      fullLabel: day.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
      count: counts.get(key) || 0
    };
  });
}

function getBulkStatus(action) {
  if (action === 'hide') return SHORT_STATUS.HIDDEN;
  if (action === 'publish') return SHORT_STATUS.PUBLISHED;
  throw new Error('Unsupported bulk action');
}

function normalizeIdList(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => validateShortId(item)))];
}

function average(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function daysAgo(date, amount) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - amount);
  return copy;
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function createErrorResponse(error, fallbackStatus) {
  const message = error instanceof Error ? error.message : 'Request failed';
  const status = message === 'Invalid admin session' || message === 'Invalid admin password' ? 401 : fallbackStatus;
  return Response.json({ error: message }, { status, headers: JSON_HEADERS });
}
