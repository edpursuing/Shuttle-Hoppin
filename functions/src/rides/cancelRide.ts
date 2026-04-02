import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore'
import { sendDM } from '../utils/slack'

export const cancelRide = onCall(async (request) => {
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
  const rideSnap = await rideRef.get()

  if (!rideSnap.exists) {
    throw new HttpsError('not-found', 'Ride not found')
  }

  const ride = rideSnap.data()!

  if (ride.driverId !== uid) {
    throw new HttpsError('permission-denied', 'Only the driver can cancel this ride')
  }
  if (ride.status !== 'open') {
    throw new HttpsError('failed-precondition', 'Ride is already closed')
  }

  const riders: any[] = ride.riders || []
  const now = Timestamp.now()

  const updates: Record<string, any> = {
    status:    'cancelled',
    updatedAt: now,
  }

  // Increment lateCancels only if riders were booked
  if (riders.length > 0) {
    updates['stats.lateCancels'] = FieldValue.increment(1)
  }

  await rideRef.update(updates)

  // Notify booked riders via Slack DM — fire and forget
  if (riders.length > 0) {
    const appUrl  = 'https://pursuit-shuttle.web.app'
    const message = `Your ride from ${ride.driverName} (${ride.stopName} — ` +
      `${new Date(ride.departureTime.toMillis()).toLocaleString('en-US', {
        timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: '2-digit',
      })}) has been cancelled. Check ${appUrl}/board for other rides.`

    await Promise.all(
      riders.map((r: any) =>
        sendDM(r.uid, { text: message }).catch(err =>
          console.error(`Failed to DM rider ${r.uid}:`, err)
        )
      )
    )
  }

  return { success: true }
})
