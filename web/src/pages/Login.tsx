// web/src/pages/Login.tsx
import { Navigate } from '@tanstack/react-router'
import { useState } from 'react'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, loading } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSignInClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isSigningIn) {
      e.preventDefault()
      return
    }
    setIsSigningIn(true)
  }

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{
        background: 'radial-gradient(circle at top, rgba(99, 102, 241, 0.08), transparent 40%)',
      }}
    >
      {/* 3. Premium logo area */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <h1 className="text-4.5xl font-black text-gray-900 tracking-tight select-none">
          DoCoDe<span className="text-indigo-600">Go</span>
        </h1>
        <h2 className="mt-1 text-xl font-bold text-gray-700 select-none">Branded Survey Builder</h2>
        <p className="mt-3 text-sm text-gray-500 max-w-xs sm:max-w-md mx-auto select-none">
          Create surveys that look like your brand.
          <br />
          Share them instantly.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-md sm:rounded-xl sm:px-10 border border-gray-200">
          <div className="space-y-6">
            {/* 1. Subtle card heading */}
            <div className="text-center pb-2 select-none">
              <h3 className="text-lg font-bold text-gray-900">Welcome back</h3>
              <p className="text-xs text-gray-500 mt-1">
                Sign in to create and manage branded surveys.
              </p>
            </div>

            {/* 2. Loading state */}
            <a
              href="/api/auth/github"
              onClick={handleSignInClick}
              className={`w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-950 transition-all cursor-pointer ${
                isSigningIn ? 'opacity-70 cursor-not-allowed pointer-events-none' : ''
              }`}
            >
              {isSigningIn ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-label="Loading"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing you in...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                    />
                  </svg>
                  Sign in with GitHub
                </>
              )}
            </a>
          </div>
        </div>
      </div>

      {/* 4. Tiny feature preview section */}
      <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 text-sm font-semibold text-gray-500 select-none">
        <div className="flex items-center">
          <span className="text-emerald-500 mr-1.5">✓</span>
          Custom branding
        </div>
        <div className="flex items-center">
          <span className="text-emerald-500 mr-1.5">✓</span>
          Public survey links
        </div>
        <div className="flex items-center">
          <span className="text-emerald-500 mr-1.5">✓</span>
          Real-time responses
        </div>
      </div>
    </div>
  )
}
