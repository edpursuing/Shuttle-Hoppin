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
