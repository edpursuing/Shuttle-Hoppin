# Hoppin' Interface Design System

## Intent

**Who:** Pursuit fellows — primarily on laptop late at night (8-10pm) in class or heading home, dealing with real-time transit disruptions. Stressed, time-pressured, need to act fast.

**What:** See available rides at a glance → join in two taps. Or post a ride in under a minute.

**Feel:** Transit wayfinding system. High-contrast, scan-friendly, built for split-second comprehension. Dark ride cards as objects mounted on a light wall — not a dark app, not a generic light app. Purposeful hybrid.

---

## Color

### Canvas & Surfaces

| Token | Value | Usage |
|-------|-------|-------|
| `--canvas` | `#F7F6F4` | Page background (warm off-white — takes the clinical edge off pure `#f5f5f5`) |
| `--surface-1` | `#1A1A1A` | Ride cards, stop selector items, dark UI elements |
| `--surface-2` | `#242424` | Elevated elements on dark surfaces (dropdowns, modals over cards) |
| `--surface-light` | `#FFFFFF` | Direction toggle active button, mockup containers |
| `--surface-control` | `#F5F5F5` | Direction toggle background, table headers, inputs on light backgrounds |

### Text

| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `#111111` | Headlines, primary labels on light backgrounds |
| `--text-secondary` | `#333333` | Body text on light backgrounds |
| `--text-tertiary` | `#888888` | FROM/TO labels, seat count, metadata |
| `--text-muted` | `#999999` | Disabled, placeholder, inactive nav |
| `--text-on-dark` | `#FFFFFF` | Station names on dark cards |
| `--text-on-dark-secondary` | `#CCCCCC` | Driver names on dark cards |
| `--text-on-dark-muted` | `#666666` | Ride stats on dark cards |
| `--text-on-dark-faint` | `#555555` | Passing through on dark cards |

### Brand & Accent

| Token | Value | Usage |
|-------|-------|-------|
| `--action` | `#2E86C1` | Primary CTAs (Join, Post ride, Next), selected states, active nav |
| `--urgent` | `#EF9F27` | Ride Now left border, countdown badge, time pressure only |
| `--urgent-text` | `#412402` | Text inside amber countdown badge |
| `--slack` | `#4A154B` | Slack sign-in button, Slack-related actions only |

### MTA Line Colors

| Token | Value | Line |
|-------|-------|------|
| `--mta-7` | `#6E3A90` | 7 train |
| `--mta-e` | `#0039A6` | E train |
| `--mta-f` / `--mta-m` | `#FF6319` | F/M trains |
| `--mta-n` / `--mta-w` | `#FCCC0A` | N/W trains |
| `--mta-g` | `#6CBE45` | G train |
| `--mta-lirr` | `#555555` | LIRR |

### Semantic (Status Banners)

| State | Background | Dot |
|-------|-----------|-----|
| On the way | `#e8f8ee` | `#27ae60` |
| Running late | `#fef5e7` | `#EF9F27` |
| At pickup | `#e8f4fd` | `#2E86C1` |
| Waiting | `#f5f5f5` | `#999999` |

### Borders

| Token | Value | Usage |
|-------|-------|-------|
| `--border-standard` | `#E0E0E0` | Mockup containers, dividers, direction toggle active |
| `--border-light` | `#EEEEEE` | Table rows, bottom nav top |
| `--border-selected` | `#2E86C1` | Stop selector selected state (1.5px) |
| `--border-unselected` | `#555555` | Stop selector radio dot (1.5px) |
| `--border-dashed` | `#CCCCCC` | Custom location option |

---

## Typography

**Font family:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` — system stack, native feel on iOS where mobile use happens

| Level | Size | Weight | Letter-spacing | Notes |
|-------|------|--------|---------------|-------|
| App title | 22px | 500 | — | |
| Section label | 11px | 500 | 0.5px | Uppercase (LEAVING SOON, SCHEDULED) |
| Station name | 14–15px | 500 | — | White on dark cards |
| FROM/TO label | 10–11px | 400 | — | `#888888` |
| Driver name | 11–12px | 400 | — | `#CCCCCC` on dark |
| Ride stats | 9–10px | 400 | — | `#666666` on dark |
| Seat count | 11–12px | 400 | — | `#888888` |
| Passing through | 10–11px | 400 | — | `#555555` on dark |
| Body / description | 13–14px | 400 | — | `line-height: 1.5` |
| Time / data | any | 400 | — | `font-variant-numeric: tabular-nums` |

---

## Spacing

**Base unit: 4px**

| Scale | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Badge gaps, tight internal spacing |
| `sm` | 8px | Within-component gaps (avatar → name, icon → label) |
| `md` | 12px | Card internal padding (vertical) |
| `lg` | 14–16px | Card padding, section gaps |
| `xl` | 20px | Horizontal page padding |
| `2xl` | 24–32px | Major section separation |
| `3xl` | 40–48px | Page-level top padding |

---

## Border Radius

| Scale | Value | Usage |
|-------|-------|-------|
| `sm` | 4px | Countdown badge |
| `md` | 6px | Buttons (Join, nav active), direction toggle active button |
| `lg` | 8px | Stop selector items, status banners, direction toggle container, inputs |
| `xl` | 12px | Ride cards, mockup containers, bottom nav |
| `2xl` | 16px | App icon (login page) |
| `full` | 50% | Avatars, MTA line badges, radio dots, nav icons |

