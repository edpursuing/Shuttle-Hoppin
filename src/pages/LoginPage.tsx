import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const SLACK_OAUTH_URL = [
  'https://slack.com/oauth/v2/authorize',
  `?client_id=${import.meta.env.VITE_SLACK_CLIENT_ID}`,
  `&scope=chat:write,im:write,users:read,users:read.email`,
  `&user_scope=identity.basic`,
  `&redirect_uri=${encodeURIComponent(import.meta.env.VITE_SLACK_REDIRECT_URI)}`,
].join('')

const ERROR_MESSAGES: Record<string, string> = {
  wrong_workspace: 'This app is only available to Pursuit workspace members.',
  auth_failed:     'Sign-in failed. Please try again.',
  missing_code:    'Something went wrong with the Slack redirect. Please try again.',
  access_denied:   'Access was denied. Please try again.',
}

export function LoginPage() {
  const { uid, initialized } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const error = searchParams.get('error')

  // Redirect already-authenticated users to the board
  useEffect(() => {
    if (initialized && uid) navigate('/board', { replace: true })
  }, [initialized, uid, navigate])

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: '#242424' }}>
      {/* Main content — vertically and horizontally centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">

        {/* App icon */}
        <div className="mb-3">
          <div
            className="w-16 h-16 flex items-center justify-center"
            style={{ background: '#1a1a1a', borderRadius: '16px' }}
          >
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: '#6E3A90' }} />
              <div className="w-2 h-2 rounded-full" style={{ background: '#0039A6' }} />
              <div className="w-2 h-2 rounded-full" style={{ background: '#FF6319' }} />
              <div className="w-2 h-2 rounded-full" style={{ background: '#FCCC0A' }} />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: '28px', fontWeight: 500, color: '#fff', marginBottom: '8px' }}>
          Hoppin'
        </h1>

        {/* Tagline */}
        <p
          className="text-center"
          style={{ fontSize: '14px', color: '#888', lineHeight: 1.5, marginBottom: '40px' }}
        >
          Ride-sharing for Pursuit fellows.<br />
          Get to your train, together.
        </p>

        {/* Error message */}
        {error && (
          <div
            className="w-full text-center mb-4 px-4 py-3 rounded-lg"
            style={{ background: '#fff3cd', color: '#856404', fontSize: '13px' }}
          >
            {ERROR_MESSAGES[error] ?? 'Something went wrong. Please try again.'}
          </div>
        )}

        {/* Sign in with Slack button */}
        <a
          href={SLACK_OAUTH_URL}
          className="w-full flex items-center justify-center gap-2 no-underline"
          style={{
            padding: '14px',
            borderRadius: '8px',
            background: '#4A154B',
            marginBottom: '16px',
          }}
        >
          {/* Slack logo */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
          </svg>
          <span style={{ fontSize: '15px', fontWeight: 500, color: '#fff' }}>
            Sign in with Slack
          </span>
        </a>

        {/* Workspace note */}
        <p style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>
          Requires a Pursuit Slack workspace account
        </p>
      </div>

      {/* MTA color dots — bottom decoration */}
      <div className="flex justify-center gap-1.5 py-5">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#6E3A90' }} />
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#0039A6' }} />
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#FF6319' }} />
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#6CBE45' }} />
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#FCCC0A' }} />
      </div>
    </div>
  )
}
