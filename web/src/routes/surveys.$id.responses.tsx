// web/src/routes/surveys.$id.responses.tsx
import { createFileRoute } from '@tanstack/react-router'
import Layout from '../components/Layout'
import ProtectedRoute from '../components/ProtectedRoute'
import Responses from '../pages/Responses'

export const Route = createFileRoute('/surveys/$id/responses')({
  component: ResponsesRoute,
})

function ResponsesRoute() {
  return (
    <ProtectedRoute>
      <Layout>
        <Responses />
      </Layout>
    </ProtectedRoute>
  )
}
