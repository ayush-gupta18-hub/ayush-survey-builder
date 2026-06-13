// api/src/routes/questions.ts
import { Hono } from 'hono'
import {
  createQuestion,
  deleteQuestion,
  getSurvey,
  reorderQuestions,
  updateQuestion,
} from '../lib/db'
import { nanoid } from '../lib/id'
import type { AuthVariables } from '../middleware/auth'
import { authMiddleware } from '../middleware/auth'
import type { Env, QuestionType } from '../types'

const questionsRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

questionsRouter.use('*', authMiddleware)

interface CreateQuestionInput {
  type: 'short_text' | 'multiple_choice' | 'rating'
  label: string
  required?: boolean
  position: number
  options?: string[]
}

interface PatchQuestionInput {
  label?: string
  required?: boolean
  position?: number
  options?: string[]
}

questionsRouter.post('/:id/questions', async (c) => {
  const user = c.get('user')
  const surveyId = c.req.param('id')
  try {
    // 1. Verify survey ownership
    const survey = await getSurvey(c.env.DB, surveyId, user.id)
    if (!survey) {
      return c.json({ error: 'Survey not found or unauthorized' }, 404)
    }

    // 2. Parse body
    const body = await c.req.json<CreateQuestionInput>()
    if (!body.type || !['short_text', 'multiple_choice', 'rating'].includes(body.type)) {
      return c.json({ error: 'Valid question type is required' }, 400)
    }
    if (!body.label || typeof body.label !== 'string' || !body.label.trim()) {
      return c.json({ error: 'Label is required' }, 400)
    }

    const qid = nanoid(10)
    const newQuestion = await createQuestion(c.env.DB, {
      id: qid,
      survey_id: surveyId,
      type: body.type as QuestionType,
      label: body.label.trim(),
      required: Boolean(body.required),
      position: typeof body.position === 'number' ? body.position : 0,
      options: Array.isArray(body.options) ? body.options.map(String) : [],
    })

    return c.json(newQuestion, 201)
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to create question'
    return c.json({ error: errMsg }, 500)
  }
})

questionsRouter.patch('/:id/questions/:qid', async (c) => {
  const user = c.get('user')
  const surveyId = c.req.param('id')
  const qid = c.req.param('qid')
  try {
    // 1. Verify survey ownership
    const survey = await getSurvey(c.env.DB, surveyId, user.id)
    if (!survey) {
      return c.json({ error: 'Survey not found or unauthorized' }, 404)
    }

    // 2. Parse body
    const body = await c.req.json<PatchQuestionInput>()
    const patch: PatchQuestionInput = {}
    if (body.label !== undefined) patch.label = String(body.label).trim()
    if (body.required !== undefined) patch.required = Boolean(body.required)
    if (body.position !== undefined) patch.position = Number(body.position)
    if (body.options !== undefined) {
      patch.options = Array.isArray(body.options) ? body.options.map(String) : []
    }

    const updated = await updateQuestion(c.env.DB, qid, surveyId, patch)
    if (!updated) {
      return c.json({ error: 'Question not found' }, 404)
    }

    return c.json(updated)
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to update question'
    return c.json({ error: errMsg }, 500)
  }
})

questionsRouter.delete('/:id/questions/:qid', async (c) => {
  const user = c.get('user')
  const surveyId = c.req.param('id')
  const qid = c.req.param('qid')
  try {
    // 1. Verify survey ownership
    const survey = await getSurvey(c.env.DB, surveyId, user.id)
    if (!survey) {
      return c.json({ error: 'Survey not found or unauthorized' }, 404)
    }

    const success = await deleteQuestion(c.env.DB, qid, surveyId)
    if (!success) {
      return c.json({ error: 'Question not found or deletion failed' }, 404)
    }

    return c.json({ ok: true })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to delete question'
    return c.json({ error: errMsg }, 500)
  }
})

questionsRouter.put('/:id/questions/reorder', async (c) => {
  const user = c.get('user')
  const surveyId = c.req.param('id')
  try {
    // 1. Verify survey ownership
    const survey = await getSurvey(c.env.DB, surveyId, user.id)
    if (!survey) {
      return c.json({ error: 'Survey not found or unauthorized' }, 404)
    }

    // 2. Parse body
    const { order } = await c.req.json<{ order?: string[] }>()
    if (!order || !Array.isArray(order)) {
      return c.json({ error: 'Order array is required' }, 400)
    }

    const success = await reorderQuestions(c.env.DB, surveyId, order)
    if (!success) {
      return c.json({ error: 'Reordering failed' }, 500)
    }

    return c.json({ ok: true })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to reorder questions'
    return c.json({ error: errMsg }, 500)
  }
})

export default questionsRouter
