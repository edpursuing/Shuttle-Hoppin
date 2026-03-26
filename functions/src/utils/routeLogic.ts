/**
 * Route Logic Utilities
 * 
 * Functions for determining route relationships and on-the-way calculations
 */

import { NORTHBOUND_SEQUENCE, getLocationByValue } from './config';

/**
 * Determine if a destination is "on the way" to another destination
 * 
 * @param requesterDestination - Where the requester wants to go
 * @param driverDestination - Where the driver is going
 * @returns true if requester's stop is before driver's final stop on the same route
 */
export function isOnTheWay(requesterDestination: string, driverDestination: string): boolean {
  const requesterLoc = getLocationByValue(requesterDestination);
  const driverLoc = getLocationByValue(driverDestination);
  
  if (!requesterLoc || !driverLoc) {
    return false;
  }
  
  // Only works for northbound track
  if (driverLoc.track !== 'northbound') {
    return false;
  }
  
  // Both must be on northbound track
  if (requesterLoc.track !== 'northbound') {
    return false;
  }
  
  const requesterPos = NORTHBOUND_SEQUENCE.indexOf(requesterDestination);
  const driverPos = NORTHBOUND_SEQUENCE.indexOf(driverDestination);
  
  // Requester's stop must be before driver's final stop
  return requesterPos >= 0 && driverPos >= 0 && requesterPos < driverPos;
}

/**
 * Get all stops between start and end on northbound route
 * 
 * @param startDestination - Starting point (inclusive)
 * @param endDestination - Ending point (inclusive)
 * @returns Array of stop values in order
 */
export function getStopsOnRoute(startDestination: string, endDestination: string): string[] {
  const startPos = NORTHBOUND_SEQUENCE.indexOf(startDestination);
  const endPos = NORTHBOUND_SEQUENCE.indexOf(endDestination);
  
  if (startPos === -1 || endPos === -1 || startPos >= endPos) {
    return [];
  }
  
  return NORTHBOUND_SEQUENCE.slice(startPos, endPos + 1);
}

/**
 * Calculate estimated time added per stop
 * 
 * @param numStops - Number of additional stops
 * @returns Estimated minutes added to trip
 */
export function estimateTimePerStop(numStops: number): number {
  // Assume ~3-5 minutes per stop (average 4)
  return numStops * 4;
}

/**
 * Determine match type between two destinations
 * 
 * @returns 'exact' | 'ontheway' | 'adjacent' | 'none'
 */
export function getMatchType(
  requesterDestination: string,
  driverDestination: string
): 'exact' | 'ontheway' | 'adjacent' | 'none' {
  // Exact match
  if (requesterDestination === driverDestination) {
    return 'exact';
  }
  
  // On-the-way match
  if (isOnTheWay(requesterDestination, driverDestination)) {
    return 'ontheway';
  }
  
  // Adjacent match (±1 position)
  const requesterPos = NORTHBOUND_SEQUENCE.indexOf(requesterDestination);
  const driverPos = NORTHBOUND_SEQUENCE.indexOf(driverDestination);
  
  if (requesterPos >= 0 && driverPos >= 0) {
    if (Math.abs(requesterPos - driverPos) === 1) {
      return 'adjacent';
    }
  }
  
  return 'none';
}

/**
 * Get the route track for a location
 */
export function getRouteTrack(locationValue: string): 'northbound' | 'eastbound' | 'reverse' | 'custom' | null {
  const location = getLocationByValue(locationValue);
  return location?.track || null;
}