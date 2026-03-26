/**
 * Firestore Service
 *
 * Database operations for rides and requests
 */

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Lazy initialization to avoid issues during deployment analysis
let db: admin.firestore.Firestore;

function getDb(): admin.firestore.Firestore {
  if (!db) {
    db = admin.firestore();
  }
  return db;
}

// TDD Rider schema
export interface Rider {
  userId: string;
  displayName: string;
  avatarUrl: string;
  bookedAt: Timestamp;
}

// Type definitions
export interface Ride {
  rideId: string;
  driverId: string;
  driverName: string;
  driverAvatar?: string;
  from: string;
  fromDisplay: string;
  to: string;
  toDisplay: string;
  isCustomTo: boolean;
  customLocation?: string;
  routeTrack: 'northbound' | 'eastbound' | 'reverse' | 'custom';
  allowsOnTheWay: boolean;
  onTheWayStops: string[];
  departureTime: Timestamp;
  // Legacy capacity fields
  capacity: number;
  passengerIds: string[];
  passengerDropoffs: Record<string, string>;
  // TDD schema fields
  totalSeats?: number;
  availableSeats?: number;
  riders?: Rider[];
  direction?: 'to-hq' | 'from-hq';
  mode?: 'now' | 'later';
  driverStatus?: 'pending' | 'on-my-way' | 'at-pickup' | 'running-late';
  stopId?: string | null;
  passingThrough?: string | null;
  channelId?: string;
  channelName?: string;
  status: 'active' | 'open' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  reminderSent: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  channelMessageTs?: string;
}

export interface RideRequest {
  requestId: string;
  requesterId: string;
  requesterName: string;
  from: string;
  fromDisplay: string;
  to: string;
  toDisplay: string;
  isCustomTo: boolean;
  customLocation?: string;
  routeTrack: 'northbound' | 'eastbound' | 'reverse' | 'custom';
  neededBy: Timestamp;
  flexibilityMinutes: number;
  status: 'open' | 'fulfilled' | 'cancelled';
  notes?: string;
  createdAt: Timestamp;
  channelMessageTs?: string;
}

/**
 * Create a new ride
 */
