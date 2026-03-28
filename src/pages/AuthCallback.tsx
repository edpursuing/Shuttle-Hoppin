import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithCustomToken } from 'firebase/auth'
import { auth } from '../utils/firebase'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token  = params.get('token')
    const error  = params.get('error')

    if (error) {
      navigate(`/login?error=${error}`, { replace: true })
      return
    }

    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    signInWithCustomToken(auth, token)
      .then(() => navigate('/board', { replace: true }))
      .catch(() => navigate('/login?error=auth_failed', { replace: true }))
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p style={{ fontSize: '14px', color: '#888' }}>Signing you in…</p>
    </div>
  )
}
