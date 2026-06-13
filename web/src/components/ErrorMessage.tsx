// web/src/components/ErrorMessage.tsx
export default function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="max-w-md mx-auto my-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow-sm flex items-start space-x-3">
      <svg
        className="w-5 h-5 flex-shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <div>
        <h3 className="font-semibold text-sm">Error</h3>
        <p className="text-xs text-red-600 mt-0.5">{message}</p>
      </div>
    </div>
  )
}
