/**
 * Button Action Handlers (Legacy)
 *
 * Handles interactive button clicks from Slack channel messages
 */

import { Timestamp } from 'firebase-admin/firestore';
import { addRiderToRide } from '../utils/firestore';
import { sendDM, getUserInfo, updateMessage } from '../utils/slack';
import { buildRideAnnouncement } from './templates/messages';

/**
 * Route button actions to the correct handler
 */
export async function handleButtonAction(payload: any): Promise<void> {
  const actionId = payload.actions?.[0]?.action_id;

  console.log('Button action:', actionId);

  switch (actionId) {
    case 'request_seat_button':
      await handleRequestSeat(payload);
      break;

    case 'message_driver_button':
      await handleMessageDriver(payload);
      break;

    default:
      console.log('Unhandled button action:', actionId);
  }
}

/**
 * Handle "Request Seat" button click on a ride announcement.
 *
 * - Adds the user to the ride's `riders` array (TDD schema)
 * - Decrements `availableSeats`
 * - DMs the driver
 * - Updates the channel message with the new seat count
 */
async function handleRequestSeat(payload: any): Promise<void> {
  const riderId = payload.user.id;
  const rideId = payload.actions[0].value; // RIDE-XXXX

  try {
    // Get rider's display info for the riders array
    const userInfo = await getUserInfo(riderId);

    const rider = {
      userId: riderId,
      displayName: userInfo.real_name,
      avatarUrl: userInfo.avatar_url,
      bookedAt: Timestamp.now(),
    };

    // Atomic transaction: validate + add rider + decrement availableSeats
    const updatedRide = await addRiderToRide(rideId, rider);

    // DM the driver to notify of the new rider
    const stopName = updatedRide.toDisplay || updatedRide.to;
    await sendDM(updatedRide.driverId, {
      text: `<@${riderId}> joined your ride to ${stopName}!`,
    });

    // Update the channel announcement to reflect the new seat count
    if (updatedRide.channelMessageTs && updatedRide.channelId) {
      const updatedBlocks = buildRideAnnouncement(updatedRide);
      await updateMessage({
        channel: updatedRide.channelId,
        ts: updatedRide.channelMessageTs,
        text: `Ride ${rideId} updated — ${updatedRide.availableSeats ?? 0} seat(s) remaining`,
        blocks: updatedBlocks,
      });
    }

  } catch (err: any) {
    console.error('Error handling request_seat_button:', err.message);

    // DM the rider with a friendly error
    let errorText = 'Could not book your seat. Please try again.';
    if (err.message === 'Ride is full') {
      errorText = 'Sorry, this ride just filled up!';
    } else if (err.message === 'Already booked on this ride') {
      errorText = 'You already have a seat on this ride!';
    } else if (err.message === 'Ride not found') {
      errorText = 'Could not find that ride. It may have been cancelled.';
    }

    await sendDM(riderId, { text: errorText });
  }
}

/**
 * Handle "Message Driver" button click on a ride announcement.
 *
 * Sends the rider a Slack deep-link to open a DM with the driver.
 */
async function handleMessageDriver(payload: any): Promise<void> {
  const riderId = payload.user.id;
  const driverSlackId = payload.actions[0].value;
  const workspaceId = payload.team?.id || '';

  try {
    const driverInfo = await getUserInfo(driverSlackId);

    await sendDM(riderId, {
      text: `You can message ${driverInfo.real_name} directly here: slack://user?team=${workspaceId}&id=${driverSlackId}`,
    });

  } catch (err: any) {
    console.error('Error handling message_driver_button:', err.message);
    await sendDM(riderId, { text: 'Could not retrieve driver info. Please try again.' });
  }
}
