/**
 * Modal Templates (Legacy)
 *
 * Slack modal (dialog) definitions for user input
 */

import {
  PICKUP_LOCATIONS,
  DROPOFF_LOCATIONS,
  FLEXIBILITY_OPTIONS,
} from '../../utils/config';


export function buildOfferRideModal(): any {
  return {
    type: 'modal',
    callback_id: 'offer_ride_modal',
    title: { type: 'plain_text', text: '🚗 Offer a Ride' },
    submit: { type: 'plain_text', text: 'Post Ride' },
    close: { type: 'plain_text', text: 'Cancel' },
    blocks: [
      {
        type: 'input',
        block_id: 'from_block',
        label: { type: 'plain_text', text: '📍 Pickup Location' },
        element: {
          type: 'static_select',
          action_id: 'from_select',
          initial_option: {
            text: { type: 'plain_text', text: PICKUP_LOCATIONS[0].label },
            value: PICKUP_LOCATIONS[0].value
          },
          options: PICKUP_LOCATIONS.map(loc => ({
            text: { type: 'plain_text', text: loc.label },
            value: loc.value
          }))
        }
      },
      {
        type: 'input',
        block_id: 'to_block',
        label: { type: 'plain_text', text: '🎯 Destination' },
        element: {
          type: 'static_select',
          action_id: 'to_select',
          placeholder: { type: 'plain_text', text: 'Choose destination' },
          options: DROPOFF_LOCATIONS.map(loc => ({
            text: { type: 'plain_text', text: loc.label },
            value: loc.value
          }))
        }
      },
      {
        type: 'input',
        block_id: 'date_block',
        label: { type: 'plain_text', text: '📅 Departure Date' },
        element: {
          type: 'datepicker',
          action_id: 'date_select',
          initial_date: new Date().toISOString().split('T')[0],
          placeholder: { type: 'plain_text', text: 'Select date' }
        }
      },
      {
        type: 'input',
        block_id: 'time_block',
        label: { type: 'plain_text', text: '🕐 Departure Time' },
        element: {
          type: 'timepicker',
          action_id: 'time_select',
          initial_time: '15:00',
          placeholder: { type: 'plain_text', text: 'Select time' }
        },
        hint: { type: 'plain_text', text: 'When will you leave the pickup location?' }
      },
      {
        type: 'input',
        block_id: 'capacity_block',
        label: { type: 'plain_text', text: '👥 Available Seats' },
        element: {
          type: 'static_select',
          action_id: 'capacity_select',
          initial_option: { text: { type: 'plain_text', text: '4 seats' }, value: '4' },
          options: [
            { text: { type: 'plain_text', text: '1 seat' }, value: '1' },
            { text: { type: 'plain_text', text: '2 seats' }, value: '2' },
            { text: { type: 'plain_text', text: '3 seats' }, value: '3' },
            { text: { type: 'plain_text', text: '4 seats' }, value: '4' },
            { text: { type: 'plain_text', text: '5 seats' }, value: '5' },
            { text: { type: 'plain_text', text: '6 seats' }, value: '6' },
            { text: { type: 'plain_text', text: '7 seats' }, value: '7' },
            { text: { type: 'plain_text', text: '8 seats' }, value: '8' }
          ]
        },
        hint: { type: 'plain_text', text: 'How many passengers can you take? (not including yourself)' }
      },
      {
        type: 'input',
        block_id: 'ontheway_block',
        optional: true,
        label: { type: 'plain_text', text: '🛣️ Multi-Stop Options' },
        element: {
          type: 'checkboxes',
          action_id: 'ontheway_check',
          options: [
            {
              text: { type: 'plain_text', text: 'I\'m willing to drop off passengers at stops along the way' },
              description: { type: 'plain_text', text: 'Adds ~3-5 min per stop. Increases chances of filling seats!' },
              value: 'allow_ontheway'
            }
          ]
        }
      },
      {
        type: 'input',
        block_id: 'notes_block',
        optional: true,
        label: { type: 'plain_text', text: '📝 Additional Notes (Optional)' },
        element: {
          type: 'plain_text_input',
          action_id: 'notes_input',
          multiline: true,
          placeholder: { type: 'plain_text', text: 'e.g., "Meeting at the main entrance", "I have trunk space for luggage"' },
          max_length: 500
        }
      },
      { type: 'divider' },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: '💡 *Tip:* Your ride will be posted to #shuttle and matching requests will be notified automatically.' }]
      }
    ]
  };
}

