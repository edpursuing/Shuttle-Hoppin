import { getFirestore } from 'firebase-admin/firestore'
import { expireRides } from '../rides/expireRides'

function makeRideDoc(id: string, riders: { uid: string }[]) {
  return {
    ref:  { _id: id },
    data: () => ({ driverId: `driver-${id}`, riders }),
  }
}

function mockDb(rideDocs: any[]) {
  const batchUpdate = jest.fn()
  const batchCommit = jest.fn().mockResolvedValue(undefined)
  const batch = { update: batchUpdate, commit: batchCommit }

  return {
    _batchUpdate: batchUpdate,
    _batchCommit: batchCommit,
    collection: jest.fn(() => ({
      where:    jest.fn().mockReturnThis(),
      get:      jest.fn().mockResolvedValue({ empty: rideDocs.length === 0, size: rideDocs.length, docs: rideDocs }),
      doc:      jest.fn((id: string) => ({ _id: id })),
    })),
    batch: jest.fn(() => batch),
  }
}

beforeEach(() => jest.clearAllMocks())

describe('expireRides', () => {
  it('does nothing when no stale rides', async () => {
    const db = mockDb([])
    ;(getFirestore as jest.Mock).mockReturnValue(db)
    await (expireRides as any)()
    expect(db._batchCommit).not.toHaveBeenCalled()
  })

  it('marks rides as completed', async () => {
    const doc = makeRideDoc('ride-1', [])
    const db  = mockDb([doc])
    ;(getFirestore as jest.Mock).mockReturnValue(db)
    await (expireRides as any)()
    expect(db._batchUpdate).toHaveBeenCalledWith(
      doc.ref,
      expect.objectContaining({ status: 'completed' })
    )
  })

  it('does NOT increment stats when ride has no riders', async () => {
    const doc = makeRideDoc('ride-1', [])
    const db  = mockDb([doc])
    ;(getFirestore as jest.Mock).mockReturnValue(db)
    await (expireRides as any)()
    // Only one update call — the ride itself, no user stat updates
    expect(db._batchUpdate).toHaveBeenCalledTimes(1)
  })

  it('increments ridesGiven for driver when riders are present', async () => {
    const doc = makeRideDoc('ride-1', [{ uid: 'rider-a' }])
    const db  = mockDb([doc])
    ;(getFirestore as jest.Mock).mockReturnValue(db)
    await (expireRides as any)()
    const calls = (db._batchUpdate as jest.Mock).mock.calls
    const driverUpdate = calls.find((c: any[]) =>
      c[0]._id === 'driver-ride-1' && c[1]['stats.ridesGiven'] !== undefined
    )
    expect(driverUpdate).toBeDefined()
  })

  it('increments ridesTaken for each rider', async () => {
    const doc = makeRideDoc('ride-1', [{ uid: 'rider-a' }, { uid: 'rider-b' }])
    const db  = mockDb([doc])
    ;(getFirestore as jest.Mock).mockReturnValue(db)
    await (expireRides as any)()
    const calls = (db._batchUpdate as jest.Mock).mock.calls
    const riderUpdates = calls.filter((c: any[]) =>
      c[1]['stats.ridesTaken'] !== undefined
    )
    expect(riderUpdates).toHaveLength(2)
  })

  it('commits the batch', async () => {
    const doc = makeRideDoc('ride-1', [{ uid: 'rider-a' }])
    const db  = mockDb([doc])
    ;(getFirestore as jest.Mock).mockReturnValue(db)
    await (expireRides as any)()
    expect(db._batchCommit).toHaveBeenCalledTimes(1)
  })
})
