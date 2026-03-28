/**
 * Slack OAuth Callback (HTTP Function)
 *
 * Receives the Slack OAuth redirect, exchanges the code for tokens,
 * verifies Pursuit workspace membership, creates/updates the Firestore
 * user doc, and mints a Firebase custom token for the web app.
 */

import { onRequest } from 'firebase-functions/v2/https'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { WebClient } from '@slack/web-api'

const SLACK_CLIENT_ID     = process.env.SLACK_CLIENT_ID || ''
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET || ''
const SLACK_WORKSPACE_ID  = process.env.SLACK_WORKSPACE_ID || ''
const FRONTEND_URL        = process.env.FRONTEND_URL || 'https://pursuit-shuttle.web.app'
const REDIRECT_URI        = process.env.SLACK_REDIRECT_URI || ''

export const slackOAuthCallback = onRequest(async (req, res) => {
  const { code, error } = req.query as Record<string, string>

  if (error) {
    res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(error)}`)
    return
  }

  if (!code) {
    res.redirect(`${FRONTEND_URL}/login?error=missing_code`)
    return
  }

  try {
    // Exchange auth code for Slack tokens
    const client = new WebClient()
    const oauthResult = await client.oauth.v2.access({
      client_id:     SLACK_CLIENT_ID,
      client_secret: SLACK_CLIENT_SECRET,
      code,
      redirect_uri:  REDIRECT_URI,
    })

    if (!oauthResult.ok) {
      throw new Error(`OAuth failed: ${oauthResult.error}`)
    }

    const team        = oauthResult.team as { id: string; name: string }
    const authedUser  = oauthResult.authed_user as { id: string; access_token?: string }
    const botToken    = oauthResult.access_token as string
    const slackUserId = authedUser.id

    // Verify Pursuit workspace (skip check if env var not set)
    if (SLACK_WORKSPACE_ID && team.id !== SLACK_WORKSPACE_ID) {
      res.redirect(`${FRONTEND_URL}/login?error=wrong_workspace`)
      return
    }

    // Fetch user profile using bot token
    const botClient = new WebClient(botToken)
    const userInfo  = await botClient.users.info({ user: slackUserId })

    if (!userInfo.ok || !userInfo.user) {
      throw new Error('Failed to fetch user profile from Slack')
    }

    const slackUser = userInfo.user
    const profile   = slackUser.profile as Record<string, string>
    const db        = getFirestore()
    const now       = Timestamp.now()

    const userRef  = db.collection('users').doc(slackUserId)
    const userSnap = await userRef.get()

    if (!userSnap.exists) {
      // New user — create with all TDD defaults
      await userRef.set({
        slackId:          slackUserId,
        displayName:      slackUser.real_name || slackUser.name || '',
        avatarUrl:        profile?.image_192 || '',
        email:            profile?.email || '',
        hasCar:           false,
        defaultStop:      null,
        departureWindow:  null,
        notificationPrefs: { slackDMs: true, frequency: 'instant' },
        stats:            { ridesGiven: 0, ridesTaken: 0, lateCancels: 0 },
        onboardingComplete: false,
        createdAt:        now,
        updatedAt:        now,
      })
    } else {
      // Returning user — refresh mutable profile fields
      await userRef.update({
        displayName: slackUser.real_name || slackUser.name || '',
        avatarUrl:   profile?.image_192 || '',
        email:       profile?.email || '',
        updatedAt:   now,
      })
    }

    // Store Slack token in private subcollection
    await userRef.collection('private').doc('settings').set(
      { slackAccessToken: authedUser.access_token || botToken, slackUserId },
      { merge: true }
    )

    // Mint Firebase custom token
    const firebaseToken = await getAuth().createCustomToken(slackUserId)

    // Redirect to frontend auth handler
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${encodeURIComponent(firebaseToken)}`)

  } catch (err: any) {
    console.error('slackOAuthCallback error:', err.message)
    res.redirect(`${FRONTEND_URL}/login?error=auth_failed`)
  }
})
