/**
 * Configuration and Constants
 *
 * This file contains all configuration for the Shuttle Bot including:
 * - Slack credentials
 * - Location definitions
 * - Route logic
 * - Constraints and defaults
 */

import * as functions from 'firebase-functions';

// Load environment variables
// In production: use Firebase config
// In local dev: use .env file
const SLACK_BOT_TOKEN = functions.config().slack?.bot_token || process.env.SLACK_BOT_TOKEN || '';
const SLACK_SIGNING_SECRET = functions.config().slack?.signing_secret || process.env.SLACK_SIGNING_SECRET || '';
const SLACK_APP_ID = functions.config().slack?.app_id || process.env.SLACK_APP_ID || '';
const SLACK_SHUTTLE_CHANNEL = functions.config().slack?.shuttle_channel || process.env.SLACK_SHUTTLE_CHANNEL || 'shuttle';

// Only throw error if we're actually running (not during build/analysis)
if ((!SLACK_BOT_TOKEN || !SLACK_SIGNING_SECRET) && process.env.FUNCTION_TARGET) {
  throw new Error('Missing required Slack credentials in environment variables');
}

export const config = {
  slack: {
    botToken: SLACK_BOT_TOKEN,
    signingSecret: SLACK_SIGNING_SECRET,
    appId: SLACK_APP_ID,
    shuttleChannel: SLACK_SHUTTLE_CHANNEL,
  },

  constraints: {
    maxSeats: 8,
    minSeats: 1,
    defaultSeats: 4,
    maxAdvanceBookingDays: 7,
    minBookingWindowMinutes: 30, // Requires driver approval if less
    defaultFlexibilityMinutes: 30,
  },

  bot: {
    tone: 'friendly', // friendly, professional, casual
    emoji: true,
  },
};

// Location Definitions
export interface Location {
  value: string;
  label: string;
  track?: 'northbound' | 'eastbound' | 'reverse' | 'custom';
  position?: number; // Position in northbound sequence
}

export const PICKUP_LOCATIONS: Location[] = [
  {
    value: 'pursuit_hq',
    label: 'Pursuit HQ',
    track: 'northbound',
    position: -1, // Starting point
  },
];

export const DROPOFF_LOCATIONS: Location[] = [
  {
    value: 'hunters_point',
    label: 'Hunters Point [7, LIRR, Q67]',
    track: 'northbound',
    position: 0,
  },
  {
    value: '21st_street',
    label: '21st Street [G, Q101, Q67]',
    track: 'northbound',
    position: 1,
  },
  {
    value: 'court_square',
    label: 'Court Square - 23rd Street [E, M]',
    track: 'northbound',
    position: 2,
  },
  {
    value: '21st_queensbridge',
    label: '21 St - Queensbridge [F]',
    track: 'northbound',
    position: 3,
  },
  {
    value: 'queensboro_plaza',
    label: 'Queensboro Plaza [7, N, W]',
    track: 'northbound',
    position: 4,
  },
  {
    value: 'mcdonalds',
    label: 'McDonald\'s 🍔🍟',
    track: 'eastbound',
    position: -1, // Terminal only, no position in sequence
  },
  {
    value: 'custom',
    label: '✏️ Custom Location...',
    track: 'custom',
    position: -1,
  },
];

// Reverse trip locations (stations → Pursuit HQ)
export const REVERSE_PICKUP_LOCATIONS: Location[] = DROPOFF_LOCATIONS.filter(
  loc => loc.value !== 'custom' // Can't pick up from custom location
).map(loc => ({
  ...loc,
  track: 'reverse' as const,
}));

// Helper functions
export function getLocationByValue(value: string): Location | undefined {
  return [...PICKUP_LOCATIONS, ...DROPOFF_LOCATIONS, ...REVERSE_PICKUP_LOCATIONS]
    .find(loc => loc.value === value);
}

export function getLocationDisplay(value: string): string {
  const location = getLocationByValue(value);
  return location?.label || value;
}

// Flexibility options for ride requests
export interface FlexibilityOption {
  value: number; // minutes
  label: string;
}

export const FLEXIBILITY_OPTIONS: FlexibilityOption[] = [
  { value: 0, label: 'Must be exact time' },
  { value: 15, label: '±15 minutes' },
  { value: 30, label: '±30 minutes' },
  { value: 60, label: '±60 minutes' },
  { value: 720, label: 'Any time today (±12 hours)' },
];

// Seat options
export const SEAT_OPTIONS = [
  { value: '1', label: '1 seat' },
  { value: '2', label: '2 seats' },
  { value: '3', label: '3 seats' },
  { value: '4', label: '4 seats' },
  { value: '5', label: '5 seats' },
  { value: '6', label: '6 seats' },
  { value: '7', label: '7 seats' },
  { value: '8', label: '8 seats' },
];

export const NORTHBOUND_SEQUENCE = [
  'hunters_point',
  '21st_street',
  'court_square',
  '21st_queensbridge',
  'queensboro_plaza',
];
