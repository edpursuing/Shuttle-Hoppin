import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { sendRideNotification } from '../notifications/sendRideNotification'

interface OfferRideData {
  direction: 'to-hq' | 'from-hq'
  stopId: string
  stopName: string
  customLocation: string | null
  passingThrough: string | null
  departureTime: string   // ISO 8601 string from client
  mode: 'now' | 'later'
  totalSeats: number
}

export const offerRide = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in')
  }

  const uid  = request.auth.uid
  const data = request.data as OfferRideData

  // Validate required fields
  if (!data.direction || !['to-hq', 'from-hq'].includes(data.direction)) {
    throw new HttpsError('invalid-argument', 'Invalid direction')
  }
  if (!data.stopId || !data.stopName) {
    throw new HttpsError('invalid-argument', 'Stop is required')
  }
  if (!data.departureTime) {
    throw new HttpsError('invalid-argument', 'Departure time is required')
  }
  if (!data.totalSeats || data.totalSeats < 1 || data.totalSeats > 8) {
    throw new HttpsError('invalid-argument', 'Seats must be between 1 and 8')
  }

  const db = getFirestore()

  // Validate driver has a car
  const userSnap = await db.collection('users').doc(uid).get()
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'User not found')
  }
  const userData = userSnap.data()!
  if (!userData.hasCar) {
    throw new HttpsError('permission-denied', 'Only drivers can offer rides')
  }

  const now           = Timestamp.now()
  const departureTime = Timestamp.fromDate(new Date(data.departureTime))

  const rideRef = db.collection('rides').doc()
  await rideRef.set({
    driverId:        uid,
    driverName:      userData.displayName || '',
    driverAvatar:    userData.avatarUrl   || '',
    direction:       data.direction,
    stopId:          data.stopId,
    stopName:        data.stopName,
    customLocation:  data.customLocation  || null,
    passingThrough:  data.passingThrough  || null,
    departureTime,
    mode:            data.mode || 'later',
    totalSeats:      data.totalSeats,
    availableSeats:  data.totalSeats,
    status:          'open',
    driverStatus:    'pending',
    riders:          [],
    createdAt:       now,
    updatedAt:       now,
  })

  // Fire-and-forget — notification failure should not fail the ride creation
  sendRideNotification({
    rideId:        rideRef.id,
    driverId:      uid,
    driverName:    userData.displayName || '',
    direction:     data.direction,
    stopId:        data.stopId,
    stopName:      data.stopName,
    customLocation: data.customLocation || null,
    departureTime,
    totalSeats:    data.totalSeats,
  }).catch(err => console.error('sendRideNotification error:', err))

  return { rideId: rideRef.id }
})
