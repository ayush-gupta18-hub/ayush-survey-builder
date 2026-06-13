// api/src/routes/public.ts
import { Hono } from 'hono'
import { getQuestions, getSurvey } from '../lib/db'
import type { Env } from '../types'

const publicRouter = new Hono<{ Bindings: Env }>()

publicRouter.get('/surveys/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const survey = await getSurvey(c.env.DB, id)
    if (!survey?.is_published) {
      return c.json({ error: 'Survey not found or not published' }, 404)
    }

    const questions = await getQuestions(c.env.DB, id)
    return c.json({ ...survey, questions })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to fetch public survey'
    return c.json({ error: errMsg }, 500)
  }
})

export default publicRouter
