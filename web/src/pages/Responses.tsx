// web/src/pages/Responses.tsx
import { Link, useParams } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getResponses, getSurvey } from '../api'
import ErrorMessage from '../components/ErrorMessage'
import Spinner from '../components/Spinner'
import type { Question, Survey, SurveyResponse } from '../types'

export default function Responses() {
  const { id } = useParams({ from: '/surveys/$id/responses' })
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [surveyData, responsesData] = await Promise.all([getSurvey(id), getResponses(id)])
        setSurvey(surveyData)
        setQuestions(surveyData.questions || [])
        setResponses(responsesData)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch responses data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const renderStars = (rating: string | number) => {
    const num = typeof rating === 'number' ? rating : Number.parseInt(String(rating), 10)
    if (Number.isNaN(num) || num < 1 || num > 5) return String(rating)
    return '★'.repeat(num) + '☆'.repeat(5 - num)
  }

  if (loading) return <Spinner />
  if (error || !survey) return <ErrorMessage message={error || 'Survey not found'} />

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          ← Dashboard
        </Link>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {responses.length === 1 ? '1 response' : `${responses.length} responses`} received
          </p>
        </div>
      </div>

      {responses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Total Responses
            </span>
            <span className="text-3xl font-extrabold text-gray-900 block mt-1">
              {responses.length}
            </span>
          </div>
          {questions
            .filter((q) => q.type === 'rating')
            .map((q) => {
              const ratingAnswers = responses
                .map((r) => r.answers[q.id])
                .filter((val) => val !== undefined && val !== null && val !== '')
                .map((val) => (typeof val === 'number' ? val : Number.parseInt(String(val), 10)))
                .filter((num) => !Number.isNaN(num))
              const avg =
                ratingAnswers.length > 0
                  ? (
                      ratingAnswers.reduce((sum, val) => sum + val, 0) / ratingAnswers.length
                    ).toFixed(1)
                  : 'N/A'
              return (
                <div
                  key={q.id}
                  className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm"
                >
                  <span
                    className="text-xs font-semibold text-gray-400 uppercase tracking-wider block truncate"
                    title={q.label}
                  >
                    Avg Rating: {q.label}
                  </span>
                  <span className="text-3xl font-extrabold text-gray-900 block mt-1">
                    {avg} <span className="text-sm font-medium text-gray-400">/ 5.0</span>
                  </span>
                </div>
              )
            })}
        </div>
      )}

      {responses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200 p-12 shadow-sm">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No responses yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Share your survey link to start collecting feedback.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Submitted At
                  </th>
                  {questions.map((q) => (
                    <th
                      key={q.id}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap max-w-xs truncate"
                      title={q.label}
                    >
                      {q.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {responses.map((res) => (
                  <tr key={res.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                      {formatDate(res.submitted_at)}
                    </td>
                    {questions.map((q) => {
                      const answer = res.answers[q.id]
                      const hasAnswer = answer !== undefined && answer !== null && answer !== ''

                      return (
                        <td
                          key={q.id}
                          className="px-6 py-4 text-sm text-gray-900 max-w-xs whitespace-normal break-words"
                          title={hasAnswer ? String(answer) : undefined}
                        >
                          {!hasAnswer ? (
                            <span className="text-gray-400 italic">No answer</span>
                          ) : q.type === 'rating' ? (
                            <span className="text-amber-500 font-mono tracking-wider">
                              {renderStars(answer)}
                            </span>
                          ) : (
                            <span>{answer}</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
