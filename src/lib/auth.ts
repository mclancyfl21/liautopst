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
