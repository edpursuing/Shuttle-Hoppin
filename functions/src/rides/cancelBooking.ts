import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore'

export const cancelBooking = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in')
  }

  const uid    = request.auth.uid
  const rideId = request.data?.rideId as string | undefined

  if (!rideId) {
    throw new HttpsError('invalid-argument', 'rideId is required')
  }

  const db      = getFirestore()
  const rideRef = db.collection('rides').doc(rideId)

  return db.runTransaction(async (tx) => {
    const rideSnap = await tx.get(rideRef)

    if (!rideSnap.exists) {
      throw new HttpsError('not-found', 'Ride not found')
    }

    const ride    = rideSnap.data()!
    const riders: any[] = ride.riders || []
    const rider   = riders.find((r: any) => r.uid === uid)

    if (!rider) {
      throw new HttpsError('not-found', 'You are not booked on this ride')
    }

    if (ride.status !== 'open') {
      throw new HttpsError('failed-precondition', 'Cannot cancel a ride that is no longer open')
    }

    tx.update(rideRef, {
      riders:         FieldValue.arrayRemove(rider),
      availableSeats: FieldValue.increment(1),
      updatedAt:      Timestamp.now(),
    })

    return { success: true }
  })
})
