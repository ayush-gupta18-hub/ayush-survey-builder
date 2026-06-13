// api/src/routes/responses.ts
import { Hono } from 'hono'
import { createResponse, getQuestions, getResponses, getSurvey } from '../lib/db'
import { nanoid } from '../lib/id'
import type { AuthVariables } from '../middleware/auth'
import { authMiddleware } from '../middleware/auth'
import type { Env } from '../types'

const responsesRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

responsesRouter.post('/:id/respond', async (c) => {
  const surveyId = c.req.param('id')
  try {
    const survey = await getSurvey(c.env.DB, surveyId)
    if (!survey?.is_published) {
      return c.json({ error: 'Survey not found or not published' }, 404)
    }

    const questions = await getQuestions(c.env.DB, surveyId)
    const { answers } = await c.req.json<{ answers?: Record<string, string | number> }>()
    if (!answers || typeof answers !== 'object') {
      return c.json({ error: 'Answers object is required' }, 400)
    }

    for (const q of questions) {
      if (q.required) {
        const val = answers[q.id]
        if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
          return c.json({ error: `Question "${q.label}" is required` }, 400)
        }
      }
    }

    const responseId = nanoid(10)
    await createResponse(c.env.DB, {
      id: responseId,
      survey_id: surveyId,
      answers,
    })

    return c.json({ ok: true })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to submit response'
    return c.json({ error: errMsg }, 500)
  }
})

responsesRouter.get('/:id/responses', authMiddleware, async (c) => {
  const user = c.get('user')
  const surveyId = c.req.param('id')
  try {
    const list = await getResponses(c.env.DB, surveyId, user.id)
    return c.json(list)
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to fetch responses'
    return c.json({ error: errMsg }, 500)
  }
})

export default responsesRouter
