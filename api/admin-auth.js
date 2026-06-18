import { assertAdminPassword } from './_shorts-store.js';
import {
  clearAdminSessionCookie,
  createAdminSessionCookie,
  hasValidAdminSession
} from './_admin-session.js';
import { assertLoginRateLimit, clearLoginRateLimit } from './_login-rate-limit.js';

const JSON_HEADERS = { 'Cache-Control': 'no-store' };

export async function GET(request) {
  if (!hasValidAdminSession(request)) {
    return Response.json({ authenticated: false }, { status: 401, headers: JSON_HEADERS });
  }

  return Response.json(
    {
      authenticated: true,
      user: {
        role: 'admin',
        label: 'AMIN TV admin'
      }
    },
    { headers: JSON_HEADERS }
  );
}

export async function POST(request) {
  try {
    await assertLoginRateLimit(request);

    const body = await request.json();
    assertAdminPassword(body?.password);
    await clearLoginRateLimit(request);

    return Response.json(
      {
        authenticated: true,
        user: {
          role: 'admin',
          label: 'AMIN TV admin'
        }
      },
      {
        headers: {
          ...JSON_HEADERS,
          'Set-Cookie': createAdminSessionCookie(request)
        }
      }
    );
  } catch (error) {
    const status = error?.status === 429 || error?.status === 503 ? error.status : 401;
    return Response.json(
      { error: getLoginErrorMessage(status) },
      {
        status,
        headers: {
          ...JSON_HEADERS,
          ...(error?.retryAfter ? { 'Retry-After': String(error.retryAfter) } : {})
        }
      }
    );
  }
}

export async function DELETE(request) {
  return Response.json(
    { authenticated: false },
    {
      headers: {
        ...JSON_HEADERS,
        'Set-Cookie': clearAdminSessionCookie(request)
      }
    }
  );
}

function getLoginErrorMessage(status) {
  if (status === 429) return 'Too many login attempts';
  if (status === 503) return 'Login protection unavailable';
  return 'Invalid credentials';
}
