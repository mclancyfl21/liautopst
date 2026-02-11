import { SignJWT, jwtVerify } from 'jose';

const secretKey = 'secret'; // In production, use an environment variable
const key = new TextEncoder().encode(secretKey);

export interface SessionUser {
  id: number;
  email: string;
  role: string;
  companyName: string;
}

export interface SessionPayload {
  user: SessionUser;
  expires: Date | string;
  [key: string]: unknown;
}

export async function encrypt(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload as unknown as SessionPayload;
}
