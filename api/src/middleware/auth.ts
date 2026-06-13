// api/src/middleware/auth.ts
import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { getUser } from '../lib/db'
import { verify } from '../lib/jwt'
import type { Env, User } from '../types'

export type AuthVariables = {
  user: User
}

export const authMiddleware = createMiddleware<{ Bindings: Env; Variables: AuthVariables }>(
  async (c, next) => {
    let token = getCookie(c, 'token')
    if (!token) {
      const authHeader = c.req.header('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }
    if (!token) {
      return c.json({ error: 'Unauthorized: Missing token' }, 401)
    }

    try {
      const payload = await verify(token, c.env.JWT_SECRET)
      const user = await getUser(c.env.DB, payload.sub)
      if (!user) {
        return c.json({ error: 'Unauthorized: User not found' }, 401)
      }

      c.set('user', user)
      await next()
    } catch {
      return c.json({ error: 'Unauthorized: Invalid token' }, 401)
    }
  },
)
