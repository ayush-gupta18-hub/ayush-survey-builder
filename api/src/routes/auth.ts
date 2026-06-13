// api/src/routes/auth.ts
import { Hono } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import { upsertUser } from '../lib/db'
import { sign } from '../lib/jwt'
import type { AuthVariables } from '../middleware/auth'
import { authMiddleware } from '../middleware/auth'
import type { Env } from '../types'

const authRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

authRouter.get('/github', (c) => {
  const clientId = c.env.GITHUB_CLIENT_ID
  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email`
  return c.redirect(redirectUrl)
})

authRouter.get('/github/callback', async (c) => {
  const code = c.req.query('code')
  if (!code) {
    return c.json({ error: 'Missing code parameter' }, 400)
  }

  try {
    // 1. Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: c.env.GITHUB_CLIENT_ID,
        client_secret: c.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    const tokenData = (await tokenResponse.json()) as { access_token?: string; error?: string }
    if (!tokenData.access_token) {
      return c.json({ error: tokenData.error || 'Failed to exchange OAuth code' }, 400)
    }

    const accessToken = tokenData.access_token

    // 2. Fetch user profile
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'docodego-survey-builder',
      },
    })

    const githubUser = (await userResponse.json()) as {
      id: number
      email: string | null
      name: string | null
      login: string
      avatar_url: string
    }

    let email = githubUser.email

    // 3. Fetch emails if not public
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'docodego-survey-builder',
        },
      })

      if (emailsResponse.ok) {
        const emails = (await emailsResponse.json()) as Array<{
          email: string
          primary: boolean
          verified: boolean
        }>
        const primaryEmail = emails.find((e) => e.primary && e.verified) || emails[0]
        if (primaryEmail) {
          email = primaryEmail.email
        }
      }
    }

    if (!email) {
      email = `${githubUser.id}+${githubUser.login}@users.noreply.github.com`
    }

    // 4. Upsert user in database
    const user = await upsertUser(c.env.DB, {
      id: String(githubUser.id),
      email,
      name: githubUser.name || githubUser.login,
      avatar_url: githubUser.avatar_url,
    })

    // 5. Sign JWT
    const jwt = await sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
      },
      c.env.JWT_SECRET,
    )

    // 6. Set HttpOnly cookie
    setCookie(c, 'token', jwt, {
      httpOnly: true,
      sameSite: 'Lax',
      path: '/',
      secure: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    // 7. Redirect to frontend dashboard
    return c.redirect(`${c.env.FRONTEND_URL}/dashboard`)
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Authentication failed'
    return c.json({ error: errMsg }, 500)
  }
})

authRouter.post('/logout', (c) => {
  deleteCookie(c, 'token', {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    secure: true,
  })
  return c.json({ ok: true })
})

authRouter.get('/me', authMiddleware, (c) => {
  const user = c.get('user')
  return c.json(user)
})

export default authRouter
