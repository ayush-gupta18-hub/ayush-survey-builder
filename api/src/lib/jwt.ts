// api/src/lib/jwt.ts
import { jwtVerify, SignJWT } from 'jose'

export interface JWTPayload {
  sub: string
  email: string
  name: string
  avatar_url: string
  [key: string]: unknown
}

export async function sign(
  payload: { sub: string; email: string; name: string; avatar_url: string },
  secret: string,
): Promise<string> {
  const secretKey = new TextEncoder().encode(secret)
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey)
}

export async function verify(token: string, secret: string): Promise<JWTPayload> {
  const secretKey = new TextEncoder().encode(secret)
  const { payload } = await jwtVerify(token, secretKey)
  return payload as unknown as JWTPayload
}
