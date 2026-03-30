/**
 * sendRideNotification
 *
 * Called after a ride is created via offerRide. DMs any user whose
 * defaultStop matches the ride's stopId and who has instant Slack DMs enabled.
 * The driver is excluded from notifications about their own ride.
 */

import { getFirestore } from 'firebase-admin/firestore'
import { sendDM } from '../utils/slack'

interface RideData {
  rideId:        string
  driverId:      string
  driverName:    string
  direction:     'to-hq' | 'from-hq'
  stopId:        string
  stopName:      string
  customLocation: string | null
  departureTime: FirebaseFirestore.Timestamp
  totalSeats:    number
}

function formatDepartureTime(ts: FirebaseFirestore.Timestamp): string {
  return ts.toDate().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour:    'numeric',
    minute:  '2-digit',
  })
}

function buildRideBlocks(ride: RideData): any[] {
  const appUrl    = 'https://pursuit-shuttle.web.app'
  const rideUrl   = `${appUrl}/ride/${ride.rideId}`
  const fromLabel = ride.direction === 'from-hq' ? 'Pursuit HQ' : (ride.customLocation ?? ride.stopName)
  const toLabel   = ride.direction === 'from-hq' ? (ride.customLocation ?? ride.stopName) : 'Pursuit HQ'

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*New ride posted by ${ride.driverName}*\n` +
              `*From:* ${fromLabel}\n` +
              `*To:* ${toLabel}\n` +
              `*Departs:* ${formatDepartureTime(ride.departureTime)}\n` +
              `*Seats available:* ${ride.totalSeats}`,
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type:      'button',
          text:      { type: 'plain_text', text: 'View ride' },
          style:     'primary',
          url:       rideUrl,
          action_id: 'view_ride',
        },
      ],
    },
  ]
}

export async function sendRideNotification(ride: RideData): Promise<void> {
  const db = getFirestore()

  // Find users with matching defaultStop, instant DMs enabled, excluding the driver
  const usersSnap = await db.collection('users')
    .where('defaultStop', '==', ride.stopId)
    .where('notificationPrefs.slackDMs', '==', true)
    .where('notificationPrefs.frequency', '==', 'instant')
    .get()

  if (usersSnap.empty) return

  const blocks   = buildRideBlocks(ride)
  const fallback = `New ride from ${ride.driverName} — view at https://pursuit-shuttle.web.app/ride/${ride.rideId}`

  const sends = usersSnap.docs
    .filter(doc => doc.id !== ride.driverId)
    .map(doc =>
      sendDM(doc.data().slackId, { text: fallback, blocks }).catch(err =>
        console.error(`Failed to DM user ${doc.id}:`, err)
      )
    )

  await Promise.all(sends)
}
