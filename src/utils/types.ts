import type { Timestamp } from 'firebase/firestore'

export type Direction = 'to-hq' | 'from-hq'
export type RideMode = 'now' | 'later'
export type RideStatus = 'open' | 'in-progress' | 'completed' | 'cancelled'
export type DriverStatus = 'pending' | 'on-my-way' | 'at-pickup' | 'running-late'

export interface Rider {
  uid: string
  displayName: string
  avatarUrl: string
  bookedAt: Timestamp
}

export interface Ride {
  id: string
  driverId: string
  driverName: string
  driverAvatar: string
  direction: Direction
  stopId: string
  stopName: string
  customLocation: string | null
  passingThrough: string | null
  departureTime: Timestamp
  mode: RideMode
  totalSeats: number
  availableSeats: number
  status: RideStatus
  driverStatus: DriverStatus
  riders: Rider[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface UserProfile {
  slackId: string
  displayName: string
  avatarUrl: string
  email: string
  hasCar: boolean
  defaultStop: string | null
  departureWindow: { start: string; end: string } | null
  notificationPrefs: {
    slackDMs: boolean
    frequency: 'instant' | 'digest'
  }
  stats: {
    ridesGiven: number
    ridesTaken: number
    lateCancels: number
  }
  onboardingComplete: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Stop {
  id: string
  name: string
  shortName: string
  lines: { name: string; color: string; textColor: string }[]
  sequenceOrder: number
  visualGroup: string | null
  latitude: number
  longitude: number
  isSpecial: boolean
}

export interface Cancellation {
  userId: string
  rideId: string
  role: 'driver' | 'rider'
  cancelledAt: Timestamp
  departureTime: Timestamp
  minutesBefore: number
  isLate: boolean
}
