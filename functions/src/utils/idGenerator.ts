/**
 * ID Generation Utilities
 * 
 * Generates human-friendly IDs for rides and requests
 */

/**
 * Generate a random alphanumeric string
 */
function randomString(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar-looking chars
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a friendly ride ID
 * Format: RIDE-XXXX (e.g., RIDE-A7K3)
 */
export function generateRideId(): string {
  return `RIDE-${randomString(4)}`;
}

/**
 * Generate a friendly request ID
 * Format: REQ-XXXX (e.g., REQ-B2M9)
 */
export function generateRequestId(): string {
  return `REQ-${randomString(4)}`;
}

/**
 * Generate a channel name from ride ID
 * Format: ride-xxxx (lowercase, Slack-compatible)
 */
export function generateChannelName(rideId: string): string {
  return rideId.toLowerCase().replace('_', '-');
}