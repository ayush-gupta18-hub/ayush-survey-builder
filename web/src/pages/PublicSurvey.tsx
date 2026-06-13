// web/src/pages/PublicSurvey.tsx
import { useParams } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getPublicSurvey, submitResponse } from '../api'
import Spinner from '../components/Spinner'
import type { Question, Survey } from '../types'

export default function PublicSurvey() {
  const { id } = useParams({ from: '/s/$id' })
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Answers state
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  // Validation error state per question
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        setLoading(true)
        const data = await getPublicSurvey(id)
        setSurvey(data)
        setQuestions(data.questions || [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Survey not found or not published')
      } finally {
        setLoading(false)
      }
    }

    fetchSurvey()
  }, [id])

  // Apply brand color to document root variable just in case
  useEffect(() => {
    const color = survey?.primary_color || '#6366f1'
    document.documentElement.style.setProperty('--brand', color)
    return () => {
      document.documentElement.style.removeProperty('--brand')
    }
  }, [survey])

  // Calculate completion progress
  const answeredCount = questions.filter((q) => {
    const val = answers[q.id]
    return val !== undefined && val !== null && val !== ''
  }).length
  const progressPercent =
    questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0

  const handleAnswerChange = (qid: string, val: string | number) => {
    setAnswers((prev) => ({ ...prev, [qid]: val }))
    // Clear validation error if answered
    if (val !== undefined && val !== null && val !== '') {
      setValidationErrors((prev) => {
        const copy = { ...prev }
        delete copy[qid]
        return copy
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Run client side validations
    const errors: Record<string, string> = {}
    for (const q of questions) {
      if (q.required) {
        const val = answers[q.id]
        if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
          errors[q.id] = 'This field is required'
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      // Scroll to the first error
      const firstErrorQid = Object.keys(errors)[0]
      if (firstErrorQid) {
        document.getElementById(`q-card-${firstErrorQid}`)?.scrollIntoView({ behavior: 'smooth' })
      }
      return
    }

    try {
      setSubmitting(true)
      await submitResponse(id, answers)
      setSubmitted(true)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit response')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner />
  if (error || !survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md w-full shadow-sm text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-bold text-gray-900">Survey Unavailable</h3>
          <p className="mt-2 text-sm text-gray-500">
            This survey is not available or has not been published by the owner.
          </p>
        </div>
      </div>
    )
  }

  const brandColor = survey.primary_color || '#6366f1'

  // Thank you card
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 max-w-lg w-full shadow-md text-center space-y-6">
          {survey.logo_url && (
            <div className="flex justify-center">
              <img
                key={survey.logo_url}
                src={survey.logo_url}
                alt="Brand logo"
                className="max-h-12 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Thank you!</h1>
            <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
              {survey.thank_you_message || 'Thank you for your feedback!'}
            </p>
          </div>
          <div className="pt-4 flex justify-center">
            <div className="w-16 h-1.5 rounded-full" style={{ backgroundColor: brandColor }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col font-sans relative"
      style={{ '--brand': brandColor } as React.CSSProperties}
    >
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-1.5 sticky top-0 z-50">
        <div
          className="h-1.5 transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%`, backgroundColor: brandColor }}
        />
      </div>

      <div className="flex-1 max-w-xl w-full mx-auto px-4 py-12 flex flex-col justify-between">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-4">
            {survey.logo_url && (
              <div>
                <img
                  key={survey.logo_url}
                  src={survey.logo_url}
                  alt="Brand logo"
                  className="max-h-12 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {survey.title}
              </h1>
              {(survey.welcome_message || survey.description) && (
                <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
                  {survey.welcome_message || survey.description}
                </p>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {questions.map((q) => {
              const qError = validationErrors[q.id]
              const value = answers[q.id]

              return (
                <div
                  key={q.id}
                  id={`q-card-${q.id}`}
                  className={`bg-white rounded-xl border p-6 shadow-sm space-y-4 transition-colors ${
                    qError ? 'border-red-300 bg-red-50/10' : 'border-gray-200'
                  }`}
                >
                  <label className="block text-base font-semibold text-gray-900 select-none">
                    {q.label}
                    {q.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {/* Render question based on type */}
                  {q.type === 'short_text' && (
                    <input
                      type="text"
                      value={(value as string) || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm p-3 border bg-white"
                      placeholder="Type your answer here..."
                    />
                  )}

                  {q.type === 'multiple_choice' && (
                    <div className="space-y-2.5">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = value === opt
                        return (
                          <div
                            key={oIdx}
                            onClick={() => handleAnswerChange(q.id, opt)}
                            className={`flex items-center p-3.5 border rounded-lg cursor-pointer hover:bg-brand/5 transition-all ${
                              isSelected ? 'border-brand bg-brand/5 shadow-sm' : 'border-gray-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`radio-${q.id}`}
                              checked={isSelected}
                              onChange={() => handleAnswerChange(q.id, opt)}
                              className="h-4 w-4 text-brand focus:ring-brand cursor-pointer"
                            />
                            <span className="ml-3 text-sm font-medium text-gray-800 select-none">
                              {opt}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {q.type === 'rating' && (
                    <div className="flex justify-between max-w-sm mx-auto pt-2">
                      {[1, 2, 3, 4, 5].map((val) => {
                        const isSelected = value === val
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleAnswerChange(q.id, val)}
                            className={`h-12 w-12 rounded-lg border text-base font-bold shadow-sm flex items-center justify-center transition-all focus:outline-none ${
                              isSelected
                                ? 'bg-brand text-white border-brand scale-105 shadow-md'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-brand/50 hover:bg-brand/5 hover:scale-105'
                            }`}
                          >
                            {val}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Inline Error */}
                  {qError && <p className="text-xs font-semibold text-red-600 mt-1">{qError}</p>}
                </div>
              )
            })}

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center px-4 py-3.5 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-brand hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
