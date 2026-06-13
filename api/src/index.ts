// api/src/index.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import authRouter from './routes/auth'
import publicRouter from './routes/public'
import questionsRouter from './routes/questions'
import responsesRouter from './routes/responses'
import surveysRouter from './routes/surveys'
import type { Env } from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('/api/*', async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    maxAge: 600,
  })
  return corsMiddleware(c, next)
})

app.get('/api/health', (c) => c.json({ status: 'ok' }))

app.route('/api/auth', authRouter)
app.route('/api/surveys', surveysRouter)
app.route('/api/surveys', questionsRouter)
app.route('/api/surveys', responsesRouter)
app.route('/api/public', publicRouter)

export default app
