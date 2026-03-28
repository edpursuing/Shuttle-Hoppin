import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

interface Props {
  children: React.ReactNode
}

export function OnboardingGuard({ children }: Props) {
  const { user, loading } = useAuthStore()

  if (loading) return null

  if (user && !user.onboardingComplete) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
