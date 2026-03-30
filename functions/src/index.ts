/**
 * Main Entry Point
 *
 * Re-exports all Cloud Functions — legacy Slack handlers and (later) new callable functions.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { handleSlackInteraction } from './legacy/slackHandler';
import { slackOAuthCallback } from './auth/slackOAuthCallback';
import { completeOnboarding } from './users/completeOnboarding';
import { offerRide } from './rides/offerRide'
import { bookRide } from './rides/bookRide'
import { cancelBooking } from './rides/cancelBooking'
import { updateDriverStatus } from './rides/updateDriverStatus';

// Initialize Firebase Admin
// serviceAccountId is required in Cloud Run (v2) so custom tokens are signed
// by the Firebase Admin SA rather than the default Compute SA.
admin.initializeApp({
  serviceAccountId: 'firebase-adminsdk-fbsvc@pursuit-shuttle.iam.gserviceaccount.com',
});

/**
 * Main HTTP endpoint for all Slack interactions
 * Handles: slash commands, button clicks, modal submissions
 */
export { slackOAuthCallback };
export { completeOnboarding };
export { offerRide };
export { bookRide };
export { cancelBooking };
export { updateDriverStatus };

export const slackHandler = functions.https.onRequest(async (req, res) => {
  try {
    await handleSlackInteraction(req, res);
  } catch (error) {
    console.error('Error in slackHandler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Scheduled function: Send departure reminders
 * Runs every 15 minutes to check for rides departing in ~1 hour
 *
 * TODO: Phase 2 - Implement reminder logic
 */
export const departureReminders = functions.pubsub
  .schedule('*/15 * * * *')
  .timeZone('America/New_York')
  .onRun(async (_context) => {
    console.log('Departure reminders triggered at:', new Date().toISOString());
    return null;
  });

/**
 * Scheduled function: Archive old rides
 * Runs daily at 2 AM to archive rides >24 hours past departure
 *
 * TODO: Phase 2 - Implement archival logic
 */
export const archiveRides = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('America/New_York')
  .onRun(async (_context) => {
    console.log('Archive rides triggered at:', new Date().toISOString());
    return null;
  });
