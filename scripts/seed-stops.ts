/**
 * Seed script — populates the Firestore `stops` collection.
 *
 * Run with: npm run seed
 *
 * Requires Application Default Credentials. If you haven't set them up:
 *   gcloud auth application-default login
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

initializeApp({
  credential: applicationDefault(),
  projectId: 'pursuit-shuttle',
})

const db = getFirestore()

const stops = [
  {
    name: 'Hunters Point Av',
    shortName: 'Hunters Pt',
    lines: [
      { name: '7',    color: '#6E3A90', textColor: '#FFFFFF' },
      { name: 'LIRR', color: '#555555', textColor: '#FFFFFF' },
    ],
    sequenceOrder: 1,
    visualGroup: null,
    latitude: 40.7442,
    longitude: -73.9484,
    isSpecial: false,
  },
  {
    name: '21 St',
    shortName: '21 St',
    lines: [
      { name: 'G', color: '#6CBE45', textColor: '#FFFFFF' },
    ],
    sequenceOrder: 2,
    visualGroup: 'Court Square area',
    latitude: 40.7443,
    longitude: -73.9494,
    isSpecial: false,
  },
  {
    name: 'Court Square \u2013 23 St',
    shortName: 'Court Sq',
    lines: [
      { name: 'E', color: '#0039A6', textColor: '#FFFFFF' },
      { name: 'G', color: '#6CBE45', textColor: '#FFFFFF' },
      { name: 'M', color: '#FF6319', textColor: '#FFFFFF' },
      { name: '7', color: '#6E3A90', textColor: '#FFFFFF' },
    ],
    sequenceOrder: 3,
    visualGroup: 'Court Square area',
    latitude: 40.7472,
    longitude: -73.9459,
    isSpecial: false,
  },
  {
    name: '21 St \u2013 Queensbridge',
    shortName: 'Queensbridge',
    lines: [
      { name: 'F', color: '#FF6319', textColor: '#FFFFFF' },
      { name: 'M', color: '#FF6319', textColor: '#FFFFFF' },
    ],
    sequenceOrder: 4,
    visualGroup: null,
    latitude: 40.7519,
    longitude: -73.9426,
    isSpecial: false,
  },
  {
    name: 'Queensboro Plaza',
    shortName: 'Queensboro',
    lines: [
      { name: '7', color: '#6E3A90', textColor: '#FFFFFF' },
      { name: 'N', color: '#FCCC0A', textColor: '#1A1A1A' },
      { name: 'W', color: '#FCCC0A', textColor: '#1A1A1A' },
    ],
    sequenceOrder: 5,
    visualGroup: null,
    latitude: 40.7502,
    longitude: -73.9440,
    isSpecial: false,
  },
  {
    name: "McDonald's",
    shortName: "McDonald's",
    lines: [],
    sequenceOrder: 99,
    visualGroup: null,
    latitude: 40.7448,
    longitude: -73.9503,
    isSpecial: true,
  },
]

const stopIds = [
  'hunters-point',
  '21-st',
  'court-square',
  'queensbridge',
  'queensboro-plaza',
  'mcdonalds',
]

async function seed() {
  console.log('Seeding stops collection...')
  const batch = db.batch()

  stops.forEach((stop, i) => {
    const ref = db.collection('stops').doc(stopIds[i])
    batch.set(ref, stop)
    console.log(`  queued: ${stopIds[i]}`)
  })

  await batch.commit()
  console.log(`\nDone — ${stops.length} stops written to Firestore.`)
}

seed().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
