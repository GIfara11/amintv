import { del, list, put } from '@vercel/blob';
import { timingSafeEqual } from 'node:crypto';
import { hasValidAdminSession } from './_admin-session.js';

export const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
export const SHORT_STATUS = {
  PUBLISHED: 'published',
  HIDDEN: 'hidden'
};

const TITLE_MAX = 120;
const CAPTION_MAX = 500;
const ID_PATTERN = /^[a-zA-Z0-9-]{10,80}$/;

export async function listAllShorts() {
  const blobs = [];
  let cursor;

  do {
    const page = await list({
      prefix: 'shorts/meta/',
      limit: 1000,
      ...(cursor ? { cursor } : {})
    });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  const items = await Promise.all(blobs.map(readShortMetadataBlob));
  return items
    .filter(Boolean)
    .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime());
}

export async function readShortById(id) {
  const normalizedId = validateShortId(id);
  const { blobs } = await list({ prefix: metadataPath(normalizedId), limit: 1 });
  if (!blobs.length) return null;
  return readShortMetadataBlob(blobs[0]);
}

export async function writeShortMetadata(record) {
  const item = normalizeShortRecord(record);
  await put(metadataPath(item.id), JSON.stringify(item), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json'
  });
  return item;
}

export async function deleteShortAssets(record) {
  const item = normalizeShortRecord(record);
  const targets = [metadataPath(item.id)];
  if (item.pathname) targets.push(item.pathname);
  await del(targets);
}

export function parsePublicationPayload(value) {
  const payload = parseJson(value, 'Invalid publication data');
  const id = validateShortId(payload.id);
  const title = sanitizeTitle(payload.title);
  const caption = sanitizeCaption(payload.caption);
  const password = String(payload.password || '').trim();

  if (!title) throw new Error('Video title is required');

  return { id, title, caption, password };
}

export function buildPublishedMetadata(payload, blob) {
  const publishedAt = new Date().toISOString();
  return normalizeShortRecord({
    id: payload.id,
    title: payload.title,
    caption: payload.caption,
    videoUrl: blob.url,
    pathname: blob.pathname,
    status: SHORT_STATUS.PUBLISHED,
    publishedAt,
    updatedAt: publishedAt
  });
}

export function assertAdminPassword(password) {
  if (!safePasswordMatch(password, process.env.SHORTS_ADMIN_PASSWORD)) {
    throw new Error('Invalid admin password');
  }
}

export function assertAdminRequest(request) {
  if (hasValidAdminSession(request)) return;
  throw new Error('Invalid admin session');
}

export function requireTrustedOrigin(request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) throw new Error('Invalid request origin');

  const originUrl = new URL(origin);
  if (originUrl.host !== host || originUrl.protocol !== 'https:') {
    throw new Error('Invalid request origin');
  }
}

export function sanitizeTitle(value) {
  return String(value || '').trim().slice(0, TITLE_MAX);
}

export function sanitizeCaption(value) {
  return String(value || '').trim().slice(0, CAPTION_MAX);
}

export function sanitizeStatus(value) {
  return value === SHORT_STATUS.HIDDEN ? SHORT_STATUS.HIDDEN : SHORT_STATUS.PUBLISHED;
}

export function validateShortId(value) {
  const id = String(value || '').trim();
  if (!ID_PATTERN.test(id)) {
    throw new Error('Invalid short ID');
  }
  return id;
}

function metadataPath(id) {
  return `shorts/meta/${id}.json`;
}

async function readShortMetadataBlob(blob) {
  try {
    const response = await fetch(blob.url, { cache: 'no-store' });
    if (!response.ok) return null;
    const payload = await response.json();
    return normalizeShortRecord(payload);
  } catch {
    return null;
  }
}

function normalizeShortRecord(record) {
  const id = validateShortId(record?.id);
  const title = sanitizeTitle(record?.title);
  if (!title) throw new Error('Video title is required');

  const publishedAt = normalizeIsoDate(record?.publishedAt) || new Date().toISOString();
  const updatedAt = normalizeIsoDate(record?.updatedAt) || publishedAt;
  const pathname = String(record?.pathname || '').trim();
  const videoUrl = String(record?.videoUrl || '').trim();

  if (!pathname || !videoUrl) {
    throw new Error('Short video metadata is incomplete');
  }

  return {
    id,
    title,
    caption: sanitizeCaption(record?.caption),
    videoUrl,
    pathname,
    status: sanitizeStatus(record?.status),
    publishedAt,
    updatedAt
  };
}

function normalizeIsoDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function parseJson(value, errorMessage) {
  try {
    return JSON.parse(value || '{}');
  } catch {
    throw new Error(errorMessage);
  }
}

function safePasswordMatch(value, expected) {
  if (!expected || expected.length < 24) return false;

  const actualBuffer = Buffer.from(String(value || ''));
  const expectedBuffer = Buffer.from(expected);

  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}
