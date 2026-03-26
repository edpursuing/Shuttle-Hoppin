/**
 * Slash Command Handlers (Legacy)
 *
 * Handles /offer-ride, /request-ride, /cancel-ride commands
 */

import { openModal } from '../utils/slack';
import { buildOfferRideModal, buildRequestRideModal } from './templates/modals';

export async function handleOfferRide(payload: any): Promise<void> {
  try {
    const triggerId = payload.trigger_id;

    const modal = buildOfferRideModal();

    console.log('=== OFFER RIDE MODAL ===');
    console.log(JSON.stringify(modal, null, 2));
    console.log('=== END MODAL ===');

    await openModal(triggerId, modal);

  } catch (error) {
    console.error('Error handling /offer-ride:', error);
    throw error;
  }
}

/**
 * Handle /request-ride command
 */
export async function handleRequestRide(payload: any): Promise<void> {
  try {
    const triggerId = payload.trigger_id;
    const modal = buildRequestRideModal();
    await openModal(triggerId, modal);
  } catch (error) {
    console.error('Error handling /request-ride:', error);
    throw error;
  }
}

/**
 * Handle /cancel-ride command
 */
export async function handleCancelRide(payload: any): Promise<void> {
  try {
    // TODO: Phase 2 - Implement cancellation flow
    console.log('Cancel ride command:', payload);
  } catch (error) {
    console.error('Error handling /cancel-ride:', error);
    throw error;
  }
}
