import { del, list, put } from '@vercel/blob';
import { createHash } from 'node:crypto';

const LIMIT_PREFIX = 'security/login-rate/';
const WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export async function assertLoginRateLimit(request) {
  try {
    const record = await readRecord(request);
    const now = Date.now();
    const attempts = record.attempts.filter((time) => now - time < WINDOW_MS);

    if (attempts.length >= MAX_ATTEMPTS) {
      const retryAfter = Math.max(1, Math.ceil((WINDOW_MS - (now - attempts[0])) / 1000));
      const error = new Error('Too many login attempts');
      error.status = 429;
      error.retryAfter = retryAfter;
      throw error;
    }

    attempts.push(now);
    await writeRecord(request, { attempts, updatedAt: new Date(now).toISOString() });
  } catch (error) {
    if (error?.status === 429) throw error;
    console.error('Login rate limit unavailable', error);
    const unavailable = new Error('Login protection unavailable');
    unavailable.status = 503;
    throw unavailable;
  }
}

export async function clearLoginRateLimit(request) {
  try {
    await del(recordPath(request));
  } catch (error) {
    console.error('Login rate limit cleanup failed', error);
  }
}

async function readRecord(request) {
  const path = recordPath(request);
  const { blobs } = await list({ prefix: path, limit: 1 });
  if (!blobs.length) return { attempts: [] };

  try {
    const response = await fetch(blobs[0].url, { cache: 'no-store' });
    if (!response.ok) return { attempts: [] };
    const payload = await response.json();
    return {
      attempts: Array.isArray(payload.attempts)
        ? payload.attempts.map(Number).filter(Number.isFinite)
        : []
    };
  } catch {
    return { attempts: [] };
  }
}

async function writeRecord(request, record) {
  await put(recordPath(request), JSON.stringify(record), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json'
  });
}

function recordPath(request) {
  return `${LIMIT_PREFIX}${hashIp(getClientIp(request))}.json`;
}

function getClientIp(request) {
  const forwardedFor = request.headers.get('x-forwarded-for') || request.headers.get('x-vercel-forwarded-for') || '';
  const firstForwarded = forwardedFor.split(',')[0]?.trim();
  return firstForwarded || request.headers.get('x-real-ip') || 'unknown';
}

function hashIp(value) {
  return createHash('sha256').update(String(value || 'unknown')).digest('hex');
}
