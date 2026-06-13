// web/src/pages/SurveyBuilder.tsx
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useParams } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import {
  createQuestion,
  deleteQuestion,
  getSurvey,
  reorderQuestions,
  updateQuestion,
  updateSurvey,
} from '../api'
import ErrorMessage from '../components/ErrorMessage'
import Spinner from '../components/Spinner'
import type { Question, QuestionType, Survey } from '../types'

// Drag-and-drop sortable item wrapper
interface SortableQuestionItemProps {
  question: Question
  isExpanded: boolean
  onExpandToggle: () => void
  onUpdateQuestion: (qid: string, patch: Partial<Question>) => Promise<void>
  onDeleteQuestion: (qid: string) => Promise<void>
}

function SortableQuestionItem({
  question,
  isExpanded,
  onExpandToggle,
  onUpdateQuestion,
  onDeleteQuestion,
}: SortableQuestionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  const badgeColor =
    question.type === 'short_text'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : question.type === 'multiple_choice'
        ? 'bg-purple-50 text-purple-700 border-purple-200'
        : 'bg-amber-50 text-amber-700 border-amber-200'

  const typeLabel =
    question.type === 'short_text'
      ? 'Short Text'
      : question.type === 'multiple_choice'
        ? 'Multiple Choice'
        : '1–5 Rating'

  // Options management for multiple choice
  const [localOptions, setLocalOptions] = useState<string[]>(question.options)

  useEffect(() => {
    setLocalOptions(question.options)
  }, [question.options])

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...localOptions]
    updated[idx] = val
    setLocalOptions(updated)
  }

  const handleOptionBlur = () => {
    onUpdateQuestion(question.id, { options: localOptions.filter((o) => o.trim() !== '') })
  }

  const handleAddOption = () => {
    const updated = [...localOptions, `Option ${localOptions.length + 1}`]
    setLocalOptions(updated)
    onUpdateQuestion(question.id, { options: updated })
  }

  const handleRemoveOption = (idx: number) => {
    const updated = localOptions.filter((_, i) => i !== idx)
    setLocalOptions(updated)
    onUpdateQuestion(question.id, { options: updated })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border transition-all ${
        isExpanded
          ? 'border-indigo-400 ring-1 ring-indigo-400 shadow-md'
          : 'border-gray-200 shadow-sm hover:border-gray-300'
      }`}
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            type="button"
            className="text-gray-400 hover:text-gray-600 p-1 cursor-grab active:cursor-grabbing focus:outline-none"
            title="Drag to reorder"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8h16M4 16h16"
              />
            </svg>
          </button>

          {/* Type badge */}
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}
          >
            {typeLabel}
          </span>

          {/* Label */}
          <span
            onClick={onExpandToggle}
            className="text-sm font-semibold text-gray-900 truncate flex-1 cursor-pointer hover:text-indigo-600 select-none"
          >
            {question.label || <span className="text-gray-400 italic">Untitled Question</span>}
          </span>

          {question.required && (
            <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded border border-red-100 select-none">
              Required
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onExpandToggle}
            type="button"
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg
              className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <button
            onClick={() => onDeleteQuestion(question.id)}
            type="button"
            className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            title="Delete Question"
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

      {/* Expanded form */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50/50 rounded-b-lg space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Question Prompt / Label
            </label>
            <input
              type="text"
              value={question.label}
              onChange={(e) => onUpdateQuestion(question.id, { label: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
              placeholder="e.g. Rate your overall experience"
            />
          </div>

          {question.type === 'multiple_choice' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Options
              </label>
              <div className="space-y-2">
                {localOptions.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(oIdx, e.target.value)}
                      onBlur={handleOptionBlur}
                      className="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
                      placeholder={`Option ${oIdx + 1}`}
                    />
                    <button
                      onClick={() => handleRemoveOption(oIdx)}
                      disabled={localOptions.length <= 1}
                      type="button"
                      className="text-gray-400 hover:text-red-500 p-1.5 disabled:opacity-30"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddOption}
                type="button"
                className="mt-2 inline-flex items-center px-3 py-1.5 border border-indigo-600 text-xs font-medium rounded text-indigo-600 bg-white hover:bg-indigo-50 transition-colors"
              >
                + Add Option
              </button>
            </div>
          )}

          {question.type === 'rating' && (
            <p className="text-xs text-gray-400 bg-indigo-50/50 p-2.5 rounded border border-indigo-100">
              Rating scale is locked to a <strong>1–5 stars</strong> system for visual simplicity
              and high-UX consistency.
            </p>
          )}

          <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
            <input
              type="checkbox"
              id={`req-${question.id}`}
              checked={question.required}
              onChange={(e) => onUpdateQuestion(question.id, { required: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor={`req-${question.id}`} className="text-sm font-medium text-gray-700">
              Require respondents to answer this question
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SurveyBuilder() {
  const { id } = useParams({ from: '/surveys/$id' })
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Save indicator
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder')
  const [previewScreen, setPreviewScreen] = useState<'form' | 'thanks'>('form')
  const [logoError, setLogoError] = useState(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset logoError state when logo_url changes
  useEffect(() => {
    setLogoError(false)
  }, [survey?.logo_url])

  // Question builder UI states
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newType, setNewType] = useState<QuestionType>('short_text')
  const [newLabel, setNewLabel] = useState('')
  const [newRequired, setNewRequired] = useState(false)
  const [newOptions, setNewOptions] = useState<string[]>(['Option 1', 'Option 2'])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  useEffect(() => {
    const fetchSurveyData = async () => {
      try {
        setLoading(true)
        const data = await getSurvey(id)
        setSurvey(data)
        setQuestions(data.questions || [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch survey')
      } finally {
        setLoading(false)
      }
    }

    fetchSurveyData()
  }, [id])

  const triggerAutoSave = (updatedFields: Partial<Survey>) => {
    if (!survey) return

    // Update local state immediately for visual responsiveness
    setSurvey((prev) => (prev ? { ...prev, ...updatedFields } : null))
    setSaveStatus('saving')

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateSurvey(id, updatedFields)
        setSaveStatus('saved')
        setTimeout(() => {
          setSaveStatus('idle')
        }, 2000)
      } catch (err) {
        console.error('Auto-save failed:', err)
        setSaveStatus('idle')
      }
    }, 800)
  }

  const handleTogglePublished = async () => {
    if (!survey) return
    const nextPublished = !survey.is_published
    try {
      setSurvey((prev) => (prev ? { ...prev, is_published: nextPublished } : null))
      setSaveStatus('saving')
      await updateSurvey(id, { is_published: nextPublished })
      setSaveStatus('saved')
      setTimeout(() => {
        setSaveStatus('idle')
      }, 2000)
    } catch {
      alert('Failed to update published state')
      setSurvey((prev) => (prev ? { ...prev, is_published: !nextPublished } : null))
      setSaveStatus('idle')
    }
  }

  // Question CRUD handlers
  const handleUpdateQuestion = async (qid: string, patch: Partial<Question>) => {
    // Update local state immediately
    setQuestions((prev) => prev.map((q) => (q.id === qid ? { ...q, ...patch } : q)))

    try {
      await updateQuestion(id, qid, patch)
    } catch (err) {
      console.error('Failed to update question:', err)
    }
  }

  const handleDeleteQuestion = async (qid: string) => {
    try {
      await deleteQuestion(id, qid)
      setQuestions((prev) => prev.filter((q) => q.id !== qid))
      if (expandedQuestionId === qid) setExpandedQuestionId(null)
    } catch {
      alert('Failed to delete question')
    }
  }

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLabel.trim()) return

    try {
      const payload = {
        type: newType,
        label: newLabel.trim(),
        required: newRequired,
        position: questions.length,
        options: newType === 'multiple_choice' ? newOptions.filter((o) => o.trim() !== '') : [],
      }

      const q = await createQuestion(id, payload)
      setQuestions((prev) => [...prev, q])

      // Reset states
      setNewLabel('')
      setNewRequired(false)
      setNewOptions(['Option 1', 'Option 2'])
      setShowAddForm(false)
    } catch {
      alert('Failed to add question')
    }
  }

  const handleAddOptionRow = () => {
    setNewOptions((prev) => [...prev, `Option ${prev.length + 1}`])
  }

  const handleRemoveOptionRow = (idx: number) => {
    setNewOptions((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleOptionRowChange = (idx: number, val: string) => {
    setNewOptions((prev) => {
      const updated = [...prev]
      updated[idx] = val
      return updated
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = questions.findIndex((q) => q.id === active.id)
    const newIndex = questions.findIndex((q) => q.id === over.id)

    const reordered = arrayMove(questions, oldIndex, newIndex)
    setQuestions(reordered)

    try {
      const orderedIds = reordered.map((q) => q.id)
      await reorderQuestions(id, orderedIds)
    } catch {
      alert('Failed to save question order')
    }
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/s/${id}`
    navigator.clipboard.writeText(url)
    alert('Public survey URL copied to clipboard!')
  }

  if (loading) return <Spinner />
  if (error || !survey) return <ErrorMessage message={error || 'Survey not found'} />

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Left panel - builder & preview */}
      <div className="lg:col-span-2 space-y-6">
        {/* Tab switcher */}
        <div className="bg-gray-100 p-1 rounded-lg flex space-x-1 border border-gray-200">
          <button
            onClick={() => setActiveTab('builder')}
            type="button"
            className={`flex-1 py-2 px-4 text-sm font-semibold rounded-md select-none transition-all ${
              activeTab === 'builder'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'
            }`}
          >
            Questions Builder
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            type="button"
            className={`flex-1 py-2 px-4 text-sm font-semibold rounded-md select-none transition-all ${
              activeTab === 'preview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'
            }`}
          >
            Live Branded Preview
          </button>
        </div>

        {activeTab === 'preview' ? (
          <div
            className="bg-white rounded-xl border border-gray-200 shadow-md p-8 space-y-8 transition-all relative font-sans pt-16"
            style={{ '--brand': survey.primary_color || '#6366f1' } as React.CSSProperties}
          >
            {/* Preview screen toggle */}
            <div className="absolute top-4 right-4 flex space-x-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
              <button
                onClick={() => setPreviewScreen('form')}
                type="button"
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  previewScreen === 'form'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Welcome/Form
              </button>
              <button
                onClick={() => setPreviewScreen('thanks')}
                type="button"
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  previewScreen === 'thanks'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Thank You
              </button>
            </div>

            {previewScreen === 'thanks' ? (
              <div className="py-12 flex flex-col justify-center items-center text-center space-y-6">
                {survey.logo_url && !logoError ? (
                  <div className="flex justify-center">
                    <img
                      key={survey.logo_url}
                      src={survey.logo_url}
                      alt="Brand logo"
                      className="max-h-12 object-contain"
                      onError={() => setLogoError(true)}
                    />
                  </div>
                ) : null}
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    Thank you!
                  </h1>
                  <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
                    {survey.thank_you_message || 'Thank you for your feedback!'}
                  </p>
                </div>
                <div className="pt-4 flex justify-center">
                  <div className="w-16 h-1.5 rounded-full bg-brand" />
                </div>
              </div>
            ) : (
              <>
                {/* Header / Branding */}
                <div className="space-y-4 pb-6 border-b border-gray-100">
                  {survey.logo_url && !logoError ? (
                    <div className="flex justify-start">
                      <img
                        key={survey.logo_url}
                        src={survey.logo_url}
                        alt="Brand logo preview"
                        className="max-h-12 object-contain"
                        onError={() => setLogoError(true)}
                      />
                    </div>
                  ) : null}
                  <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                      {survey.title || (
                        <span className="text-gray-400 italic">Untitled Survey</span>
                      )}
                    </h1>
                    {(survey.welcome_message || survey.description) && (
                      <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
                        {survey.welcome_message || survey.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Questions list */}
                {questions.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <span className="text-lg font-semibold block text-gray-700">
                      ✨ Your questions will appear here
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      Add questions in the Questions Builder tab to see them in this preview.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="space-y-4 p-6 rounded-xl border border-gray-100 bg-gray-50/30 transition-all hover:bg-gray-50/50"
                      >
                        <label className="block text-base font-semibold text-gray-900 select-none">
                          <span className="text-gray-400 mr-2">{idx + 1}.</span>
                          {q.label || (
                            <span className="italic text-gray-400">Untitled Question</span>
                          )}
                          {q.required && <span className="text-red-500 ml-1">*</span>}
                        </label>

                        {/* Short text preview */}
                        {q.type === 'short_text' && (
                          <input
                            type="text"
                            disabled
                            placeholder="Respondent will type here..."
                            className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-3 border bg-white cursor-not-allowed"
                          />
                        )}

                        {/* Multiple choice preview */}
                        {q.type === 'multiple_choice' && (
                          <div className="space-y-2.5">
                            {q.options.length === 0 ? (
                              <p className="text-xs text-gray-400 italic">No options defined yet</p>
                            ) : (
                              q.options.map((opt, oIdx) => (
                                <div
                                  key={oIdx}
                                  className="flex items-center p-3.5 border border-gray-200 rounded-lg bg-white cursor-not-allowed hover:bg-gray-50/50 transition-all"
                                >
                                  <input
                                    type="radio"
                                    disabled
                                    className="h-4 w-4 text-brand focus:ring-0 cursor-not-allowed"
                                  />
                                  <span className="ml-3 text-sm font-medium text-gray-700 select-none">
                                    {opt}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {/* Rating preview */}
                        {q.type === 'rating' && (
                          <div className="flex justify-between max-w-sm mx-auto pt-2">
                            {[1, 2, 3, 4, 5].map((val) => (
                              <button
                                key={val}
                                type="button"
                                disabled
                                className="h-12 w-12 rounded-lg border border-gray-300 text-sm font-bold flex items-center justify-center bg-white text-gray-600 cursor-not-allowed hover:bg-gray-50 transition-all"
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Submit button preview */}
                    <div className="pt-4">
                      <button
                        type="button"
                        disabled
                        className="w-full flex items-center justify-center px-4 py-3.5 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-brand opacity-80 cursor-not-allowed"
                      >
                        Submit Response (Demo)
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Questions</h2>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  type="button"
                  className="inline-flex items-center px-3.5 py-2 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                >
                  + Add Question
                </button>
              )}
            </div>

            {/* Add question form */}
            {showAddForm && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 space-y-4">
                <h3 className="text-sm font-bold text-gray-900">Choose Question Type</h3>

                {/* Type cards */}
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      { type: 'short_text', label: 'Short Text', icon: '📝' },
                      { type: 'multiple_choice', label: 'Choice', icon: '🔘' },
                      { type: 'rating', label: '1–5 Rating', icon: '⭐' },
                    ] as const
                  ).map((c) => (
                    <button
                      key={c.type}
                      type="button"
                      onClick={() => setNewType(c.type)}
                      className={`flex flex-col items-center justify-center py-4 px-2 bg-white rounded-lg border-2 transition-all ${
                        newType === c.type
                          ? 'border-indigo-600 bg-indigo-50/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl mb-1">{c.icon}</span>
                      <span className="text-xs font-semibold text-gray-800">{c.label}</span>
                    </button>
                  ))}
                </div>

                <form onSubmit={handleAddQuestion} className="space-y-4 pt-2">
                  <div>
                    <label
                      htmlFor="label"
                      className="block text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >
                      Question Text
                    </label>
                    <input
                      type="text"
                      id="label"
                      required
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
                      placeholder="e.g. What is your email?"
                    />
                  </div>

                  {newType === 'multiple_choice' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Options
                      </label>
                      <div className="space-y-2">
                        {newOptions.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center space-x-2">
                            <input
                              type="text"
                              required
                              value={opt}
                              onChange={(e) => handleOptionRowChange(oIdx, e.target.value)}
                              className="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
                              placeholder={`Option ${oIdx + 1}`}
                            />
                            <button
                              onClick={() => handleRemoveOptionRow(oIdx)}
                              disabled={newOptions.length <= 1}
                              type="button"
                              className="text-gray-400 hover:text-red-500 p-1.5 disabled:opacity-30"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={handleAddOptionRow}
                        type="button"
                        className="mt-2 inline-flex items-center px-3 py-1.5 border border-indigo-600 text-xs font-medium rounded text-indigo-600 bg-white hover:bg-indigo-50 transition-colors"
                      >
                        + Add Option
                      </button>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="newRequired"
                      checked={newRequired}
                      onChange={(e) => setNewRequired(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="newRequired" className="text-sm font-medium text-gray-700">
                      Require answer
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-2 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Add
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Question sorting area */}
            {questions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg p-6 bg-gray-50/50">
                <p className="text-sm text-gray-500">No questions in this survey yet.</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  type="button"
                  className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-semibold rounded text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                >
                  + Add your first question
                </button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={questions.map((q) => q.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {questions.map((question) => (
                      <SortableQuestionItem
                        key={question.id}
                        question={question}
                        isExpanded={expandedQuestionId === question.id}
                        onExpandToggle={() =>
                          setExpandedQuestionId(
                            expandedQuestionId === question.id ? null : question.id,
                          )
                        }
                        onUpdateQuestion={handleUpdateQuestion}
                        onDeleteQuestion={handleDeleteQuestion}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        )}
      </div>

      {/* Right panel - brand & settings */}
      <div className="space-y-6 lg:sticky lg:top-24">
        {/* Save indicator & Published toggle */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Publishing</h2>
            {saveStatus === 'saving' && (
              <span className="text-xs text-indigo-600 font-semibold animate-pulse">Saving...</span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-xs text-emerald-600 font-bold flex items-center">
                <svg
                  className="w-4 h-4 mr-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Saved
              </span>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <span className="block text-sm font-semibold text-gray-900">
                {survey.is_published ? 'Live & Sharing' : 'Draft Mode'}
              </span>
              <span className="block text-xs text-gray-500 mt-0.5">
                {survey.is_published
                  ? 'Anyone with the link can respond'
                  : 'Only you can view and edit this'}
              </span>
            </div>
            {/* Toggle switch */}
            <button
              onClick={handleTogglePublished}
              type="button"
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                survey.is_published ? 'bg-emerald-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  survey.is_published ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {survey.is_published && (
            <div className="space-y-2">
              <label
                htmlFor="pub-url"
                className="block text-xs font-bold text-gray-500 uppercase tracking-wider"
              >
                Public URL
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  id="pub-url"
                  readOnly
                  value={`${window.location.origin}/s/${survey.id}`}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:outline-none sm:text-xs p-2 border bg-gray-50 text-gray-500"
                />
                <button
                  onClick={handleCopyLink}
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-indigo-600 text-xs font-semibold rounded text-indigo-600 bg-white hover:bg-indigo-50 transition-colors"
                >
                  Copy
                </button>
                <a
                  href={`/s/${survey.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-semibold rounded text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Open
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Survey Settings */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
            Settings
          </h2>

          <div>
            <label
              htmlFor="surv-title"
              className="block text-xs font-bold text-gray-500 uppercase tracking-wider"
            >
              Survey Title
            </label>
            <input
              type="text"
              id="surv-title"
              value={survey.title}
              onChange={(e) => triggerAutoSave({ title: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              placeholder="e.g. Product Survey"
            />
          </div>

          <div>
            <label
              htmlFor="surv-desc"
              className="block text-xs font-bold text-gray-500 uppercase tracking-wider"
            >
              Description
            </label>
            <textarea
              id="surv-desc"
              rows={3}
              value={survey.description}
              onChange={(e) => triggerAutoSave({ description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              placeholder="Tell respondents what this is about..."
            />
          </div>

          <div>
            <label
              htmlFor="surv-welcome"
              className="block text-xs font-bold text-gray-500 uppercase tracking-wider"
            >
              Welcome Message
            </label>
            <textarea
              id="surv-welcome"
              rows={2}
              value={survey.welcome_message || ''}
              onChange={(e) => triggerAutoSave({ welcome_message: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              placeholder="e.g. We appreciate your time..."
            />
          </div>

          <div>
            <label
              htmlFor="surv-thankyou"
              className="block text-xs font-bold text-gray-500 uppercase tracking-wider"
            >
              Thank You Message
            </label>
            <textarea
              id="surv-thankyou"
              rows={2}
              value={survey.thank_you_message || ''}
              onChange={(e) => triggerAutoSave({ thank_you_message: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              placeholder="e.g. Thank you for your feedback!"
            />
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
            Branding
          </h2>

          <div>
            <label
              htmlFor="primary-color"
              className="block text-xs font-bold text-gray-500 uppercase tracking-wider"
            >
              Primary Brand Color
            </label>
            <div className="flex items-center space-x-3 mt-1">
              <input
                type="color"
                id="primary-color"
                value={survey.primary_color || '#6366f1'}
                onChange={(e) => triggerAutoSave({ primary_color: e.target.value })}
                className="h-10 w-10 rounded-md border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={survey.primary_color || '#6366f1'}
                onChange={(e) => triggerAutoSave({ primary_color: e.target.value })}
                className="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                placeholder="#6366f1"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="logo-url"
              className="block text-xs font-bold text-gray-500 uppercase tracking-wider"
            >
              Brand Logo URL
            </label>
            <input
              type="text"
              id="logo-url"
              value={survey.logo_url || ''}
              onChange={(e) => triggerAutoSave({ logo_url: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              placeholder="https://example.com/logo.png"
            />
            <p className="mt-1 text-xs text-gray-500">
              Must be a direct image link (e.g. ending in .png, .jpg, .svg).
            </p>
            {survey.logo_url && !logoError && (
              <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200 flex justify-center items-center">
                <img
                  key={survey.logo_url}
                  src={survey.logo_url}
                  alt="Logo Preview"
                  className="max-h-12 object-contain"
                  onError={() => setLogoError(true)}
                />
              </div>
            )}
            {survey.logo_url && logoError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-600">
                <div className="font-semibold flex items-center gap-1.5">
                  <svg
                    className="h-4 w-4 text-red-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  Invalid Image URL
                </div>
                <p className="mt-1 text-red-500 leading-normal">
                  The URL you entered could not be loaded as an image. Please ensure it is a direct
                  link to an image file (like a URL ending in{' '}
                  <code className="bg-red-100 px-1 rounded font-mono">.png</code>,{' '}
                  <code className="bg-red-100 px-1 rounded font-mono">.jpg</code>, or{' '}
                  <code className="bg-red-100 px-1 rounded font-mono">.svg</code>) rather than a
                  webpage URL.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
