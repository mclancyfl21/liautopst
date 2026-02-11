import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { encrypt as jwtEncrypt, decrypt as jwtDecrypt, SessionUser, SessionPayload } from './auth-utils';

export async function encrypt(payload: SessionPayload) {
  return await jwtEncrypt(payload);
}

export async function decrypt(input: string): Promise<SessionPayload> {
  return await jwtDecrypt(input);
}

export async function login(user: SessionUser) {
  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const session = await encrypt({ user, expires });

  (await cookies()).set('session', session, { expires, httpOnly: true });
}

export async function logout() {
  (await cookies()).set('session', '', { expires: new Date(0) });
}

export async function getSession(): Promise<SessionPayload | null> {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function getTenantId(): Promise<number> {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  
  if (!session.user.tenantId) {
    const { db } = await import('@/db');
    const { users } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    
    const user = await db.select().from(users).where(eq(users.id, session.user.id)).get();
    if (user) return user.tenantId;
    throw new Error('Tenant context missing. Please re-login.');
  }
  
  return session.user.tenantId;
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  if (!session) return;

  const parsed = await decrypt(session);
  parsed.expires = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const res = NextResponse.next();
  res.cookies.set({
    name: 'session',
    value: await encrypt(parsed),
    httpOnly: true,
    expires: parsed.expires,
  });
  return res;
}
