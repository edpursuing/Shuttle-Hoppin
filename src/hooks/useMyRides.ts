import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../utils/firebase'
import type { Ride } from '../utils/types'

export function useMyRides(uid: string | null) {
  const [driverRides, setDriverRides] = useState<Ride[]>([])
  const [riderRides,  setRiderRides]  = useState<Ride[]>([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    if (!uid) {
      setLoading(false)
      return
    }

    let driverDone = false
    let riderDone  = false

    function checkDone() {
      if (driverDone && riderDone) setLoading(false)
    }

    // Rides I'm driving
    const driverQ = query(
      collection(db, 'rides'),
      where('driverId', '==', uid),
    )
    const unsubDriver = onSnapshot(driverQ, snap => {
      const rides = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Ride))
        .sort((a, b) => b.departureTime.seconds - a.departureTime.seconds)
      setDriverRides(rides)
      driverDone = true
      checkDone()
    }, () => { driverDone = true; checkDone() })

    // Open rides where I'm a rider — filter client-side since Firestore
    // can't query by a field inside an array of objects
    const riderQ = query(
      collection(db, 'rides'),
      where('status', '==', 'open'),
    )
    const unsubRider = onSnapshot(riderQ, snap => {
      const rides = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Ride))
        .filter(r => r.driverId !== uid && r.riders.some(x => x.uid === uid))
        .sort((a, b) => a.departureTime.seconds - b.departureTime.seconds)
      setRiderRides(rides)
      riderDone = true
      checkDone()
    }, () => { riderDone = true; checkDone() })

    return () => {
      unsubDriver()
      unsubRider()
    }
  }, [uid])

  return { driverRides, riderRides, loading }
}
