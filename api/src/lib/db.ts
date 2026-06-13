// api/src/lib/db.ts
import type { Question, QuestionType, Survey, SurveyResponse, User } from '../types'

export async function getUser(db: D1Database, id: string): Promise<User | null> {
  const row = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first()
  if (!row) return null
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    avatar_url: row.avatar_url as string,
  }
}

export async function upsertUser(db: D1Database, user: Omit<User, 'created_at'>): Promise<User> {
  const row = await db
    .prepare(`
    INSERT INTO users (id, email, name, avatar_url)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      email = excluded.email,
      name = excluded.name,
      avatar_url = excluded.avatar_url
    RETURNING *
  `)
    .bind(user.id, user.email, user.name, user.avatar_url)
    .first()

  if (!row) throw new Error('Failed to upsert user')

  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    avatar_url: row.avatar_url as string,
  }
}

export async function getSurveys(db: D1Database, ownerId: string): Promise<Survey[]> {
  const { results } = await db
    .prepare(`
    SELECT s.*,
           COUNT(DISTINCT r.id) as response_count,
           COUNT(DISTINCT q.id) as question_count
    FROM surveys s
    LEFT JOIN responses r ON s.id = r.survey_id
    LEFT JOIN questions q ON s.id = q.survey_id
    WHERE s.owner_id = ?
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `)
    .bind(ownerId)
    .all()

  return results.map((row) => ({
    id: row.id as string,
    owner_id: row.owner_id as string,
    title: row.title as string,
    description: row.description as string,
    primary_color: row.primary_color as string,
    logo_url: row.logo_url as string,
    welcome_message: row.welcome_message as string,
    thank_you_message: row.thank_you_message as string,
    is_published: row.is_published === 1,
    created_at: row.created_at as number,
    updated_at: row.updated_at as number,
    response_count: row.response_count as number,
    question_count: row.question_count as number,
  }))
}

export async function getSurvey(
  db: D1Database,
  id: string,
  ownerId?: string,
): Promise<Survey | null> {
  const query = ownerId
    ? db.prepare('SELECT * FROM surveys WHERE id = ? AND owner_id = ?').bind(id, ownerId)
    : db.prepare('SELECT * FROM surveys WHERE id = ?').bind(id)

  const row = await query.first()
  if (!row) return null

  return {
    id: row.id as string,
    owner_id: row.owner_id as string,
    title: row.title as string,
    description: row.description as string,
    primary_color: row.primary_color as string,
    logo_url: row.logo_url as string,
    welcome_message: row.welcome_message as string,
    thank_you_message: row.thank_you_message as string,
    is_published: row.is_published === 1,
    created_at: row.created_at as number,
    updated_at: row.updated_at as number,
  }
}

export async function createSurvey(
  db: D1Database,
  data: { id: string; owner_id: string; title: string },
): Promise<Survey> {
  const row = await db
    .prepare(`
    INSERT INTO surveys (id, owner_id, title)
    VALUES (?, ?, ?)
    RETURNING *
  `)
    .bind(data.id, data.owner_id, data.title)
    .first()

  if (!row) throw new Error('Failed to create survey')

  return {
    id: row.id as string,
    owner_id: row.owner_id as string,
    title: row.title as string,
    description: row.description as string,
    primary_color: row.primary_color as string,
    logo_url: row.logo_url as string,
    welcome_message: row.welcome_message as string,
    thank_you_message: row.thank_you_message as string,
    is_published: row.is_published === 1,
    created_at: row.created_at as number,
    updated_at: row.updated_at as number,
  }
}

export async function updateSurvey(
  db: D1Database,
  id: string,
  ownerId: string,
  patch: Partial<Omit<Survey, 'id' | 'owner_id' | 'created_at' | 'updated_at'>>,
): Promise<Survey | null> {
  const keys = Object.keys(patch) as Array<keyof typeof patch>
  if (keys.length === 0) {
    return await getSurvey(db, id, ownerId)
  }

  const setClauses: string[] = []
  const values: unknown[] = []

  for (const key of keys) {
    if (key === 'is_published') {
      setClauses.push('is_published = ?')
      values.push(patch.is_published ? 1 : 0)
    } else {
      setClauses.push(`${key} = ?`)
      values.push(patch[key])
    }
  }

  setClauses.push('updated_at = unixepoch()')
  values.push(id, ownerId)

  const row = await db
    .prepare(`
    UPDATE surveys
    SET ${setClauses.join(', ')}
    WHERE id = ? AND owner_id = ?
    RETURNING *
  `)
    .bind(...values)
    .first()

  if (!row) return null

  return {
    id: row.id as string,
    owner_id: row.owner_id as string,
    title: row.title as string,
    description: row.description as string,
    primary_color: row.primary_color as string,
    logo_url: row.logo_url as string,
    welcome_message: row.welcome_message as string,
    thank_you_message: row.thank_you_message as string,
    is_published: row.is_published === 1,
    created_at: row.created_at as number,
    updated_at: row.updated_at as number,
  }
}

export async function deleteSurvey(db: D1Database, id: string, ownerId: string): Promise<boolean> {
  const { success } = await db
    .prepare(`
    DELETE FROM surveys
    WHERE id = ? AND owner_id = ?
  `)
    .bind(id, ownerId)
    .run()
  return success
}

