import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

const VALID_STATUSES = ['pending', 'on-my-way', 'at-pickup', 'running-late'] as const
type DriverStatus = typeof VALID_STATUSES[number]

export const updateDriverStatus = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in')
  }

  const uid    = request.auth.uid
  const rideId = request.data?.rideId as string | undefined
  const status = request.data?.status as string | undefined

  if (!rideId) {
    throw new HttpsError('invalid-argument', 'rideId is required')
  }
  if (!status || !VALID_STATUSES.includes(status as DriverStatus)) {
    throw new HttpsError('invalid-argument', `status must be one of: ${VALID_STATUSES.join(', ')}`)
  }

  const db      = getFirestore()
  const rideRef = db.collection('rides').doc(rideId)
  const rideSnap = await rideRef.get()

  if (!rideSnap.exists) {
    throw new HttpsError('not-found', 'Ride not found')
  }

  const ride = rideSnap.data()!

  if (ride.driverId !== uid) {
    throw new HttpsError('permission-denied', 'Only the driver can update ride status')
  }
  if (ride.status !== 'open') {
    throw new HttpsError('failed-precondition', 'Cannot update status of a closed ride')
  }

  await rideRef.update({
    driverStatus: status,
    updatedAt:    Timestamp.now(),
  })

  return { success: true }
})
