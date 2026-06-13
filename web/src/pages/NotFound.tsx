// web/src/pages/NotFound.tsx
import { Link } from '@tanstack/react-router'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6">
      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full shadow-sm text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-gray-900">404</h1>
        <p className="text-sm text-gray-500">The page you are looking for does not exist.</p>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
