/**
 * Modal Submission Handlers (Legacy)
 *
 * Handles form submissions from modals
 */

import { Timestamp } from 'firebase-admin/firestore';
import { createRide, createRideRequest, updateRide } from '../utils/firestore';
import { findMatchingRides, findMatchingRequests } from './matching';
import { sendDM, postToChannel, getUserInfo } from '../utils/slack';
import { buildRideAnnouncement, buildRequestAnnouncement } from './templates/messages';
import {
  buildRidePostedConfirmation,
  buildRequestPostedConfirmation,
  buildMatchesForRequester,
  buildMatchesForDriver
} from './templates/dms';
import { generateRideId, generateRequestId } from '../utils/idGenerator';
import { validateRideOffer, validateRideRequest } from '../utils/validation';
import { getStopsOnRoute, getRouteTrack } from '../utils/routeLogic';
import { getLocationDisplay } from '../utils/config';
import { config } from '../utils/config';

/**
 * Parse a date string and time string selected by a user in Eastern Time.
 * Slack date/time pickers return local values with no timezone attached.
 * Cloud Functions run in UTC, so a naive `new Date("2025-03-27T23:00:00")`
 * stores 11 PM UTC (= 7 PM ET) instead of 11 PM ET (= 3 AM UTC next day).
 */
function parseEasternTime(dateStr: string, timeStr: string): Date {
  // Parse as UTC first to get a concrete Date to probe the offset from
  const asUtc = new Date(`${dateStr}T${timeStr}:00Z`);
  // Get the ET offset at this specific UTC moment (handles DST automatically)
  const utcHour = parseInt(
    asUtc.toLocaleString('en-US', { timeZone: 'UTC', hour: 'numeric', hour12: false, hourCycle: 'h23' })
  );
  const etHour = parseInt(
    asUtc.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false, hourCycle: 'h23' })
  );
  let offsetHours = etHour - utcHour;
  if (offsetHours > 12) offsetHours -= 24;
  if (offsetHours < -12) offsetHours += 24;
  // Convert "this local ET time" to UTC by subtracting the ET offset
  return new Date(asUtc.getTime() - offsetHours * 60 * 60 * 1000);
}

/**
 * Handle offer ride modal submission
 */
