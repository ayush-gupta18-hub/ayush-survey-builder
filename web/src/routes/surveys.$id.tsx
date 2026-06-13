// web/src/routes/surveys.$id.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/surveys/$id')({
  component: () => <Outlet />,
})
