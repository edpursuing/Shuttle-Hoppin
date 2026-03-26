/**
 * Channels Service (Legacy)
 *
 * Management of private coordination channels for rides
 */

import { Ride } from '../utils/firestore';
import {
  createPrivateChannel,
  inviteToChannel,
  kickFromChannel,
  setChannelTopic,
  setChannelPurpose,
  postToChannel,
  archiveChannel,
  pinMessage,
} from '../utils/slack';
import { generateChannelName } from '../utils/idGenerator';
import { formatTime, formatLocation } from '../utils/formatting';

/**
 * Create a coordination channel for a ride
 */
export async function createRideChannel(ride: Ride): Promise<{ channelId: string; channelName: string }> {
  try {
    const channelName = generateChannelName(ride.rideId);

    const channel = await createPrivateChannel(channelName);

    const topic = `🚗 ${formatLocation(ride.from)} → ${formatLocation(ride.to, ride.customLocation)} | ${formatTime(ride.departureTime)}`;
    await setChannelTopic(channel.id, topic);

    const purpose = `Coordination chat for ride ${ride.rideId}. Auto-archives 24h after departure.`;
    await setChannelPurpose(channel.id, purpose);

    await inviteToChannel(channel.id, [ride.driverId]);

    const welcomeResult = await postToChannel({
      channel: channel.id,
      text: `Welcome to ride ${ride.rideId}!`,
      blocks: buildWelcomeMessage(ride),
    });

    await pinMessage(channel.id, welcomeResult.ts);

    return { channelId: channel.id, channelName: channel.name };
  } catch (error) {
    console.error('Error creating ride channel:', error);
    throw error;
  }
}

/**
 * Add a passenger to the ride channel
 */
export async function addPassengerToChannel(
  channelId: string,
  passengerId: string,
  ride: Ride
): Promise<void> {
  try {
    await inviteToChannel(channelId, [passengerId]);

    const passengerCount = ride.passengerIds.length;
    const remaining = ride.capacity - passengerCount;

    await postToChannel({
      channel: channelId,
      text: `Welcome <@${passengerId}>!`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `👋 Welcome <@${passengerId}>!\n\n` +
              `You're passenger ${passengerCount} of ${ride.capacity}. ` +
              (remaining === 0
                ? `🎉 *Ride is now full!*`
                : `${remaining} seat${remaining > 1 ? 's' : ''} still available.`
              )
          }
        }
      ]
    });

    if (remaining === 0) {
      await postToChannel({
        channel: channelId,
        text: '🎉 This ride is now full!',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `🎉 *Ride is Full!*\n\nAll ${ride.capacity} seats are now booked. See you at the pickup point!`
            }
          }
        ]
      });
    }
  } catch (error) {
    console.error('Error adding passenger to channel:', error);
    throw error;
  }
}

/**
 * Remove a passenger from the ride channel
 */
export async function removePassengerFromChannel(
  channelId: string,
  passengerId: string,
  ride: Ride,
  reason?: string
): Promise<void> {
  try {
    await kickFromChannel(channelId, passengerId);

    await postToChannel({
      channel: channelId,
      text: `<@${passengerId}> has left the ride`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `👋 <@${passengerId}> has cancelled their booking.\n\n` +
              (reason ? `*Reason:* ${reason}\n\n` : '') +
              `*Seats available:* ${ride.capacity - ride.passengerIds.length} of ${ride.capacity}`
          }
        }
      ]
    });
  } catch (error) {
    console.error('Error removing passenger from channel:', error);
    throw error;
  }
}

/**
 * Archive a ride channel
 */
export async function archiveRideChannel(channelId: string, rideId: string): Promise<void> {
  try {
    await postToChannel({
      channel: channelId,
      text: '👋 This ride has ended',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `👋 *Ride ${rideId} has ended*\n\n` +
              `Thanks for using the shuttle service! This channel will be archived now.\n\n` +
              `🌟 *Want to ride together again?* Use \`/offer-ride\` or \`/request-ride\` to coordinate!`
          }
        }
      ]
    });

    await archiveChannel(channelId);
  } catch (error) {
    console.error('Error archiving ride channel:', error);
    throw error;
  }
}

function buildWelcomeMessage(ride: Ride): any[] {
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: `🚗 Ride ${ride.rideId} Coordination`, emoji: true }
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Driver:*\n<@${ride.driverId}>` },
        { type: 'mrkdwn', text: `*Route:*\n${formatLocation(ride.from)} → ${formatLocation(ride.to, ride.customLocation)}` },
        { type: 'mrkdwn', text: `*Departure:*\n${formatTime(ride.departureTime, true)}` },
        { type: 'mrkdwn', text: `*Status:*\nWaiting for passengers...` }
      ]
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Use this chat to:*\n• Coordinate pickup details\n• Share updates or delays\n• Ask questions about the ride\n• Exchange contact info if needed`
      }
    },
    {
      type: 'context',
      elements: [{ type: 'mrkdwn', text: '💡 This channel will auto-archive 24 hours after departure' }]
    }
  ];
}
