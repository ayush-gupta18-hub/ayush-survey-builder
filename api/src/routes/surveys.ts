// api/src/routes/surveys.ts
import { Hono } from 'hono'
import {
  createSurvey,
  deleteSurvey,
  getQuestions,
  getSurvey,
  getSurveys,
  updateSurvey,
} from '../lib/db'
import { nanoid } from '../lib/id'
import type { AuthVariables } from '../middleware/auth'
import { authMiddleware } from '../middleware/auth'
import type { Env } from '../types'

const surveysRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

surveysRouter.use('*', authMiddleware)

surveysRouter.post('/', async (c) => {
  const user = c.get('user')
  try {
    const { title } = await c.req.json<{ title?: string }>()
    if (!title || typeof title !== 'string' || !title.trim()) {
      return c.json({ error: 'Title is required' }, 400)
    }

    const surveyId = nanoid(10)
    const newSurvey = await createSurvey(c.env.DB, {
      id: surveyId,
      owner_id: user.id,
      title: title.trim(),
    })

    return c.json(newSurvey, 201)
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to create survey'
    return c.json({ error: errMsg }, 500)
  }
})

surveysRouter.get('/', async (c) => {
  const user = c.get('user')
  try {
    const list = await getSurveys(c.env.DB, user.id)
    return c.json(list)
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to fetch surveys'
    return c.json({ error: errMsg }, 500)
  }
})

surveysRouter.get('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  try {
    const survey = await getSurvey(c.env.DB, id, user.id)
    if (!survey) {
      return c.json({ error: 'Survey not found' }, 404)
    }

    const questions = await getQuestions(c.env.DB, id)
    return c.json({ ...survey, questions })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to fetch survey'
    return c.json({ error: errMsg }, 500)
  }
})

interface SurveyPatch {
  title?: string
  description?: string
  primary_color?: string
  logo_url?: string
  welcome_message?: string
  thank_you_message?: string
  is_published?: boolean
}

surveysRouter.patch('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  try {
    const patch = await c.req.json<SurveyPatch>()
    const allowedPatch: SurveyPatch = {}

    if (patch.title !== undefined) allowedPatch.title = String(patch.title).trim()
    if (patch.description !== undefined) allowedPatch.description = String(patch.description).trim()
    if (patch.primary_color !== undefined) allowedPatch.primary_color = String(patch.primary_color)
    if (patch.logo_url !== undefined) allowedPatch.logo_url = String(patch.logo_url).trim()
    if (patch.welcome_message !== undefined)
      allowedPatch.welcome_message = String(patch.welcome_message).trim()
    if (patch.thank_you_message !== undefined)
      allowedPatch.thank_you_message = String(patch.thank_you_message).trim()
    if (patch.is_published !== undefined) allowedPatch.is_published = Boolean(patch.is_published)

    const updated = await updateSurvey(c.env.DB, id, user.id, allowedPatch)
    if (!updated) {
      return c.json({ error: 'Survey not found or modification failed' }, 404)
    }

    return c.json(updated)
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to update survey'
    return c.json({ error: errMsg }, 500)
  }
})

surveysRouter.delete('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  try {
    const success = await deleteSurvey(c.env.DB, id, user.id)
    if (!success) {
      return c.json({ error: 'Survey not found or deletion failed' }, 404)
    }
    return c.json({ ok: true })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to delete survey'
    return c.json({ error: errMsg }, 500)
  }
})

export default surveysRouter