export async function handleOfferRideSubmit(payload: any): Promise<void> {
  console.log('=== OFFER RIDE SUBMIT STARTED ===');
  console.log('User ID:', payload.user.id);

  try {
    const userId = payload.user.id;
    const values = payload.view.state.values;

    // Extract form data
    const from = values.from_block.from_select.selected_option.value;
    const to = values.to_block.to_select.selected_option.value;
    const date = values.date_block.date_select.selected_date;
    const time = values.time_block.time_select.selected_time;
    const capacity = parseInt(values.capacity_block.capacity_select.selected_option.value);
    const notes = values.notes_block.notes_input.value || '';
    const allowsOnTheWay = values.ontheway_block.ontheway_check.selected_options?.length > 0;

    // Handle custom location
    const isCustomTo = to === 'custom';
    const customLocation = isCustomTo ? values.custom_location_block?.custom_location_input?.value : undefined;

    // Combine date and time, treating user input as Eastern Time
    const departureTime = parseEasternTime(date, time);

    // Validate (just log warnings, don't block)
    const validation = validateRideOffer({ from, to, departureTime, capacity, notes, customLocation });
    if (!validation.valid) {
      console.warn('Validation warnings:', validation.errors);
    }

    // Get user info (including avatar for TDD schema)
    const userInfo = await getUserInfo(userId);

    // Generate ride ID
    const rideId = generateRideId();

    // Determine route track
    const routeTrack = getRouteTrack(to) || 'custom';

    // Get on-the-way stops if applicable
    const onTheWayStops = allowsOnTheWay && routeTrack === 'northbound'
      ? getStopsOnRoute(from, to)
      : [];

    // Derive TDD direction: all offer-ride flows are from Pursuit HQ
    const direction = from === 'pursuit_hq' ? 'from-hq' : 'to-hq';

    // Map location value to kebab-case stopId for TDD schema
    const stopId = isCustomTo ? null : to.replace(/_/g, '-');

    // Build ride document with both legacy fields and TDD-aligned fields
    const rideData: any = {
      rideId,
      // Driver info
      driverId: userId,
      driverName: userInfo.real_name,
      driverAvatar: userInfo.avatar_url,
      // Route (legacy fields)
      from,
      fromDisplay: getLocationDisplay(from),
      to,
      toDisplay: isCustomTo ? customLocation! : getLocationDisplay(to),
      isCustomTo,
      routeTrack,
      allowsOnTheWay,
      onTheWayStops,
      // TDD route fields
      direction,
      stopId,
      passingThrough: null,
      // Departure
      departureTime: Timestamp.fromDate(departureTime),
      // Seats (legacy + TDD)
      capacity,
      totalSeats: capacity,
      availableSeats: capacity,
      passengerIds: [],
      passengerDropoffs: {},
      riders: [],
      // Status (TDD: 'open')
      status: 'open' as const,
      driverStatus: 'pending' as const,
      mode: 'later' as const,
      // Misc
      notes,
      reminderSent: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Only add customLocation if it exists (Firestore doesn't accept undefined)
    if (customLocation) {
      rideData.customLocation = customLocation;
    }

    // Create ride in Firestore
    await createRide(rideData);

    // Post to #shuttle channel — capture ts so the "Request Seat" button can update it
    const channelPost = await postToChannel({
      channel: config.slack.shuttleChannel,
      text: `New ride: ${from} → ${to} at ${departureTime.toLocaleTimeString()}`,
      blocks: buildRideAnnouncement(rideData)
    });

    // Store channel message metadata on the ride for later updates
    await updateRide(rideData.rideId, {
      channelMessageTs: channelPost.ts,
      channelId: channelPost.channel,
    });

    // Find matching requests (two-way matching)
    const matchingRequests = await findMatchingRequests({
      from,
      to,
      departureTime: Timestamp.fromDate(departureTime),
      allowsOnTheWay,
      isCustomTo,
      customLocation,
    });

    // Send confirmation DM to driver
    await sendDM(userId, {
      text: `Your ride ${rideId} has been posted!`,
      blocks: buildRidePostedConfirmation(rideData, matchingRequests.length)
    });

    // If there are matching requests, notify driver
    if (matchingRequests.length > 0) {
      await sendDM(userId, {
        text: `Found ${matchingRequests.length} matching requests!`,
        blocks: buildMatchesForDriver(rideData, matchingRequests)
      });
    }

    console.log('=== OFFER RIDE SUBMIT COMPLETED ===');

  } catch (error) {
    console.error('Error handling offer ride submit:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
  }
}

/**
 * Handle request ride modal submission
 */
export async function handleRequestRideSubmit(payload: any): Promise<void> {
  console.log('=== REQUEST RIDE SUBMIT STARTED ===');
  console.log('User ID:', payload.user.id);

  try {
    const userId = payload.user.id;
    const values = payload.view.state.values;

    // Extract form data
    const from = values.from_block.from_select.selected_option.value;
    const to = values.to_block.to_select.selected_option.value;
    const date = values.date_block.date_select.selected_date;
    const time = values.time_block.time_select.selected_time;
    const flexibilityMinutes = parseInt(values.flexibility_block.flexibility_select.selected_option.value);
    const notes = values.notes_block.notes_input.value || '';

    // Handle custom location
    const isCustomTo = to === 'custom';
    const customLocation = isCustomTo ? values.custom_location_block?.custom_location_input?.value : undefined;

    // Combine date and time, treating user input as Eastern Time
    const neededBy = parseEasternTime(date, time);

    // Validate (just log warnings, don't block)
    const validation = validateRideRequest({ from, to, neededBy, flexibility: flexibilityMinutes, notes, customLocation });
    if (!validation.valid) {
      console.warn('Validation warnings:', validation.errors);
    }

    // Get user info
    const userInfo = await getUserInfo(userId);

    // Generate request ID
    const requestId = generateRequestId();

    // Determine route track
    const routeTrack = getRouteTrack(to) || 'custom';

    // Create request object
    const requestData: any = {
      requestId,
      requesterId: userId,
      requesterName: userInfo.real_name,
      from,
      fromDisplay: getLocationDisplay(from),
      to,
      toDisplay: isCustomTo ? customLocation! : getLocationDisplay(to),
      isCustomTo,
      routeTrack,
      neededBy: Timestamp.fromDate(neededBy),
      flexibilityMinutes,
      status: 'open' as const,
      notes,
      createdAt: Timestamp.now(),
    };

    if (customLocation) {
      requestData.customLocation = customLocation;
    }

    // Create request in Firestore
    await createRideRequest(requestData);

    // Find matching rides
    const matchingRides = await findMatchingRides({
      from,
      to,
      neededBy: Timestamp.fromDate(neededBy),
      flexibilityMinutes,
      isCustomTo,
      customLocation,
    });

    // Send confirmation DM to requester
    await sendDM(userId, {
      text: `Your request ${requestId} has been posted!`,
      blocks: buildRequestPostedConfirmation(requestData, matchingRides.length)
    });

    // If matches found, DM them to the requester
    if (matchingRides.length > 0) {
      await sendDM(userId, {
        text: `Found ${matchingRides.length} matching rides!`,
        blocks: buildMatchesForRequester(matchingRides)
      });
    }

    // Always post to #shuttle channel so the request is visible to drivers
    await postToChannel({
      channel: config.slack.shuttleChannel,
      text: `New ride request: ${from} → ${to}`,
      blocks: buildRequestAnnouncement(requestData)
    });

    console.log('=== REQUEST RIDE SUBMIT COMPLETED ===');

  } catch (error) {
    console.error('Error handling request ride submit:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
  }
}