---

## Depth Strategy

**Borders only. No box shadows anywhere.**

The reference uses zero shadows. Surfaces are defined by border and background color alone. This matches the transit signage aesthetic — signs don't cast shadows, they define space through contrast.

- Elevation is communicated through background color shift (`#F7F6F4` → `#FFFFFF` → `#1A1A1A`)
- Borders separate surfaces at `1px` weight
- Selected/focus states use `1.5px --border-selected` (`#2E86C1`)

---

## Components

### Ride Card

```
background: #1A1A1A
padding: 14px
border-radius: 12px
margin-bottom: 10px

Urgent variant: border-left: 3px solid #EF9F27

Structure (top to bottom):
  - FROM label (10px, #888) + station name (15px, 500, #fff)
  - Countdown badge (urgent) OR departure time
  - TO label + station name + MTA badges
  - Driver row: avatar (28px) + name + stats | seat count | Join button
```

### MTA Badge

```
Subway line: 16px circle, 9px bold text, border-radius: 50%
LIRR: rounded rect, 8px bold, padding: 2px 5px, border-radius: 3px, bg: #555
```

### Countdown Badge

```
background: #EF9F27
color: #412402
padding: 3px 8px
border-radius: 4px
font-size: 11px, weight: 500
```

### Join Button

```
padding: 6px 14px
border-radius: 6px
background: #2E86C1
color: #fff
font-size: 12px, weight: 500
```

### Full-width Primary Button

```
padding: 14px
border-radius: 8px
background: #2E86C1 (active) | #CCCCCC (disabled)
color: #fff
font-size: 15px, weight: 600
```

### Direction Toggle (Mobile)

```
container: background #F5F5F5, border-radius: 8px, padding: 3px
button: padding: 8px, border-radius: 6px
active: background #FFF, border: 1px solid #E0E0E0, color: #111
inactive: background transparent, color: #888
```

### Stop Selector Item

```
background: #1A1A1A
padding: 12px 14px
border-radius: 8px
margin-bottom: 6px
selected: border: 1.5px solid #2E86C1, opacity: 1, radio dot filled #2E86C1
unselected: border: transparent, opacity: 0.6, radio dot: 8px, border: 1.5px solid #555
```

### Driver Status Banner

```
padding: 12px 14px
border-radius: 8px
layout: flex, dot (8px circle) + status text (13px, 500) + time right-aligned (12px)
```

### Bottom Nav (Mobile)

```
height: ~64px
border-top: 1px solid #EEEEEE
5 equal columns
icon: 20px SVG, stroke-width: 2
label: 10px
active: color #2E86C1
inactive: color #999
center Offer button: 44px circle, background #2E86C1, elevated margin-top: -20px
```

---

## Desktop Layout

### Three-Zone Structure

```
┌─────────────────────────────────────────────┐
│  Top Nav (logo | Board  My Rides  Profile | avatar) │
├──────────────┬──────────────────────────────┤
│              │                              │
│   Sidebar    │      Ride Card Grid          │
│   220px      │      auto-fill, min 280px    │
│   fixed      │                              │
│              │                              │
└──────────────┴──────────────────────────────┘
```

### Top Nav

```
height: 56px
border-bottom: 1px solid #E0E0E0
background: #FFFFFF
layout: logo/name left | nav links center | avatar right
nav links: Board, My Rides, Profile — 13px text, 16px gap
active link: color #2E86C1 + 2px bottom border
NO "Offer a ride" button in top nav
```

### Sidebar (220px fixed)

**Slot order (top to bottom):**

1. **My upcoming ride** — shown only if user has a booked ride. Small dark card: driver name, departure time, stop name, link to ride detail. If nothing booked: slot is empty, direction toggle leads.

2. **Direction toggle** — vertical button stack (From HQ / To HQ)

3. **Stop filter** — list of stops with ride counts + mini MTA badges

4. **Offer a ride card** — shown only if `hasCar: true`
   ```
   background: #1A1A1A
   border-radius: 12px
   padding: 16px
   heading: "Going home tonight?" (13px, #CCC)
   button: full-width, background #2E86C1, "Post a ride", 14px bold
   ```

5. **Quick stats** — rides offered, seats filled, active now (bottom, lowest priority)

### Ride Grid

```
display: grid
grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))
gap: 12px
```

### Desktop Direction Toggle

```
Vertical stack (not segmented control)
Each button: full sidebar width, padding: 10px 14px, border-radius: 8px
Active: background #2E86C1, color #fff
Inactive: background transparent, color #888, hover: background #F5F5F5
```

---

## Mobile Touch Targets

Minimum 44px for all interactive elements.

---

## What This System Rejects

| Default | What we use instead |
|---------|-------------------|
| White canvas | `#F7F6F4` warm off-white |
| All-dark UI | Light canvas + dark cards as objects |
| Shadows for depth | Borders only |
| Nav button for "Offer a ride" on desktop | Sidebar card (contextual, driver-only) |
| Generic sans-serif | System font stack (native iOS feel) |
| Multiple accent colors | `#2E86C1` for action, `#EF9F27` for urgency only |