export async function createRide(ride: Omit<Ride, 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const docRef = await getDb().collection('rides').add({
      ...ride,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating ride:', error);
    throw error;
  }
}

/**
 * Get a ride by rideId field (e.g., "RIDE-A7K3")
 */
export async function getRide(rideId: string): Promise<Ride | null> {
  try {
    const snapshot = await getDb().collection('rides')
      .where('rideId', '==', rideId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data() as Ride;
  } catch (error) {
    console.error('Error getting ride:', error);
    throw error;
  }
}

/**
 * Update a ride by rideId field
 */
export async function updateRide(rideId: string, updates: Partial<Ride>): Promise<void> {
  try {
    const snapshot = await getDb().collection('rides')
      .where('rideId', '==', rideId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new Error('Ride not found');
    }

    await snapshot.docs[0].ref.update({
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating ride:', error);
    throw error;
  }
}

/**
 * Delete a ride
 */
export async function deleteRide(rideId: string): Promise<void> {
  try {
    const snapshot = await getDb().collection('rides')
      .where('rideId', '==', rideId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.delete();
    }
  } catch (error) {
    console.error('Error deleting ride:', error);
    throw error;
  }
}

/**
 * Get all open rides (TDD status: 'open')
 */
export async function getActiveRides(): Promise<Ride[]> {
  try {
    const snapshot = await getDb().collection('rides')
      .where('status', '==', 'open')
      .orderBy('departureTime', 'asc')
      .get();

    return snapshot.docs.map(doc => doc.data() as Ride);
  } catch (error) {
    console.error('Error getting active rides:', error);
    throw error;
  }
}

/**
 * Create a new ride request
 */
export async function createRideRequest(request: Omit<RideRequest, 'createdAt'>): Promise<string> {
  try {
    const docRef = await getDb().collection('rideRequests').add({
      ...request,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating ride request:', error);
    throw error;
  }
}

/**
 * Get a ride request by ID
 */
export async function getRideRequest(requestId: string): Promise<RideRequest | null> {
  try {
    const snapshot = await getDb().collection('rideRequests')
      .where('requestId', '==', requestId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data() as RideRequest;
  } catch (error) {
    console.error('Error getting ride request:', error);
    throw error;
  }
}

/**
 * Update a ride request
 */
export async function updateRideRequest(requestId: string, updates: Partial<RideRequest>): Promise<void> {
  try {
    const snapshot = await getDb().collection('rideRequests')
      .where('requestId', '==', requestId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new Error('Ride request not found');
    }

    await snapshot.docs[0].ref.update(updates);
  } catch (error) {
    console.error('Error updating ride request:', error);
    throw error;
  }
}

/**
 * Delete a ride request
 */
export async function deleteRideRequest(requestId: string): Promise<void> {
  try {
    const snapshot = await getDb().collection('rideRequests')
      .where('requestId', '==', requestId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.delete();
    }
  } catch (error) {
    console.error('Error deleting ride request:', error);
    throw error;
  }
}

/**
 * Get all open ride requests
 */
export async function getOpenRideRequests(): Promise<RideRequest[]> {
  try {
    const snapshot = await getDb().collection('rideRequests')
      .where('status', '==', 'open')
      .orderBy('neededBy', 'asc')
      .get();

    return snapshot.docs.map(doc => doc.data() as RideRequest);
  } catch (error) {
    console.error('Error getting open ride requests:', error);
    throw error;
  }
}

/**
 * Add passenger to ride using legacy passengerIds array (atomic transaction)
 */
export async function addPassengerToRide(
  rideId: string,
  passengerId: string,
  dropoffLocation: string
): Promise<void> {
  try {
    await getDb().runTransaction(async (transaction) => {
      const snapshot = await getDb().collection('rides')
        .where('rideId', '==', rideId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        throw new Error('Ride not found');
      }

      const rideRef = snapshot.docs[0].ref;
      const ride = snapshot.docs[0].data() as Ride;

      // Check capacity
      if (ride.passengerIds.length >= ride.capacity) {
        throw new Error('Ride is full');
      }

      // Check if passenger already booked
      if (ride.passengerIds.includes(passengerId)) {
        throw new Error('Passenger already booked');
      }

      // Add passenger
      transaction.update(rideRef, {
        passengerIds: admin.firestore.FieldValue.arrayUnion(passengerId),
        [`passengerDropoffs.${passengerId}`]: dropoffLocation,
        updatedAt: Timestamp.now(),
      });
    });
  } catch (error) {
    console.error('Error adding passenger to ride:', error);
    throw error;
  }
}

/**
 * Add a rider using the TDD Rider schema (atomic transaction).
 * Updates both `riders` (TDD) and `passengerIds` (legacy) for compatibility.
 * Returns the ride document as it was after the transaction.
 */
export async function addRiderToRide(rideId: string, rider: Rider): Promise<Ride> {
  const snapshot = await getDb().collection('rides')
    .where('rideId', '==', rideId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new Error('Ride not found');
  }

  const rideRef = snapshot.docs[0].ref;

  await getDb().runTransaction(async (transaction) => {
    const rideSnap = await transaction.get(rideRef);
    const ride = rideSnap.data() as Ride;

    const currentAvailable = ride.availableSeats !== undefined
      ? ride.availableSeats
      : ride.capacity - ride.passengerIds.length;

    if (currentAvailable <= 0) {
      throw new Error('Ride is full');
    }

    const currentRiders = ride.riders ?? [];
    if (currentRiders.some(r => r.userId === rider.userId)) {
      throw new Error('Already booked on this ride');
    }

    transaction.update(rideRef, {
      riders: admin.firestore.FieldValue.arrayUnion(rider),
      passengerIds: admin.firestore.FieldValue.arrayUnion(rider.userId),
      availableSeats: currentAvailable - 1,
      updatedAt: Timestamp.now(),
    });
  });

  // Return post-update state
  const updatedSnap = await rideRef.get();
  return updatedSnap.data() as Ride;
}

/**
 * Remove passenger from ride
 */
export async function removePassengerFromRide(rideId: string, passengerId: string): Promise<void> {
  try {
    const snapshot = await getDb().collection('rides')
      .where('rideId', '==', rideId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new Error('Ride not found');
    }

    const ride = snapshot.docs[0].data() as Ride;
    const updatedDropoffs = { ...ride.passengerDropoffs };
    delete updatedDropoffs[passengerId];

    await snapshot.docs[0].ref.update({
      passengerIds: admin.firestore.FieldValue.arrayRemove(passengerId),
      passengerDropoffs: updatedDropoffs,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error removing passenger from ride:', error);
    throw error;
  }
}
