// web/src/routes/surveys.$id.index.tsx
import { createFileRoute } from '@tanstack/react-router'
import Layout from '../components/Layout'
import ProtectedRoute from '../components/ProtectedRoute'
import SurveyBuilder from '../pages/SurveyBuilder'

export const Route = createFileRoute('/surveys/$id/')({
  component: SurveyBuilderRoute,
})

function SurveyBuilderRoute() {
  return (
    <ProtectedRoute>
      <Layout>
        <SurveyBuilder />
      </Layout>
    </ProtectedRoute>
  )
}
