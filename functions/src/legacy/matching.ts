/**
 * Matching Service (Legacy)
 *
 * Logic for matching ride requests with available rides
 */

import { Timestamp } from 'firebase-admin/firestore';
import { Ride, RideRequest, getActiveRides, getOpenRideRequests } from '../utils/firestore';
import { getMatchType } from '../utils/routeLogic';
import { normalizeLocation } from '../utils/formatting';

export interface Match {
  ride: Ride;
  matchType: 'exact' | 'ontheway' | 'adjacent';
  score: number;
  timeText: string;
}

/**
 * Find rides matching a request
 */
export async function findMatchingRides(request: {
  from: string;
  to: string;
  neededBy: Timestamp;
  flexibilityMinutes: number;
  isCustomTo: boolean;
  customLocation?: string;
}): Promise<Match[]> {
  try {
    const allRides = await getActiveRides();

    const flexMs = request.flexibilityMinutes * 60 * 1000;
    const earliestTime = request.neededBy.toMillis() - flexMs;
    const latestTime = request.neededBy.toMillis() + flexMs;
    const now = Date.now();

    const matches: Match[] = [];

    for (const ride of allRides) {
      if (ride.from !== request.from) continue;
      if (ride.departureTime.toMillis() <= now) continue;
      if (ride.departureTime.toMillis() < earliestTime || ride.departureTime.toMillis() > latestTime) continue;

      const currentSeats = ride.availableSeats !== undefined
        ? ride.availableSeats
        : ride.capacity - ride.passengerIds.length;
      if (currentSeats <= 0) continue;

      let matchType: 'exact' | 'ontheway' | 'adjacent' | 'none' = 'none';

      if (request.isCustomTo && ride.isCustomTo) {
        const normalizedRequest = normalizeLocation(request.customLocation || '');
        const normalizedRide = normalizeLocation(ride.customLocation || '');
        if (normalizedRequest === normalizedRide) matchType = 'exact';
      } else if (!request.isCustomTo && !ride.isCustomTo) {
        matchType = getMatchType(request.to, ride.to);
        if (matchType === 'ontheway' && !ride.allowsOnTheWay) matchType = 'none';
      }

      if (matchType === 'none') continue;

      const timeDiff = Math.abs(ride.departureTime.toMillis() - request.neededBy.toMillis());
      let score = timeDiff;
      if (matchType === 'ontheway') score += 5 * 60 * 1000;
      else if (matchType === 'adjacent') score += 10 * 60 * 1000;

      matches.push({ ride, matchType, score, timeText: formatTimeDiff(timeDiff) });
    }

    matches.sort((a, b) => a.score - b.score);
    return matches;
  } catch (error) {
    console.error('Error finding matching rides:', error);
    throw error;
  }
}

/**
 * Find requests matching a ride
 */
export async function findMatchingRequests(ride: {
  from: string;
  to: string;
  departureTime: Timestamp;
  allowsOnTheWay: boolean;
  isCustomTo: boolean;
  customLocation?: string;
}): Promise<RideRequest[]> {
  try {
    const allRequests = await getOpenRideRequests();
    const now = Date.now();
    const matches: RideRequest[] = [];

    for (const request of allRequests) {
      if (request.from !== ride.from) continue;
      if (request.neededBy.toMillis() <= now) continue;

      const flexMs = request.flexibilityMinutes * 60 * 1000;
      const earliestTime = request.neededBy.toMillis() - flexMs;
      const latestTime = request.neededBy.toMillis() + flexMs;

      if (ride.departureTime.toMillis() < earliestTime || ride.departureTime.toMillis() > latestTime) continue;

      let isMatch = false;

      if (ride.isCustomTo && request.isCustomTo) {
        const normalizedRide = normalizeLocation(ride.customLocation || '');
        const normalizedRequest = normalizeLocation(request.customLocation || '');
        isMatch = normalizedRide === normalizedRequest;
      } else if (!ride.isCustomTo && !request.isCustomTo) {
        const matchType = getMatchType(request.to, ride.to);
        if (matchType === 'exact') isMatch = true;
        else if (matchType === 'ontheway' && ride.allowsOnTheWay) isMatch = true;
        else if (matchType === 'adjacent') isMatch = true;
      }

      if (isMatch) matches.push(request);
    }

    matches.sort((a, b) => a.neededBy.toMillis() - b.neededBy.toMillis());
    return matches;
  } catch (error) {
    console.error('Error finding matching requests:', error);
    throw error;
  }
}

function formatTimeDiff(diffMs: number): string {
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin === 0) return 'same time';
  if (diffMin < 60) return `${diffMin} min difference`;
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  if (mins === 0) return `${hours} hr difference`;
  return `${hours}h ${mins}m difference`;
}
