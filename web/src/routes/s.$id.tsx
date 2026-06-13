// web/src/routes/s.$id.tsx
import { createFileRoute } from '@tanstack/react-router'
import PublicSurvey from '../pages/PublicSurvey'

export const Route = createFileRoute('/s/$id')({
  component: PublicSurvey,
})
