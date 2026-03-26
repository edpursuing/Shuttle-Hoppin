# Hoppin' — Project Context for Claude Code

## What Is This Project?

Hoppin' is a ride-sharing coordination web app for ~100 Pursuit fellows commuting to and from Pursuit HQ in Long Island City, Queens. It connects drivers with available seats to riders heading to nearby transit hubs (subway/rail stations).

The project has **two coexisting interfaces** sharing the same Firebase backend and Firestore database:

1. **Legacy Slack App ("The Shuttle")** — slash commands (`/offer-ride`, `/request-ride`) that create and manage rides through Slack modals and channel posts. This is the original prototype, functional but limited in UX.

2. **Hoppin' Web App (primary)** — a React SPA with an MTA subway sign-inspired design. This is the portfolio-quality product being built on top of the same Firestore data.

Both interfaces read and write the same Firestore collections. A ride created via Slack appears on the web board in real-time, and a ride booked through the web app can trigger a Slack DM to the driver.

## Reference Documents (READ BEFORE MAKING ARCHITECTURAL DECISIONS)

These files contain the authoritative product and technical specifications:

- **`docs/PRD-v1.1.docx`** — Product Requirements Document. Defines features, phased roadmap, user flows, stops/routing model, and design direction.
- **`docs/TDD-v1.0.docx`** — Technical Design Document. Defines authentication flow, Firestore schemas, Cloud Functions API contracts, frontend architecture, ride lifecycle rules, and testing strategy.
- **`docs/design-reference.html`** — Visual design specifications. Contains exact HTML/CSS mockups with pixel-level measurements, color tokens, and component patterns. **This is the visual source of truth for all UI implementation.**

When in doubt about a product decision, check the PRD. When in doubt about a technical decision, check the TDD. When in doubt about how something should look, check the design reference.

## Tech Stack

### Frontend (Hoppin' Web App)
- **React 18+** with **Vite** as the build tool
- **Tailwind CSS** for styling (utility classes + custom design tokens)
- **@headlessui/react** for accessible modals, dropdowns, transitions
- **React Router v6** for URL-based routing with deep link support
- **Zustand** for global state (auth, UI preferences)
- **Custom hooks** wrapping Firestore `onSnapshot` listeners for real-time data
- **Vitest** + **React Testing Library** for tests

### Backend (Shared)
- **Firebase Cloud Functions** (TypeScript, Node.js 20)
- **Cloud Firestore** (real-time database)
- **Firebase Auth** (custom tokens via Slack OAuth)
- **Firebase Hosting** (SPA serving)

### External Integrations
- **Slack OAuth** for authentication (web app)
- **Slack Bot API** for DM notifications
- **Slack slash commands** (legacy interface)

## Project Structure

```
hoppin/
  CLAUDE.md              ← You are here
  CONVENTIONS.md         ← Code-level conventions
  docs/
    PRD-v1.1.docx
    TDD-v1.0.docx
    design-reference.html
  src/                   ← React frontend (Vite)
    components/
    hooks/
    pages/
    stores/
    utils/
    App.tsx
    main.tsx
  functions/
    src/
      legacy/            ← Existing Slack handlers (DO NOT MODIFY without discussion)
      auth/              ← Slack OAuth callback, token exchange
      rides/             ← Callable functions: offerRide, bookRide, cancelBooking, etc.
      notifications/     ← Slack DM delivery
      users/             ← Profile management, onboarding
      utils/             ← Shared utilities (Firestore helpers, Slack client, validation)
      index.ts           ← Re-exports all functions (legacy + new)
    package.json
  firebase.json
  firestore.rules
  firestore.indexes.json
  package.json           ← Frontend package.json
  vite.config.ts
  tailwind.config.ts
  tsconfig.json
```

## Critical Architectural Rules

These decisions are final. Do not deviate from them without explicit instruction.

1. **Reads are client-side.** The React app reads from Firestore directly via `onSnapshot` listeners. This gives real-time updates. Never route reads through Cloud Functions.

