/**
 * Formatting Utilities
 * 
 * Functions for formatting dates, times, and text for display
 */

import { Timestamp } from 'firebase-admin/firestore';

/**
 * Format a Firestore Timestamp as a human-readable time
 * Example: "3:30 PM" or "Today at 3:30 PM"
 */
export function formatTime(timestamp: Timestamp, includeDate: boolean = false): string {
  const date = timestamp.toDate();
  const now = new Date();
  
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York',
  });
  
  if (!includeDate) {
    return timeStr;
  }
  
  // Check if same day
  const isToday = date.toDateString() === now.toDateString();
  
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  
  if (isToday) {
    return `Today at ${timeStr}`;
  } else if (isTomorrow) {
    return `Tomorrow at ${timeStr}`;
  } else {
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'America/New_York',
    });
    return `${dateStr} at ${timeStr}`;
  }
}

/**
 * Calculate time until a given timestamp
 * Returns a human-readable string like "in 45 minutes" or "in 2 hours"
 */
export function timeUntil(timestamp: Timestamp): string {
  const now = Date.now();
  const target = timestamp.toMillis();
  const diffMs = target - now;
  
  if (diffMs < 0) {
    return 'passed';
  }
  
  const diffMin = Math.floor(diffMs / 60000);
  
  if (diffMin < 60) {
    return `in ${diffMin} min`;
  } else {
    const diffHours = Math.floor(diffMin / 60);
    const remainMin = diffMin % 60;
    if (remainMin === 0) {
      return `in ${diffHours} hr`;
    }
    return `in ${diffHours}h ${remainMin}m`;
  }
}

/**
 * Format location display with optional custom location
 */
export function formatLocation(locationValue: string, customLocation?: string): string {
  if (locationValue === 'custom' && customLocation) {
    return customLocation;
  }
  
  // Import at runtime to avoid circular dependency
  const { getLocationDisplay } = require('./config');
  return getLocationDisplay(locationValue);
}

/**
 * Normalize custom location text for matching
 * - Lowercase
 * - Remove punctuation
 * - Trim whitespace
 */
export function normalizeLocation(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

/**
 * Format a list of stops with arrows
 * Example: "Hunters Pt → 21st St → Court Square"
 */
export function formatStopsList(stops: string[]): string {
  const { getLocationDisplay } = require('./config');
  return stops
    .map(stop => {
      const display = getLocationDisplay(stop);
      // Shorten long names
      return display.split('[')[0].trim();
    })
    .join(' → ');
}

/**
 * Format available seats display
 * Example: "2 of 4 available"
 */
export function formatSeats(available: number, capacity: number): string {
  if (available === 0) {
    return 'FULL';
  }
  return `${available} of ${capacity} available`;
}