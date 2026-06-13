// web/src/routes/index.tsx
import { createFileRoute, Navigate } from '@tanstack/react-router'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'

export const Route = createFileRoute('/')({
  component: IndexRoute,
})

function IndexRoute() {
  const { user, loading } = useAuth()

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

  return <Navigate to="/login" replace />
}
