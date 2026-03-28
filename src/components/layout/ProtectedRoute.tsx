import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

interface Props {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: Props) {
  const { uid, initialized } = useAuthStore()

  // Wait for the initial auth check before rendering or redirecting
  if (!initialized) return null

  if (!uid) return <Navigate to="/login" replace />

  return <>{children}</>
}
