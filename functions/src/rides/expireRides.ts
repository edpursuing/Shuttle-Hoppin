import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

export const expireRides = onSchedule('every 15 minutes', async () => {
  const db  = getFirestore()
  const now = Date.now()
  const cutoff = Timestamp.fromMillis(now - 60 * 60 * 1000) // 1 hour ago

  const staleSnap = await db.collection('rides')
    .where('status', '==', 'open')
    .where('departureTime', '<', cutoff)
    .get()

  if (staleSnap.empty) return

  const batch = db.batch()
  staleSnap.docs.forEach(doc => {
    batch.update(doc.ref, {
      status:    'completed',
      updatedAt: Timestamp.now(),
    })
  })

  await batch.commit()
  console.log(`Expired ${staleSnap.size} ride(s)`)
})