export async function getQuestions(db: D1Database, surveyId: string): Promise<Question[]> {
  const { results } = await db
    .prepare(`
    SELECT * FROM questions
    WHERE survey_id = ?
    ORDER BY position ASC
  `)
    .bind(surveyId)
    .all()

  return results.map((row) => ({
    id: row.id as string,
    survey_id: row.survey_id as string,
    type: row.type as QuestionType,
    label: row.label as string,
    required: row.required === 1,
    position: row.position as number,
    options: JSON.parse((row.options as string) || '[]'),
  }))
}

export async function createQuestion(
  db: D1Database,
  data: {
    id: string
    survey_id: string
    type: QuestionType
    label: string
    required: boolean
    position: number
    options: string[]
  },
): Promise<Question> {
  const row = await db
    .prepare(`
    INSERT INTO questions (id, survey_id, type, label, required, position, options)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `)
    .bind(
      data.id,
      data.survey_id,
      data.type,
      data.label,
      data.required ? 1 : 0,
      data.position,
      JSON.stringify(data.options),
    )
    .first()

  if (!row) throw new Error('Failed to create question')

  return {
    id: row.id as string,
    survey_id: row.survey_id as string,
    type: row.type as QuestionType,
    label: row.label as string,
    required: row.required === 1,
    position: row.position as number,
    options: JSON.parse((row.options as string) || '[]'),
  }
}

export async function updateQuestion(
  db: D1Database,
  id: string,
  surveyId: string,
  patch: Partial<Omit<Question, 'id' | 'survey_id'>>,
): Promise<Question | null> {
  const keys = Object.keys(patch) as Array<keyof typeof patch>
  if (keys.length === 0) {
    const row = await db
      .prepare('SELECT * FROM questions WHERE id = ? AND survey_id = ?')
      .bind(id, surveyId)
      .first()
    if (!row) return null
    return {
      id: row.id as string,
      survey_id: row.survey_id as string,
      type: row.type as QuestionType,
      label: row.label as string,
      required: row.required === 1,
      position: row.position as number,
      options: JSON.parse((row.options as string) || '[]'),
    }
  }

  const setClauses: string[] = []
  const values: unknown[] = []

  for (const key of keys) {
    if (key === 'required') {
      setClauses.push('required = ?')
      values.push(patch.required ? 1 : 0)
    } else if (key === 'options') {
      setClauses.push('options = ?')
      values.push(JSON.stringify(patch.options))
    } else {
      setClauses.push(`${key} = ?`)
      values.push(patch[key])
    }
  }

  values.push(id, surveyId)

  const row = await db
    .prepare(`
    UPDATE questions
    SET ${setClauses.join(', ')}
    WHERE id = ? AND survey_id = ?
    RETURNING *
  `)
    .bind(...values)
    .first()

  if (!row) return null

  return {
    id: row.id as string,
    survey_id: row.survey_id as string,
    type: row.type as QuestionType,
    label: row.label as string,
    required: row.required === 1,
    position: row.position as number,
    options: JSON.parse((row.options as string) || '[]'),
  }
}

export async function deleteQuestion(
  db: D1Database,
  id: string,
  surveyId: string,
): Promise<boolean> {
  const { success } = await db
    .prepare(`
    DELETE FROM questions
    WHERE id = ? AND survey_id = ?
  `)
    .bind(id, surveyId)
    .run()
  return success
}

export async function reorderQuestions(
  db: D1Database,
  surveyId: string,
  orderedIds: string[],
): Promise<boolean> {
  const statements = orderedIds.map((id, index) => {
    return db
      .prepare(`
      UPDATE questions
      SET position = ?
      WHERE id = ? AND survey_id = ?
    `)
      .bind(index, id, surveyId)
  })

  const results = await db.batch(statements)
  return results.every((res) => res.success)
}

export async function createResponse(
  db: D1Database,
  data: { id: string; survey_id: string; answers: Record<string, string | number> },
): Promise<SurveyResponse> {
  const row = await db
    .prepare(`
    INSERT INTO responses (id, survey_id, answers)
    VALUES (?, ?, ?)
    RETURNING *
  `)
    .bind(data.id, data.survey_id, JSON.stringify(data.answers))
    .first()

  if (!row) throw new Error('Failed to create response')

  return {
    id: row.id as string,
    survey_id: row.survey_id as string,
    answers: JSON.parse((row.answers as string) || '{}'),
    submitted_at: row.submitted_at as number,
  }
}

export async function getResponses(
  db: D1Database,
  surveyId: string,
  ownerId: string,
): Promise<SurveyResponse[]> {
  const { results } = await db
    .prepare(`
    SELECT r.*
    FROM responses r
    JOIN surveys s ON r.survey_id = s.id
    WHERE r.survey_id = ? AND s.owner_id = ?
    ORDER BY r.submitted_at DESC
  `)
    .bind(surveyId, ownerId)
    .all()

  return results.map((row) => ({
    id: row.id as string,
    survey_id: row.survey_id as string,
    answers: JSON.parse((row.answers as string) || '{}'),
    submitted_at: row.submitted_at as number,
  }))
}
