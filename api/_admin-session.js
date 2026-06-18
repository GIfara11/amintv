import { createHmac, timingSafeEqual } from 'node:crypto';

export const ADMIN_SESSION_COOKIE = 'amin_admin_session';

const SESSION_SECONDS = 7 * 24 * 60 * 60;

export function createAdminSessionCookie(request) {
  const now = Math.floor(Date.now() / 1000);
  const token = signPayload({
    role: 'admin',
    iat: now,
    exp: now + SESSION_SECONDS
  });
  return [
    `${ADMIN_SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${SESSION_SECONDS}`,
    isSecureRequest(request) ? 'Secure' : ''
  ].filter(Boolean).join('; ');
}

export function clearAdminSessionCookie(request) {
  return [
    `${ADMIN_SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=0',
    isSecureRequest(request) ? 'Secure' : ''
  ].filter(Boolean).join('; ');
}

export function hasValidAdminSession(request) {
  const token = getCookie(request, ADMIN_SESSION_COOKIE);
  if (!token) return false;

  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return false;

  const now = Math.floor(Date.now() / 1000);
  return Number(payload.exp || 0) > now;
}

function signPayload(payload) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

function verifyToken(token) {
  const [encodedPayload, signature] = String(token || '').split('.');
  if (!encodedPayload || !signature) return null;

  if (!safeEqual(signature, sign(encodedPayload))) return null;

  try {
    return JSON.parse(base64UrlDecode(encodedPayload));
  } catch {
    return null;
  }
}

function sign(value) {
  const secret = getSessionSecret();
  if (!secret) return '';
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.SHORTS_ADMIN_PASSWORD || '';
  return secret.length >= 24 ? secret : '';
}

function getCookie(request, name) {
  const cookie = request.headers.get('cookie') || '';
  const prefix = `${name}=`;
  return cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length) || '';
}

function isSecureRequest(request) {
  const proto = request.headers.get('x-forwarded-proto');
  if (proto) return proto === 'https';

  try {
    return new URL(request.url).protocol === 'https:';
  } catch {
    return true;
  }
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ''));
  const rightBuffer = Buffer.from(String(right || ''));
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}
