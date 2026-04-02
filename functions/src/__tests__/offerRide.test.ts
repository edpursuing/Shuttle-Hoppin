import { getFirestore } from 'firebase-admin/firestore'
import { offerRide } from '../rides/offerRide'

const mockGet = jest.fn()
const mockSet = jest.fn()
const mockDoc = jest.fn(() => ({ get: mockGet, set: mockSet, id: 'ride-123' }))
const mockCollection = jest.fn(() => ({ doc: mockDoc }))

beforeEach(() => {
  jest.clearAllMocks()
  ;(getFirestore as jest.Mock).mockReturnValue({ collection: mockCollection })
})

function makeRequest(data: object, uid = 'user-1') {
  return { auth: { uid }, data } as any
}

const validData = {
  direction:     'from-hq',
  stopId:        'hunters-point',
  stopName:      'Hunters Point Av',
  customLocation: null,
  passingThrough: null,
  departureTime: new Date(Date.now() + 3600_000).toISOString(),
  mode:          'later',
  totalSeats:    4,
}

describe('offerRide validation', () => {
  it('throws unauthenticated when no auth', async () => {
    await expect((offerRide as any)({ auth: null, data: validData }))
      .rejects.toMatchObject({ code: 'unauthenticated' })
  })

  it('throws on invalid direction', async () => {
    await expect((offerRide as any)(makeRequest({ ...validData, direction: 'sideways' })))
      .rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('throws when stopId missing', async () => {
    await expect((offerRide as any)(makeRequest({ ...validData, stopId: '' })))
      .rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('throws when seats is 0', async () => {
    await expect((offerRide as any)(makeRequest({ ...validData, totalSeats: 0 })))
      .rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('throws when seats exceeds 8', async () => {
    await expect((offerRide as any)(makeRequest({ ...validData, totalSeats: 9 })))
      .rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('throws permission-denied when user does not have a car', async () => {
    mockGet.mockResolvedValue({ exists: true, data: () => ({ hasCar: false, displayName: 'Test' }) })
    await expect((offerRide as any)(makeRequest(validData)))
      .rejects.toMatchObject({ code: 'permission-denied' })
  })

  it('creates ride and returns rideId when valid', async () => {
    mockGet.mockResolvedValue({ exists: true, data: () => ({ hasCar: true, displayName: 'Test', avatarUrl: '' }) })
    mockSet.mockResolvedValue(undefined)
    const result = await (offerRide as any)(makeRequest(validData))
    expect(result).toHaveProperty('rideId')
    expect(mockSet).toHaveBeenCalledTimes(1)
  })
})
