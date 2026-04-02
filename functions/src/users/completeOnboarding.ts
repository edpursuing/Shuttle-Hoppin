import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

interface OnboardingData {
  defaultStop: string | null
  departureWindow: { start: string; end: string } | null
  hasCar: boolean
  notificationPrefs: {
    slackDMs: boolean
    frequency: 'instant' | 'digest'
  }
}

export const completeOnboarding = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in')
  }

  const uid = request.auth.uid
  const data = request.data as OnboardingData

  if (typeof data.hasCar !== 'boolean') {
    throw new HttpsError('invalid-argument', 'hasCar is required')
  }

  const frequency = data.notificationPrefs?.frequency
  if (frequency && !['instant', 'digest'].includes(frequency)) {
    throw new HttpsError('invalid-argument', 'frequency must be instant or digest')
  }

  const window = data.departureWindow
  const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/
  if (window != null) {
    if (!timeRe.test(window.start) || !timeRe.test(window.end)) {
      throw new HttpsError('invalid-argument', 'Departure window times must be in HH:MM format')
    }
    if (window.start >= window.end) {
      throw new HttpsError('invalid-argument', 'Departure window start must be before end')
    }
  }

  const db  = getFirestore()
  const now = Timestamp.now()

  await db.collection('users').doc(uid).update({
    defaultStop:      data.defaultStop ?? null,
    departureWindow:  data.departureWindow ?? null,
    hasCar:           data.hasCar,
    notificationPrefs: {
      slackDMs:  data.notificationPrefs?.slackDMs ?? true,
      frequency: data.notificationPrefs?.frequency ?? 'instant',
    },
    onboardingComplete: true,
    updatedAt: now,
  })

  return { success: true }
})
