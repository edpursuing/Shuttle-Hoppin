import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { useAuthStore } from './stores/authStore'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { OnboardingGuard } from './components/layout/OnboardingGuard'

import { LoginPage } from './pages/LoginPage'
import { AuthCallback } from './pages/AuthCallback'
import { OnboardingFlow } from './pages/OnboardingFlow'
import { RideBoard } from './pages/RideBoard'
import { RideDetail } from './pages/RideDetail'
import { MyRides } from './pages/MyRides'
import { AlertsPage } from './pages/AlertsPage'
import { OfferRide } from './pages/OfferRide'
import { ProfilePage } from './pages/ProfilePage'

function RootRedirect() {
  const { uid, initialized } = useAuthStore()
  if (!initialized) return null
  return <Navigate to={uid ? '/board' : '/login'} replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"         element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Onboarding — protected but no OnboardingGuard (user needs to land here) */}
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <OnboardingFlow />
          </ProtectedRoute>
        } />

        {/* App routes — protected + onboarding must be complete */}
        <Route path="/board" element={
          <ProtectedRoute>
            <OnboardingGuard>
              <RideBoard />
            </OnboardingGuard>
          </ProtectedRoute>
        } />

        <Route path="/my-rides" element={
          <ProtectedRoute>
            <OnboardingGuard>
              <MyRides />
            </OnboardingGuard>
          </ProtectedRoute>
        } />

        <Route path="/ride/:rideId" element={
          <ProtectedRoute>
            <OnboardingGuard>
              <RideDetail />
            </OnboardingGuard>
          </ProtectedRoute>
        } />

        <Route path="/alerts" element={
          <ProtectedRoute>
            <OnboardingGuard>
              <AlertsPage />
            </OnboardingGuard>
          </ProtectedRoute>
        } />

        <Route path="/offer" element={
          <ProtectedRoute>
            <OnboardingGuard>
              <OfferRide />
            </OnboardingGuard>
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <OnboardingGuard>
              <ProfilePage />
            </OnboardingGuard>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
