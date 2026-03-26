/**
 * Main Slack Interaction Handler (Legacy)
 *
 * Routes all incoming Slack requests to appropriate handlers
 */

import { Request, Response } from 'firebase-functions';
import { handleOfferRide, handleRequestRide, handleCancelRide } from './slashCommands';
import { handleOfferRideSubmit, handleRequestRideSubmit } from './modalHandler';
import { handleButtonAction } from './actionHandler';

/**
 * Main entry point for all Slack interactions
 */
export async function handleSlackInteraction(req: Request, res: Response): Promise<void> {
  try {
    let payload: any;

    if (req.body.payload) {
      // Interactive components (buttons, modals)
      payload = JSON.parse(req.body.payload);
    } else {
      // Slash commands
      payload = req.body;
    }

    console.log('=== SLACK INTERACTION RECEIVED ===');
    console.log('Type:', payload.type || payload.command);
    console.log('User:', payload.user?.id || payload.user_id);

    if (payload.command) {
      await handleSlashCommand(payload, res);
    } else if (payload.type === 'view_submission') {
      await handleModalSubmission(payload, res);
    } else if (payload.type === 'block_actions') {
      await handleBlockActions(payload, res);
    } else {
      console.warn('Unknown interaction type:', payload.type);
      res.status(200).json({ text: 'Unknown interaction type' });
    }

  } catch (error) {
    console.error('Error handling Slack interaction:', error);
    console.error('Full error:', JSON.stringify(error, null, 2));
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleSlashCommand(payload: any, res: Response): Promise<void> {
  const command = payload.command;

  console.log('=== SLASH COMMAND ===');
  console.log('Command:', command);

  // Acknowledge immediately (Slack requires response within 3 seconds)
  res.status(200).send();

  try {
    switch (command) {
      case '/offer-ride':
        await handleOfferRide(payload);
        break;
      case '/request-ride':
        await handleRequestRide(payload);
        break;
      case '/cancel-ride':
        await handleCancelRide(payload);
        break;
      default:
        console.warn('Unknown command:', command);
    }
  } catch (error) {
    console.error('Error handling slash command:', error);
    console.error('Full error:', JSON.stringify(error, null, 2));
  }
}

async function handleModalSubmission(payload: any, res: Response): Promise<void> {
  const callbackId = payload.view?.callback_id;

  console.log('=== MODAL SUBMISSION ===');
  console.log('Callback ID:', callbackId);
  console.log('User:', payload.user?.id);

  // Acknowledge immediately
  res.status(200).json({ response_action: 'clear' });

  try {
    switch (callbackId) {
      case 'offer_ride_modal':
        await handleOfferRideSubmit(payload);
        break;
      case 'request_ride_modal':
        await handleRequestRideSubmit(payload);
        break;
      default:
        console.warn('Unknown modal callback:', callbackId);
    }
  } catch (error) {
    console.error('Error processing modal submission:', error);
    console.error('Full error:', JSON.stringify(error, null, 2));
  }
}

async function handleBlockActions(payload: any, res: Response): Promise<void> {
  console.log('=== BUTTON ACTION ===');
  console.log('Action:', payload.actions?.[0]?.action_id);

  // Acknowledge immediately
  res.status(200).send();

  try {
    await handleButtonAction(payload);
  } catch (error) {
    console.error('Error handling button action:', error);
    console.error('Full error:', JSON.stringify(error, null, 2));
  }
}
