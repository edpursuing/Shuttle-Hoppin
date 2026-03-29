import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../utils/firebase'
import type { Ride } from '../utils/types'

export function useRideDetail(rideId: string) {
  const [ride, setRide]       = useState<Ride | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!rideId) return

    const unsubscribe = onSnapshot(
      doc(db, 'rides', rideId),
      (snap) => {
        if (!snap.exists()) {
          setNotFound(true)
          setLoading(false)
          return
        }
        setRide({ id: snap.id, ...snap.data() } as Ride)
        setLoading(false)
      },
      () => {
        setNotFound(true)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [rideId])

  return { ride, loading, notFound }
}
