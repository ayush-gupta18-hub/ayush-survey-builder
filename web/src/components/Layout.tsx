// web/src/components/Layout.tsx
import { Link } from '@tanstack/react-router'
import type React from 'react'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-gray-900">
                  DoCoDe<span className="text-indigo-600">Go</span>
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold text-indigo-800 bg-indigo-50 rounded border border-indigo-100">
                  Builder
                </span>
              </Link>
              <nav className="hidden sm:flex space-x-4">
                <Link
                  to="/dashboard"
                  activeProps={{ className: 'border-indigo-500 text-gray-900' }}
                  inactiveProps={{
                    className:
                      'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                  }}
                  className="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors h-16"
                >
                  Dashboard
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-3">
                  <img
                    className="h-8 w-8 rounded-full border border-gray-200"
                    src={user.avatar_url}
                    alt={user.name}
                  />
                  <span className="hidden md:inline text-sm font-medium text-gray-700">
                    {user.name}
                  </span>
                  <button
                    onClick={() => logout()}
                    type="button"
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
