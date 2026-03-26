# Hoppin

A ride-sharing coordination app for Pursuit fellows commuting to and from Pursuit HQ in Long Island City, Queens.

Hoppin connects drivers who have available seats with riders heading to nearby transit hubs. It has two coexisting interfaces that share the same Firebase backend:

1. **Legacy Slack App** — slash commands (`/offer-ride`, `/request-ride`) that create and manage rides through Slack modals and channel posts in `#shuttle`.
2. **Hoppin Web App** (in development) — a React SPA with an MTA subway sign-inspired design, built on top of the same Firestore database.

A ride created via Slack appears on the web board in real time. A booking made through the web app triggers a Slack DM to the driver.

---

## Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS with custom MTA design tokens
- React Router v6
- Zustand for global state
- Vitest + React Testing Library

### Backend
- Firebase Cloud Functions (TypeScript, Node.js 20)
- Cloud Firestore
- Firebase Auth (custom tokens via Slack OAuth)
- Firebase Hosting

### Integrations
- Slack OAuth (web app authentication)
- Slack Bot API (DM notifications, slash commands, modals)

---

## Project Structure

```
shuttle/
  CLAUDE.md              Project context for Claude Code
  CONVENTIONS.md         Code conventions and patterns
  docs/
    PRD-v1.1.docx        Product Requirements Document
    TDD-v1.0.docx        Technical Design Document
    design-reference.html  Visual design source of truth (HTML/CSS mockups)
  functions/
    src/
      index.ts           Cloud Function entry point
      legacy/            Slack slash command and button handlers
        slackHandler.ts
        slashCommands.ts
        modalHandler.ts
        actionHandler.ts
        channels.ts
        matching.ts
        templates/
      auth/              Slack OAuth callback (Phase 1)
      rides/             Callable functions: offerRide, bookRide, etc. (Phase 1)
      notifications/     Slack DM delivery (Phase 1)
      users/             Profile and onboarding (Phase 1)
      utils/             Shared: Firestore, Slack client, config, formatting
  firebase.json
  firestore.rules
  firestore.indexes.json
```

---

## Development Setup

### Prerequisites

- Node.js 20
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project with Firestore and Cloud Functions enabled
- A Slack app with bot token, signing secret, and slash commands configured

### Environment Variables

Cloud Functions use `firebase functions:config` for environment variables:

```bash
firebase functions:config:set \
  slack.bot_token="xoxb-..." \
  slack.signing_secret="..." \
  slack.app_id="..." \
  slack.shuttle_channel="shuttle"
```

For local development, create `functions/.env` with the same values (already gitignored).

### Install Dependencies

```bash
cd functions && npm install
```

### Run Locally

```bash
# Start Firebase emulators
firebase emulators:start --only functions

# Build TypeScript (watch mode)
cd functions && npm run build -- --watch
```

---

## Deployment

```bash
# Deploy Cloud Functions only
firebase deploy --only functions

# Deploy frontend hosting only
firebase deploy --only hosting

# Deploy everything
firebase deploy
```

---

## Slack Commands

| Command | Description |
|---------|-------------|
| `/offer-ride` | Open a modal to post a ride offer |
| `/request-ride` | Open a modal to post a ride request |
| `/cancel-ride` | Cancel an active ride (Phase 2) |

Ride announcements posted to `#shuttle` include interactive buttons:
- **Request Seat** — books a seat and notifies the driver
- **Message Driver** — sends a deep link to open a DM with the driver

---

## Firestore Collections

| Collection | Description |
|------------|-------------|
| `rides` | Ride offers with embedded `riders` array |
| `rideRequests` | Ride requests posted by fellows |
| `users` | Public profile, stats, onboarding state |
| `users/{id}/private` | Slack tokens and sensitive data |
| `stops` | Static station reference data (seeded) |
| `cancellations` | Records for reliability scoring |

---

## Architectural Rules

- **Reads are client-side.** The React app reads from Firestore directly via `onSnapshot`. Never route reads through Cloud Functions.
- **Writes go through Cloud Functions.** All data mutations use Firebase callable functions. Never write to Firestore from the client (except user profile updates).
- **Riders are an array on the ride document**, not a subcollection. Booking is an atomic Firestore transaction.
- **No overlapping bookings within 30 minutes.** Validated server-side in `bookRide`.
- **Legacy handlers live in `functions/src/legacy/`** and are not modified for new features — bug fixes only.

---

## Phase Roadmap

**Phase 0 (complete)** — Legacy Slack fixes and function restructure for web app coexistence.

**Phase 1 (in progress)** — Core web app loop: live ride board, offer/book flows, Slack smart notifications, onboarding, driver status updates.

**Phase 2** — Recurring rides, rating system, departure reminders.

**Phase 3** — Analytics dashboard, admin tools, mobile PWA.