/**
 * Build the "Request Ride" modal
 */
export function buildRequestRideModal(): any {
  return {
    type: 'modal',
    callback_id: 'request_ride_modal',
    title: { type: 'plain_text', text: '🙋 Request a Ride' },
    submit: { type: 'plain_text', text: 'Submit Request' },
    close: { type: 'plain_text', text: 'Cancel' },
    blocks: [
      {
        type: 'input',
        block_id: 'from_block',
        label: { type: 'plain_text', text: '📍 Pickup Location' },
        element: {
          type: 'static_select',
          action_id: 'from_select',
          initial_option: {
            text: { type: 'plain_text', text: PICKUP_LOCATIONS[0].label },
            value: PICKUP_LOCATIONS[0].value
          },
          options: PICKUP_LOCATIONS.map(loc => ({
            text: { type: 'plain_text', text: loc.label },
            value: loc.value
          }))
        }
      },
      {
        type: 'input',
        block_id: 'to_block',
        label: { type: 'plain_text', text: '🎯 Destination' },
        element: {
          type: 'static_select',
          action_id: 'to_select',
          placeholder: { type: 'plain_text', text: 'Choose destination' },
          options: DROPOFF_LOCATIONS.map(loc => ({
            text: { type: 'plain_text', text: loc.label },
            value: loc.value
          }))
        }
      },
      {
        type: 'input',
        block_id: 'date_block',
        label: { type: 'plain_text', text: '📅 Needed By (Date)' },
        element: {
          type: 'datepicker',
          action_id: 'date_select',
          initial_date: new Date().toISOString().split('T')[0]
        }
      },
      {
        type: 'input',
        block_id: 'time_block',
        label: { type: 'plain_text', text: '🕐 Needed By (Time)' },
        element: {
          type: 'timepicker',
          action_id: 'time_select',
          initial_time: '15:00'
        },
        hint: { type: 'plain_text', text: 'When do you need to arrive at your destination?' }
      },
      {
        type: 'input',
        block_id: 'flexibility_block',
        label: { type: 'plain_text', text: '⏰ How flexible are you with timing?' },
        element: {
          type: 'static_select',
          action_id: 'flexibility_select',
          initial_option: { text: { type: 'plain_text', text: '±30 minutes' }, value: '30' },
          options: FLEXIBILITY_OPTIONS.map(opt => ({
            text: { type: 'plain_text', text: opt.label },
            value: String(opt.value)
          }))
        },
        hint: { type: 'plain_text', text: 'More flexibility = more matching rides!' }
      },
      {
        type: 'input',
        block_id: 'notes_block',
        optional: true,
        label: { type: 'plain_text', text: '📝 Additional Notes (Optional)' },
        element: {
          type: 'plain_text_input',
          action_id: 'notes_input',
          multiline: true,
          placeholder: { type: 'plain_text', text: 'e.g., "Running late for train", "I have luggage"' },
          max_length: 500
        }
      },
      { type: 'divider' },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: '💡 *Tip:* I\'ll search for matching rides and notify you immediately if any are found!' }]
      }
    ]
  };
}

/**
 * Build destination selection modal (for when clicking "Request Seat" on multi-stop ride)
 */
export function buildDestinationSelectModal(
  rideId: string,
  availableStops: Array<{ value: string; label: string }>
): any {
  return {
    type: 'modal',
    callback_id: 'destination_select_modal',
    private_metadata: rideId,
    title: { type: 'plain_text', text: 'Choose Your Stop' },
    submit: { type: 'plain_text', text: 'Confirm' },
    close: { type: 'plain_text', text: 'Cancel' },
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `You're requesting a seat on ride *${rideId}*` }
      },
      {
        type: 'input',
        block_id: 'destination_block',
        label: { type: 'plain_text', text: 'Where should the driver drop you off?' },
        element: {
          type: 'static_select',
          action_id: 'destination_select',
          placeholder: { type: 'plain_text', text: 'Choose your stop' },
          options: availableStops.map(stop => ({
            text: { type: 'plain_text', text: stop.label },
            value: stop.value
          }))
        }
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: '💡 The driver will be notified and can approve your request.' }]
      }
    ]
  };
}
