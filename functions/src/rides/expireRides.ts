import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore'

export const expireRides = onSchedule('every 15 minutes', async () => {
  const db      = getFirestore()
  const now     = Date.now()
  const cutoff  = Timestamp.fromMillis(now - 60 * 60 * 1000) // 1 hour ago

  const staleSnap = await db.collection('rides')
    .where('status', '==', 'open')
    .where('departureTime', '<', cutoff)
    .get()

  if (staleSnap.empty) return

  const batch     = db.batch()
  const nowStamp  = Timestamp.now()

  for (const doc of staleSnap.docs) {
    const ride   = doc.data()
    const riders: any[] = ride.riders || []

    // Mark ride completed
    batch.update(doc.ref, { status: 'completed', updatedAt: nowStamp })

    // Increment driver's ridesGiven if at least one rider was present
    if (riders.length > 0) {
      batch.update(db.collection('users').doc(ride.driverId), {
        'stats.ridesGiven': FieldValue.increment(1),
        updatedAt:          nowStamp,
      })

      // Increment each rider's ridesTaken
      for (const rider of riders) {
        batch.update(db.collection('users').doc(rider.uid), {
          'stats.ridesTaken': FieldValue.increment(1),
          updatedAt:          nowStamp,
        })
      }
    }
  }

  await batch.commit()
  console.log(`Expired ${staleSnap.size} ride(s), updated stats`)
})
