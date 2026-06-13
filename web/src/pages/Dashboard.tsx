// web/src/pages/Dashboard.tsx
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { createSurvey, deleteSurvey, getSurveys } from '../api'
import ErrorMessage from '../components/ErrorMessage'
import Spinner from '../components/Spinner'
import type { Survey } from '../types'

const formatRelativeTime = (timestamp: number) => {
  const diff = Date.now() / 1000 - timestamp
  if (diff < 60) return 'Just now'
  const mins = Math.floor(diff / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export default function Dashboard() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchSurveys = async () => {
    try {
      setLoading(true)
      const data = await getSurveys()
      setSurveys(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch surveys')
    } finally {
      setLoading(false)
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetch surveys on mount
  useEffect(() => {
    fetchSurveys()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    try {
      setSubmitting(true)
      const newSurvey = await createSurvey(newTitle.trim())
      setSurveys((prev) => [newSurvey, ...prev])
      setNewTitle('')
      setIsModalOpen(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create survey')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return
    }

    try {
      await deleteSurvey(id)
      setSurveys((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete survey')
    }
  }

  if (loading) return <Spinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Surveys</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          New Survey
        </button>
      </div>

      {surveys.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300 p-12">
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
              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No surveys yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create your first branded survey and start collecting responses.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setIsModalOpen(true)}
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Survey
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map((survey) => (
            <div
              key={survey.id}
              className="bg-white rounded-lg border border-gray-200 border-l-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              style={{ borderLeftColor: survey.primary_color || '#6366f1' }}
            >
              <div className="p-6">
                <div className="flex justify-between items-start space-x-2">
                  <h2 className="text-lg font-bold text-gray-900 line-clamp-1">{survey.title}</h2>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                      survey.is_published
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    {survey.is_published ? 'Live' : 'Draft'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2 min-h-[40px]">
                  {survey.description || 'No description provided.'}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400">
                  <span>{survey.question_count ?? 0} questions</span>
                  <span>•</span>
                  <span>{survey.response_count ?? 0} responses</span>
                  <span>•</span>
                  <span>Updated {formatRelativeTime(survey.updated_at)}</span>
                  <span>•</span>
                  <span className="font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                    Created {formatDate(survey.created_at)}
                  </span>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-lg flex justify-between items-center">
                <div className="flex space-x-2">
                  <Link
                    to="/surveys/$id"
                    params={{ id: survey.id }}
                    className="inline-flex items-center px-3 py-1.5 border border-indigo-600 text-xs font-medium rounded text-indigo-600 bg-white hover:bg-indigo-50 transition-colors"
                  >
                    Edit Builder
                  </Link>
                  <Link
                    to="/surveys/$id/responses"
                    params={{ id: survey.id }}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    View Responses
                  </Link>
                </div>
                <button
                  onClick={() => handleDelete(survey.id, survey.title)}
                  type="button"
                  className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-gray-100 transition-colors"
                  title="Delete Survey"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-gray-200">
            <form onSubmit={handleCreate}>
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Create New Survey</h3>
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Survey Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
                    placeholder="e.g. SDE Intern Feedback"
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-lg flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
