/**
 * DM (Direct Message) Templates (Legacy)
 *
 * Slack message blocks for direct messages to users
 */

import { Ride, RideRequest } from '../../utils/firestore';
import { Match } from '../matching';
import { formatTime, formatLocation, formatSeats } from '../../utils/formatting';

/**
 * Build confirmation DM for driver who posted a ride
 */
export function buildRidePostedConfirmation(ride: Ride, matchCount: number): any[] {
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '✅ Your Ride Has Been Posted!', emoji: true }
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Ride ID:*\n${ride.rideId}` },
        { type: 'mrkdwn', text: `*Seats:*\n${ride.capacity} available` },
        { type: 'mrkdwn', text: `*From:*\n${formatLocation(ride.from)}` },
        { type: 'mrkdwn', text: `*To:*\n${formatLocation(ride.to, ride.customLocation)}` },
        { type: 'mrkdwn', text: `*Departs:*\n${formatTime(ride.departureTime, true)}` }
      ]
    },
    ...(matchCount > 0 ? [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🎯 *Found ${matchCount} matching request${matchCount > 1 ? 's' : ''}!* Check your DMs below.`
        }
      }
    ] : [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `I'll notify you when someone requests your ride! 🔔` }
      }
    ])
  ];
}

/**
 * Build confirmation DM for requester who posted a request
 */
export function buildRequestPostedConfirmation(request: RideRequest, matchCount: number): any[] {
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '✅ Your Request Has Been Posted!', emoji: true }
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Request ID:*\n${request.requestId}` },
        { type: 'mrkdwn', text: `*From:*\n${formatLocation(request.from)}` },
        { type: 'mrkdwn', text: `*To:*\n${formatLocation(request.to, request.customLocation)}` },
        { type: 'mrkdwn', text: `*Needed by:*\n${formatTime(request.neededBy, true)}` }
      ]
    },
    ...(matchCount > 0 ? [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `✅ *Found ${matchCount} matching ride${matchCount > 1 ? 's' : ''}!* See options below:`
        }
      }
    ] : [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `No matching rides right now, but I've posted your request to the channel. I'll notify you when a matching ride is posted! 🔔`
        }
      }
    ])
  ];
}

/**
 * Build match notification for requester (shows available rides)
 */
export function buildMatchesForRequester(matches: Match[]): any[] {
  const blocks: any[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `✅ Found ${matches.length} Matching Ride${matches.length > 1 ? 's' : ''}!`,
        emoji: true
      }
    }
  ];

  for (const match of matches) {
    const ride = match.ride;
    const availableSeats = ride.availableSeats !== undefined
      ? ride.availableSeats
      : ride.capacity - ride.passengerIds.length;

    let matchTypeEmoji = '';
    let matchTypeText = '';
    if (match.matchType === 'exact') { matchTypeEmoji = '🎯'; matchTypeText = 'Perfect match!'; }
    else if (match.matchType === 'ontheway') { matchTypeEmoji = '🛣️'; matchTypeText = 'On the way (multi-stop)'; }
    else if (match.matchType === 'adjacent') { matchTypeEmoji = '📍'; matchTypeText = 'Nearby stop'; }

    blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${matchTypeEmoji} *${ride.rideId}* - ${matchTypeText}\n` +
            `Driver: <@${ride.driverId}>\n` +
            `Route: ${formatLocation(ride.from)} → ${formatLocation(ride.to, ride.customLocation)}\n` +
            `Departs: ${formatTime(ride.departureTime, true)}\n` +
            `Seats: ${formatSeats(availableSeats, ride.capacity)}\n` +
            `Time: ${match.timeText}`
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '🙋 Request This Ride', emoji: true },
            style: 'primary',
            value: ride.rideId,
            action_id: 'request_specific_ride'
          }
        ]
      },
      { type: 'divider' }
    );
  }

  return blocks;
}

/**
 * Build match notification for driver (shows matching requests)
 */
export function buildMatchesForDriver(ride: Ride, requests: RideRequest[]): any[] {
  const blocks: any[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `🎯 Found ${requests.length} Matching Request${requests.length > 1 ? 's' : ''}!`,
        emoji: true
      }
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `These requests match your ride *${ride.rideId}*:` }
    }
  ];

  for (const request of requests) {
    blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🙋 *${request.requestId}*\n` +
            `Passenger: <@${request.requesterId}>\n` +
            `Destination: ${formatLocation(request.to, request.customLocation)}\n` +
            `Needed by: ${formatTime(request.neededBy, true)}\n` +
            (request.notes ? `💬 "${request.notes}"` : '')
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '✅ Assign Seat', emoji: true },
            style: 'primary',
            value: JSON.stringify({
              rideId: ride.rideId,
              requestId: request.requestId,
              requesterId: request.requesterId,
              destination: request.to
            }),
            action_id: 'assign_seat_button'
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '❌ Decline', emoji: true },
            value: request.requestId,
            action_id: 'decline_request_button'
          }
        ]
      },
      { type: 'divider' }
    );
  }

  return blocks;
}

/**
 * Build booking confirmation for passenger
 */
export function buildPassengerBookingConfirmation(ride: Ride, channelId: string): any[] {
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: `✅ You're Booked for Ride ${ride.rideId}!`, emoji: true }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Driver:* <@${ride.driverId}>\n` +
          `*Route:* ${formatLocation(ride.from)} → ${formatLocation(ride.to, ride.customLocation)}\n` +
          `*Departs:* ${formatTime(ride.departureTime, true)}\n\n` +
          `📱 *Join the ride coordination channel:* <#${channelId}>`
      }
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: '💬 Open Ride Chat', emoji: true },
          url: `slack://channel?id=${channelId}`,
          action_id: 'open_channel_button'
        }
      ]
    }
  ];
}

/**
 * Build booking confirmation for driver
 */
export function buildDriverBookingConfirmation(passengerId: string, rideId: string): any[] {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `✅ *Seat Assigned*\n<@${passengerId}> has been added to ride ${rideId}.`
      }
    }
  ];
}
