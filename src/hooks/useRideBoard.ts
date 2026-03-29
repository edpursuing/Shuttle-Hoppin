import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../utils/firebase'
import type { Ride, Direction } from '../utils/types'

const LEAVING_SOON_MS = 30 * 60 * 1000 // 30 minutes

export function useRideBoard(direction: Direction, stopFilter?: string | null) {
  const [rides, setRides]     = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const constraints: any[] = [
      where('status', '==', 'open'),
      where('direction', '==', direction),
    ]
    if (stopFilter) constraints.push(where('stopId', '==', stopFilter))

    const q = query(collection(db, 'rides'), ...constraints)

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ride))
        // Sort client-side — avoids composite index requirement
        all.sort((a, b) => a.departureTime.seconds - b.departureTime.seconds)
        setRides(all)
        setLoading(false)
      },
      () => setLoading(false)
    )

    return () => unsubscribe()
  }, [direction, stopFilter])

  const now = Date.now()
  const leavingSoon = rides.filter(r => r.departureTime.toMillis() <= now + LEAVING_SOON_MS)
  const scheduled   = rides.filter(r => r.departureTime.toMillis()  > now + LEAVING_SOON_MS)

  return { rides, leavingSoon, scheduled, loading }
}
