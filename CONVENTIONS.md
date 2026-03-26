# Hoppin' — Code Conventions

## Language & Runtime

- **TypeScript strict mode** everywhere (frontend and functions)
- **Node.js 20** for Cloud Functions runtime
- **ES2022** target for both frontend and functions
- **ESM imports** in frontend, **CommonJS** in Cloud Functions (Firebase requirement)

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files (components) | PascalCase | `RideCard.tsx`, `StopSelector.tsx` |
| Files (hooks) | camelCase with `use` prefix | `useRideBoard.ts`, `useAuth.ts` |
| Files (utilities) | camelCase | `validation.ts`, `formatTime.ts` |
| Files (Cloud Functions) | camelCase | `bookRide.ts`, `offerRide.ts` |
| React components | PascalCase | `export function RideCard()` |
| Custom hooks | camelCase with `use` prefix | `export function useRideBoard()` |
| Cloud Functions | camelCase | `export const bookRide = onCall(...)` |
| Zustand stores | camelCase with `use` prefix | `export const useAuthStore = create(...)` |
| Constants | UPPER_SNAKE_CASE | `const MTA_COLORS = {...}` |
| Types/Interfaces | PascalCase | `interface Ride {}`, `type Direction = ...` |
| Firestore field names | camelCase | `departureTime`, `availableSeats` |
| CSS classes (Tailwind) | kebab-case (Tailwind default) | `bg-[#1a1a1a] rounded-xl` |
| Route paths | kebab-case | `/ride/:rideId`, `/offer` |
| Stop document IDs | kebab-case slugs | `hunters-point`, `queensboro-plaza` |

## File Organization

### Frontend (`src/`)

```
src/
  components/
    shared/              # Reusable across pages
      RideCard.tsx
      MtaBadge.tsx
      DriverInfo.tsx
      StopSelector.tsx
      DirectionToggle.tsx
      DriverStatusBanner.tsx
    layout/
      AppLayout.tsx
      TopNav.tsx
      BottomNav.tsx
      ProtectedRoute.tsx
      OnboardingGuard.tsx
  hooks/
    useAuth.ts
    useRideBoard.ts
    useRideDetail.ts
    useUserProfile.ts
    useMyRides.ts
  pages/
    LoginPage.tsx
    OnboardingFlow.tsx
    RideBoard.tsx
    RideDetail.tsx
    OfferRide.tsx
    ProfilePage.tsx
  stores/
    authStore.ts         # Zustand: user, auth state
    uiStore.ts           # Zustand: direction filter, active stop filter
  utils/
    firebase.ts          # Firebase app initialization
    formatters.ts        # Date/time formatting helpers
    constants.ts         # MTA colors, stop data, app config
    types.ts             # Shared TypeScript types
  App.tsx                # Router setup
  main.tsx               # Entry point
```

### Cloud Functions (`functions/src/`)

```
functions/src/
  index.ts               # Re-exports all functions
  legacy/
    slackHandler.ts      # Original slash command handler
    modalHandler.ts      # Original modal submission handler
    actionHandler.ts     # Original button action handler
    templates/           # Slack Block Kit templates
  auth/
    slackOAuthCallback.ts
  rides/
    offerRide.ts
    bookRide.ts
    cancelBooking.ts
    cancelRide.ts
    updateDriverStatus.ts
    expireRides.ts
  notifications/
    sendRideNotification.ts
    notifyRideCancelled.ts
  users/
    updateProfile.ts
    completeOnboarding.ts
  utils/
    firestore.ts         # Lazy Firestore init (existing pattern)
    slack.ts             # Slack API client wrapper
    validation.ts        # Input validation helpers
    errors.ts            # Structured error helpers
```

## TypeScript Types

### Core types (define in `src/utils/types.ts` and `functions/src/utils/types.ts`)

