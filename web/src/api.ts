// web/src/api.ts
import type { Question, Survey, SurveyResponse, User } from './types'

const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  if (!envUrl) return '/api'
  const url = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl
  return url.endsWith('/api') ? url : `${url}/api`
}

export const BASE_URL = getApiUrl()

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`
  const headers = new Headers(options?.headers)
  if (!headers.has('Content-Type') && !(options?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const token = localStorage.getItem('token')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    let errMsg = `Request failed with status ${response.status}`
    try {
      const data = (await response.json()) as { error?: string }
      if (data.error) errMsg = data.error
    } catch (_) {}
    throw new Error(errMsg)
  }

  if (response.status === 204) {
    return null as unknown as T
  }

  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    return (await response.json()) as T
  }

  return null as unknown as T
}

export function getMe(): Promise<User> {
  return request<User>('/auth/me')
}

export async function logout(): Promise<void> {
  localStorage.removeItem('token')
  await request<void>('/auth/logout', { method: 'POST' })
}

export function getSurveys(): Promise<Survey[]> {
  return request<Survey[]>('/surveys')
}

export function getSurvey(id: string): Promise<Survey & { questions: Question[] }> {
  return request<Survey & { questions: Question[] }>(`/surveys/${id}`)
}

export function createSurvey(title: string): Promise<Survey> {
  return request<Survey>('/surveys', {
    method: 'POST',
    body: JSON.stringify({ title }),
  })
}

export function updateSurvey(id: string, patch: Partial<Survey>): Promise<Survey> {
  return request<Survey>(`/surveys/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export async function deleteSurvey(id: string): Promise<void> {
  await request<void>(`/surveys/${id}`, { method: 'DELETE' })
}

export function createQuestion(
  surveyId: string,
  data: Omit<Question, 'id' | 'survey_id'>,
): Promise<Question> {
  return request<Question>(`/surveys/${surveyId}/questions`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateQuestion(
  surveyId: string,
  qid: string,
  patch: Partial<Question>,
): Promise<Question> {
  return request<Question>(`/surveys/${surveyId}/questions/${qid}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export async function deleteQuestion(surveyId: string, qid: string): Promise<void> {
  await request<void>(`/surveys/${surveyId}/questions/${qid}`, { method: 'DELETE' })
}

export async function reorderQuestions(surveyId: string, order: string[]): Promise<void> {
  await request<void>(`/surveys/${surveyId}/questions/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ order }),
  })
}

export async function submitResponse(
  surveyId: string,
  answers: Record<string, string | number>,
): Promise<void> {
  await request<void>(`/surveys/${surveyId}/respond`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  })
}

export function getResponses(surveyId: string): Promise<SurveyResponse[]> {
  return request<SurveyResponse[]>(`/surveys/${surveyId}/responses`)
}

export function getPublicSurvey(id: string): Promise<Survey & { questions: Question[] }> {
  return request<Survey & { questions: Question[] }>(`/public/surveys/${id}`)
}
