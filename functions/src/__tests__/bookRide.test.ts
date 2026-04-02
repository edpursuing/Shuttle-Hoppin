import { getFirestore } from 'firebase-admin/firestore'
import { bookRide } from '../rides/bookRide'

const DEP_MS = 5_000_000   // arbitrary departure time in ms
const DEP_STAMP = { toMillis: () => DEP_MS }

function makeRide(overrides = {}) {
  return {
    status:         'open',
    driverId:       'driver-1',
    availableSeats: 2,
    riders:         [],
    departureTime:  DEP_STAMP,
    ...overrides,
  }
}

function makeUser() {
  return { exists: true, data: () => ({ displayName: 'Rider', avatarUrl: '' }) }
}

function makeRequest(rideId: string, uid = 'rider-1') {
  return { auth: { uid }, data: { rideId } } as any
}

// Helpers to build mock Firestore tx + db
function makeTx(rideData: object | null, userData = makeUser(), otherRides: any[] = []) {
  const tx = {
    get:    jest.fn().mockImplementation((ref: any) => {
      if (ref._isRide) return Promise.resolve({ exists: rideData !== null, data: () => rideData })
      return Promise.resolve(userData)
    }),
    update: jest.fn(),
  }
  return tx
}

function mockDb(tx: any, otherRides: any[] = []) {
  const rideRef = { _isRide: true }
  const userRef = {}
  return {
    collection: jest.fn((name: string) => ({
      doc:   jest.fn(() => name === 'rides' ? rideRef : userRef),
      where: jest.fn().mockReturnThis(),
      get:   jest.fn().mockResolvedValue({ docs: otherRides }),
    })),
    runTransaction: jest.fn(async (fn: Function) => fn(tx)),
  }
}

beforeEach(() => jest.clearAllMocks())

describe('bookRide', () => {
  it('throws unauthenticated when no auth', async () => {
    await expect((bookRide as any)({ auth: null, data: { rideId: 'r1' } }))
      .rejects.toMatchObject({ code: 'unauthenticated' })
  })

  it('throws invalid-argument when rideId missing', async () => {
    await expect((bookRide as any)({ auth: { uid: 'u1' }, data: {} }))
      .rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('throws not-found when ride does not exist', async () => {
    const tx = makeTx(null)
    ;(getFirestore as jest.Mock).mockReturnValue(mockDb(tx))
    await expect((bookRide as any)(makeRequest('r1')))
      .rejects.toMatchObject({ code: 'not-found' })
  })

  it('throws failed-precondition when ride is not open', async () => {
    const tx = makeTx(makeRide({ status: 'completed' }))
    ;(getFirestore as jest.Mock).mockReturnValue(mockDb(tx))
    await expect((bookRide as any)(makeRequest('r1')))
      .rejects.toMatchObject({ code: 'failed-precondition' })
  })

  it('throws failed-precondition when driver tries to book own ride', async () => {
    const tx = makeTx(makeRide({ driverId: 'rider-1' }))
    ;(getFirestore as jest.Mock).mockReturnValue(mockDb(tx))
    await expect((bookRide as any)(makeRequest('r1', 'rider-1')))
      .rejects.toMatchObject({ code: 'failed-precondition' })
  })

  it('throws failed-precondition when no seats available', async () => {
    const tx = makeTx(makeRide({ availableSeats: 0 }))
    ;(getFirestore as jest.Mock).mockReturnValue(mockDb(tx))
    await expect((bookRide as any)(makeRequest('r1')))
      .rejects.toMatchObject({ code: 'failed-precondition' })
  })

  it('throws already-exists when user is already booked', async () => {
    const tx = makeTx(makeRide({ riders: [{ uid: 'rider-1' }] }))
    ;(getFirestore as jest.Mock).mockReturnValue(mockDb(tx))
    await expect((bookRide as any)(makeRequest('r1')))
      .rejects.toMatchObject({ code: 'already-exists' })
  })

  it('throws failed-precondition on overlap within 30 minutes', async () => {
    const tx = makeTx(makeRide())
    const overlappingRide = {
      id: 'other-ride',
      data: () => ({
        driverId:      'other-driver',
        riders:        [{ uid: 'rider-1' }],
        departureTime: { toMillis: () => DEP_MS + 10 * 60 * 1000 }, // 10 min away
      }),
    }
    ;(getFirestore as jest.Mock).mockReturnValue(mockDb(tx, [overlappingRide]))
    await expect((bookRide as any)(makeRequest('r1')))
      .rejects.toMatchObject({ code: 'failed-precondition' })
  })

  it('succeeds when ride is 31 minutes away from existing booking', async () => {
    const tx = makeTx(makeRide())
    const farRide = {
      id: 'other-ride',
      data: () => ({
        driverId:      'other-driver',
        riders:        [{ uid: 'rider-1' }],
        departureTime: { toMillis: () => DEP_MS + 31 * 60 * 1000 }, // 31 min away
      }),
    }
    ;(getFirestore as jest.Mock).mockReturnValue(mockDb(tx, [farRide]))
    const result = await (bookRide as any)(makeRequest('r1'))
    expect(result).toEqual({ success: true })
    expect(tx.update).toHaveBeenCalledTimes(1)
  })

  it('succeeds on a clean booking with no other rides', async () => {
    const tx = makeTx(makeRide())
    ;(getFirestore as jest.Mock).mockReturnValue(mockDb(tx))
    const result = await (bookRide as any)(makeRequest('r1'))
    expect(result).toEqual({ success: true })
    expect(tx.update).toHaveBeenCalledTimes(1)
  })
})