```typescript
type Direction = "to-hq" | "from-hq";
type RideMode = "now" | "later";
type RideStatus = "open" | "in-progress" | "completed" | "cancelled";
type DriverStatus = "pending" | "on-my-way" | "at-pickup" | "running-late";

interface Rider {
  userId: string;
  displayName: string;
  avatarUrl: string;
  bookedAt: Timestamp;
}

interface Ride {
  driverId: string;
  driverName: string;
  driverAvatar: string;
  direction: Direction;
  stopId: string;
  stopName: string;
  customLocation: string | null;
  passingThrough: string | null;
  departureTime: Timestamp;
  mode: RideMode;
  totalSeats: number;
  availableSeats: number;
  status: RideStatus;
  driverStatus: DriverStatus;
  riders: Rider[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface UserProfile {
  slackId: string;
  displayName: string;
  avatarUrl: string;
  email: string;
  hasCar: boolean;
  defaultStop: string | null;
  departureWindow: { start: string; end: string } | null;
  notificationPrefs: {
    slackDMs: boolean;
    frequency: "instant" | "digest";
  };
  stats: {
    ridesGiven: number;
    ridesTaken: number;
    lateCancels: number;
  };
  onboardingComplete: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Stop {
  name: string;
  shortName: string;
  lines: { name: string; color: string; textColor: string }[];
  sequenceOrder: number;
  visualGroup: string | null;
  latitude: number;
  longitude: number;
  isSpecial: boolean;
}

interface Cancellation {
  userId: string;
  rideId: string;
  role: "driver" | "rider";
  cancelledAt: Timestamp;
  departureTime: Timestamp;
  minutesBefore: number;
  isLate: boolean;
}
```

## MTA Design Tokens

Define these in `tailwind.config.ts` under `theme.extend.colors`:

```typescript
mta: {
  '7': '#6E3A90',       // Purple - 7 train
  'e': '#0039A6',        // Blue - E train
  'f': '#FF6319',        // Orange - F/M trains
  'm': '#FF6319',        // Orange - F/M trains
  'n': '#FCCC0A',        // Yellow - N/W trains
  'w': '#FCCC0A',        // Yellow - N/W trains
  'g': '#6CBE45',        // Green - G train
  'lirr': '#555555',     // Gray - LIRR badge
},
hoppin: {
  'card': '#1A1A1A',     // Ride card background
  'action': '#2E86C1',   // Primary action blue
  'urgent': '#EF9F27',   // Ride Now amber accent
  'slack': '#4A154B',    // Slack purple
  'avatar': '#333333',   // Avatar background on dark cards
}
```

## Component Patterns

### Custom Hooks (Firestore Listeners)

Every data-fetching hook follows this pattern:

```typescript
export function useRideBoard(direction: Direction, stopFilter?: string) {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let q = query(
      collection(db, "rides"),
      where("status", "==", "open"),
      where("direction", "==", direction),
      orderBy("departureTime", "asc")
    );

    if (stopFilter) {
      q = query(q, where("stopId", "==", stopFilter));
    }

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        setRides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ride)));
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [direction, stopFilter]);

  return { rides, loading, error };
}
```

### Cloud Function Callables

Every callable follows this pattern:

```typescript
import { onCall, HttpsError } from "firebase-functions/v2/https";

export const bookRide = onCall(async (request) => {
  // 1. Validate auth
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in", { code: "auth/invalid" });
  }

  // 2. Validate input
  const { rideId } = request.data;
  if (!rideId) {
    throw new HttpsError("invalid-argument", "rideId is required", { code: "input/missing" });
  }

  // 3. Business logic in Firestore transaction
  try {
    await db.runTransaction(async (transaction) => {
      // ... atomic read + validate + write
    });
  } catch (error) {
    // 4. Structured error response
    throw new HttpsError("failed-precondition", "Booking failed", { code: "ride/full" });
  }

  // 5. Side effects (notifications)
  await sendRideNotification(/* ... */);

  return { success: true };
});
```

### Structured Error Handling (Frontend)

```typescript
try {
  const result = await httpsCallable(functions, "bookRide")({ rideId });
  // Success handling
} catch (error: any) {
  const code = error?.details?.code;
  switch (code) {
    case "ride/full":
      toast.error("This ride just filled up");
      break;
    case "ride/overlap":
      toast.error("You already have a ride around this time");
      break;
    default:
      toast.error("Something went wrong. Please try again.");
  }
}
```

## Testing Conventions

- Test files live next to the source file: `RideCard.tsx` → `RideCard.test.tsx`
- Cloud Function tests: `bookRide.ts` → `bookRide.test.ts`
- Use `describe` blocks grouped by function/component name
- Use `it` (not `test`) for test cases
- Mock Firestore and Slack API calls — never hit real services in tests
- Name test cases as behaviors: `it("rejects booking when ride is full")`

## Import Ordering

1. React / framework imports
2. Third-party libraries
3. Internal components
4. Internal hooks
5. Internal utilities / types
6. Styles / constants

Separate each group with a blank line.

## Git Conventions

- **Branch naming:** `feature/ride-board`, `fix/booking-overlap`, `chore/seed-stops`
- **Commit messages:** imperative mood, lowercase: `add ride board with real-time updates`
- **PR descriptions:** reference the PRD/TDD section being implemented
- The `legacy/` directory should only be modified for bug fixes, not new features
