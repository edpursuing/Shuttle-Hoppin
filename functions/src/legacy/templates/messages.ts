/**
 * Message Templates (Legacy)
 *
 * Slack message blocks for #shuttle channel posts
 */

import { Ride, RideRequest } from '../../utils/firestore';
import { formatTime, formatLocation, formatSeats, timeUntil } from '../../utils/formatting';

/**
 * Build ride announcement for #shuttle channel.
 * Uses availableSeats if present (TDD schema), otherwise falls back to capacity - passengerIds.
 */
export function buildRideAnnouncement(ride: Ride): any[] {
  const availableSeats = ride.availableSeats !== undefined
    ? ride.availableSeats
    : ride.capacity - ride.passengerIds.length;

  const onTheWayText = ride.allowsOnTheWay && ride.onTheWayStops.length > 0
    ? `\n🛣️ Stops: ${ride.onTheWayStops.map(s => formatLocation(s)).join(' → ')}`
    : '';

  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🚗 Ride Available', emoji: true }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${ride.rideId}*\n` +
          `Driver: <@${ride.driverId}>\n` +
          `Route: ${formatLocation(ride.from)} → ${formatLocation(ride.to, ride.customLocation)}${onTheWayText}\n` +
          `Departs: ${formatTime(ride.departureTime, true)} (${timeUntil(ride.departureTime)})\n` +
          `Seats: ${formatSeats(availableSeats, ride.capacity)}`
      }
    },
    ...(ride.notes ? [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `💬 *Notes:* "${ride.notes}"` }
      }
    ] : []),
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: '🙋 Request Seat', emoji: true },
          style: availableSeats > 0 ? 'primary' : undefined,
          value: ride.rideId,
          action_id: 'request_seat_button',
          ...(availableSeats === 0 ? { disabled: true } : {})
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: '💬 Message Driver', emoji: true },
          value: ride.driverId,
          action_id: 'message_driver_button'
        }
      ]
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Last updated: ${new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'America/New_York'
          })}`
        }
      ]
    },
    { type: 'divider' }
  ];
}

/**
 * Build request announcement for #shuttle channel
 */
export function buildRequestAnnouncement(request: RideRequest): any[] {
  const flexText = request.flexibilityMinutes === 0
    ? 'Must be exact time'
    : request.flexibilityMinutes >= 720
    ? 'Any time today'
    : `±${request.flexibilityMinutes} minutes`;

  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🙋 Ride Request', emoji: true }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${request.requestId}*\n` +
          `Rider: <@${request.requesterId}>\n` +
          `Route: ${formatLocation(request.from)} → ${formatLocation(request.to, request.customLocation)}\n` +
          `Needed by: ${formatTime(request.neededBy, true)} (${timeUntil(request.neededBy)})\n` +
          `Flexibility: ${flexText}`
      }
    },
    ...(request.notes ? [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `💬 *Notes:* "${request.notes}"` }
      }
    ] : []),
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: '🚗 I Can Drive', emoji: true },
          style: 'primary',
          value: request.requestId,
          action_id: 'offer_to_drive_button'
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: '💬 Message Rider', emoji: true },
          value: request.requesterId,
          action_id: 'message_rider_button'
        }
      ]
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Last updated: ${new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'America/New_York'
          })}`
        }
      ]
    },
    { type: 'divider' }
  ];
}

/**
 * Build pinned info message for #shuttle channel
 */
export function buildPinnedInfoMessage(): any[] {
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🚗 Pursuit Shuttle Service', emoji: true }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*How to use:*\n' +
          '• 🚗 To offer a ride: `/offer-ride`\n' +
          '• 🙋 To request a ride: `/request-ride`\n' +
          '• ❌ To cancel: `/cancel-ride`\n\n' +
          '*Browse available rides and requests below, or use the commands to get matched automatically!*'
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Current time: ${new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'America/New_York'
          })} EST`
        }
      ]
    },
    { type: 'divider' }
  ];
}
