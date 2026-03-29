import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore'

export const bookRide = onCall(async (request) => {
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
  const userRef = db.collection('users').doc(uid)

  return db.runTransaction(async (tx) => {
    const [rideSnap, userSnap] = await Promise.all([tx.get(rideRef), tx.get(userRef)])

    if (!rideSnap.exists) {
      throw new HttpsError('not-found', 'Ride not found')
    }
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'User not found')
    }

    const ride = rideSnap.data()!
    const user = userSnap.data()!

    if (ride.status !== 'open') {
      throw new HttpsError('failed-precondition', 'Ride is no longer available')
    }
    if (ride.driverId === uid) {
      throw new HttpsError('failed-precondition', 'You cannot book your own ride')
    }
    if (ride.availableSeats < 1) {
      throw new HttpsError('failed-precondition', 'No seats available')
    }

    // Check rider is not already booked on this ride
    const riders: any[] = ride.riders || []
    if (riders.some((r: any) => r.uid === uid)) {
      throw new HttpsError('already-exists', 'You are already booked on this ride')
    }

    // No overlapping bookings within 30 minutes
    const departureMs      = ride.departureTime.toMillis()
    const windowMs         = 30 * 60 * 1000
    const activeRidesSnap  = await db.collection('rides')
      .where('status', '==', 'open')
      .get()

    const overlap = activeRidesSnap.docs
      .filter(d => d.id !== rideId)
      .find(d => {
        const r = d.data()
        const isRider  = (r.riders || []).some((x: any) => x.uid === uid)
        const isDriver = r.driverId === uid
        if (!isRider && !isDriver) return false
        const diff = Math.abs(r.departureTime.toMillis() - departureMs)
        return diff < windowMs
      })

    if (overlap) {
      throw new HttpsError('failed-precondition', 'You already have a ride within 30 minutes of this one')
    }

    const rider = {
      uid,
      displayName: user.displayName || '',
      avatarUrl:   user.avatarUrl   || '',
      bookedAt:    Timestamp.now(),
    }

    tx.update(rideRef, {
      riders:         FieldValue.arrayUnion(rider),
      availableSeats: FieldValue.increment(-1),
      updatedAt:      Timestamp.now(),
    })

    return { success: true }
  })
})
