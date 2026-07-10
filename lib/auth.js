import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const SESSION_COOKIE_NAME = 'session';
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: SESSION_COOKIE_MAX_AGE,
  path: '/',
};

function getJwtKey() {
  const secretKey = process.env.JWT_SECRET;
  if (!secretKey || secretKey.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set and at least 32 characters long.');
    }
    // Dev fallback avoids hard 500s during local setup.
    const fallback = 'dev-only-jwt-secret-change-this-before-production-32+';
    console.warn('Using development fallback JWT secret. Set JWT_SECRET (>=32 chars) in .env.local.');
    return new TextEncoder().encode(fallback);
  }
  return new TextEncoder().encode(secretKey);
}

export async function signToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtKey());
}

export async function verifyToken(input) {
  try {
    const { payload } = await jwtVerify(input, getJwtKey(), {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    console.error("JWT Verification failed:", error.message);
    return null;
  }
}

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    const token = sessionCookie?.value;
    
    if (!token) {
      return null;
    }
    
    const verified = await verifyToken(token);
    return verified;
  } catch (error) {
    console.error("Auth Error:", error);
    return null;
  }
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return false;
  }
  return session;
}
