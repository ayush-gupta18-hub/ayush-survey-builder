// web/src/types.ts

export type QuestionType = 'short_text' | 'multiple_choice' | 'rating'

export interface User {
  id: string
  email: string
  name: string
  avatar_url: string
}

export interface Survey {
  id: string
  owner_id: string
  title: string
  description: string
  primary_color: string
  logo_url: string
  welcome_message?: string
  thank_you_message?: string
  is_published: boolean
  created_at: number
  updated_at: number
  response_count?: number
  question_count?: number
}

export interface Question {
  id: string
  survey_id: string
  type: QuestionType
  label: string
  required: boolean
  position: number
  options: string[]
}

export interface SurveyResponse {
  id: string
  survey_id: string
  answers: Record<string, string | number>
  submitted_at: number
}
