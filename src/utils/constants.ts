import type { Stop } from './types'

export const MTA_COLORS: Record<string, { bg: string; text: string }> = {
  '7':    { bg: '#6E3A90', text: '#FFFFFF' },
  'E':    { bg: '#0039A6', text: '#FFFFFF' },
  'F':    { bg: '#FF6319', text: '#FFFFFF' },
  'M':    { bg: '#FF6319', text: '#FFFFFF' },
  'N':    { bg: '#FCCC0A', text: '#1A1A1A' },
  'W':    { bg: '#FCCC0A', text: '#1A1A1A' },
  'G':    { bg: '#6CBE45', text: '#FFFFFF' },
  'LIRR': { bg: '#555555', text: '#FFFFFF' },
}

// Static stop data matching the Firestore stops collection (TDD Section 11)
// Pursuit HQ is the anchor point — not stored as a stop, hardcoded here
export const PURSUIT_HQ = {
  id: 'pursuit-hq',
  name: 'Pursuit HQ',
  shortName: 'Pursuit HQ',
}

export const STOPS: Omit<Stop, 'latitude' | 'longitude'>[] = [
  {
    id: 'hunters-point',
    name: 'Hunters Point Av',
    shortName: 'Hunters Pt',
    lines: [
      { name: '7',    color: '#6E3A90', textColor: '#FFFFFF' },
      { name: 'LIRR', color: '#555555', textColor: '#FFFFFF' },
    ],
    sequenceOrder: 1,
    visualGroup: null,
    isSpecial: false,
  },
  {
    id: '21-st',
    name: '21 St',
    shortName: '21 St',
    lines: [
      { name: 'G', color: '#6CBE45', textColor: '#FFFFFF' },
    ],
    sequenceOrder: 2,
    visualGroup: 'Court Square area',
    isSpecial: false,
  },
  {
    id: 'court-square',
    name: 'Court Square \u2013 23 St',
    shortName: 'Court Sq',
    lines: [
      { name: 'E', color: '#0039A6', textColor: '#FFFFFF' },
      { name: 'M', color: '#FF6319', textColor: '#FFFFFF' },
      { name: '7', color: '#6E3A90', textColor: '#FFFFFF' },
    ],
    sequenceOrder: 3,
    visualGroup: 'Court Square area',
    isSpecial: false,
  },
  {
    id: 'queensbridge',
    name: '21 St \u2013 Queensbridge',
    shortName: 'Queensbridge',
    lines: [
      { name: 'F', color: '#FF6319', textColor: '#FFFFFF' },
      { name: 'M', color: '#FF6319', textColor: '#FFFFFF' },
    ],
    sequenceOrder: 4,
    visualGroup: null,
    isSpecial: false,
  },
  {
    id: 'queensboro-plaza',
    name: 'Queensboro Plaza',
    shortName: 'Queensboro',
    lines: [
      { name: '7', color: '#6E3A90', textColor: '#FFFFFF' },
      { name: 'N', color: '#FCCC0A', textColor: '#1A1A1A' },
      { name: 'W', color: '#FCCC0A', textColor: '#1A1A1A' },
    ],
    sequenceOrder: 5,
    visualGroup: null,
    isSpecial: false,
  },
  {
    id: 'mcdonalds',
    name: "McDonald's",
    shortName: "McDonald's",
    lines: [],
    sequenceOrder: 99,
    visualGroup: null,
    isSpecial: true,
  },
]