2. **Writes go through Cloud Functions.** All data mutations (creating rides, booking seats, cancelling, updating status) use Firebase callable functions. Never write to Firestore directly from the client (except user profile updates via security rules).

3. **Riders are an array on the ride document.** Not a subcollection. Booking is an atomic transaction: read ride → validate seats → append to array → decrement availableSeats → all in one transaction.

4. **No overlapping bookings within 30 minutes.** The `bookRide` function must check the user's active rides before confirming. Server-side validation, not client-side.

5. **Auto-expire rides 1 hour after departure.** A scheduled function (`expireRides`) runs every 15 minutes and transitions stale rides to "completed."

6. **Slack notifications are DMs only (Phase 1).** When a ride is created, DM users whose `defaultStop` matches. No channel posting from the web app. The legacy Slack handlers can still post to their channel.

7. **Legacy Slack handlers are preserved.** The `functions/src/legacy/` directory contains the original slash command and modal handlers. They continue to work alongside the new callable functions. Both write to the same Firestore collections using the same document schema.

8. **Domain-grouped function organization.** Functions are organized by domain (auth, rides, notifications, users, utils), not by type. The root `index.ts` re-exports everything.

## Design Language

Hoppin' uses an **MTA subway sign aesthetic**:

- Ride cards have dark backgrounds (`#1A1A1A`) with white text
- Transit line badges use official MTA colors (see design-reference.html for exact hex values)
- FROM/TO layout pattern mirrors real subway signage
- "Ride Now" urgent cards have a 3px amber (`#EF9F27`) left border
- Primary action color is `#2E86C1` (blue)
- Slack-related actions use `#4A154B` (Slack purple)

**The design-reference.html file is the pixel-level source of truth.** When implementing any UI component, cross-reference it against that file for exact colors, sizes, spacing, and structure.

The subway station card component has a **separate dedicated design prompt** provided by the developer. That prompt takes priority over the general design reference for station card rendering specifically.

## Firestore Collections (Shared by Both Interfaces)

- **`users`** — Public profile, stats, preferences (doc ID = Slack user ID)
- **`users/{id}/private`** — Slack access token, sensitive data (locked to owning user)
- **`rides`** — Ride offers with embedded riders array (auto-generated IDs)
- **`stops`** — Static reference data: station names, lines, coordinates (seeded via script)
- **`cancellations`** — Cancellation records for reliability scoring

See the TDD Section 4 for complete field-level schemas.

## Routes (Web App)

| Path | Component | Auth Required |
|------|-----------|---------------|
| `/` | Redirect | No (→ /board or /login) |
| `/login` | LoginPage | No |
| `/onboarding` | OnboardingFlow | Yes |
| `/board` | RideBoard | Yes |
| `/ride/:rideId` | RideDetail | Yes (deep-linkable from Slack) |
| `/offer` | OfferRide | Yes (requires hasCar) |
| `/profile` | ProfilePage | Yes |

## Commands

```bash
# Development
npm run dev              # Start Vite dev server
npm run emulators        # Start Firebase emulators

# Deployment
npm run deploy           # Deploy everything (hosting + functions)
npm run deploy:functions # Deploy Cloud Functions only
npm run deploy:hosting   # Deploy frontend only

# Testing
npm run test             # Run all tests (Vitest)
npm run test:functions   # Run Cloud Function tests only
npm run test:ui          # Run frontend component tests only

# Utilities
npm run seed             # Seed stops collection in Firestore
npm run lint             # Run ESLint
```

## What Phase Are We In?

**Phase 1 — The Core Loop.** Goal: a fellow can open the app and get a ride.

Phase 1 features:
- Live ride board with real-time Firestore updates
- "Ride Now" vs "Ride Later" modes
- Slack smart notifications (DMs with deep links)
- Onboarding flow (pick stop, departure window, car access, notification prefs)
- Offer a ride + book a ride flows
- Driver status updates
- Mobile + desktop responsive layouts

Phase 2 and Phase 3 features are documented in the PRD but are NOT being built yet.
