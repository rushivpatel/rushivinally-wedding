# Code Map

A reference for what every file in `src/` and `public/` does and where to find it. Organized by feature area, since that's usually how you'll go looking ("where's the map code," "where's the gate," etc.) — cross-referenced with a directory listing at the bottom if you'd rather browse by folder.

---

## Quick Reference — "I want to change..."

| Feature | Files |
|---|---|
| **Password gate / envelope** | [`components/SiteGate.tsx`](../src/components/SiteGate.tsx), [`components/PasswordGate.tsx`](../src/components/PasswordGate.tsx) |
| **Password itself** | `CORRECT_PASSWORD` constant in `PasswordGate.tsx` |
| **Navbar / mobile menu** | [`components/Navbar.tsx`](../src/components/Navbar.tsx) |
| **Footer** | [`components/Footer.tsx`](../src/components/Footer.tsx) |
| **Background music player** | [`components/AudioPlayer.tsx`](../src/components/AudioPlayer.tsx), audio files in `public/audio/` |
| **Homepage hero / countdown** | [`app/page.tsx`](../src/app/page.tsx), [`components/Countdown.tsx`](../src/components/Countdown.tsx), [`hooks/useCountdown.ts`](../src/hooks/useCountdown.ts) |
| **Schedule page timeline** | [`app/schedule/page.tsx`](../src/app/schedule/page.tsx) + everything in `components/timeline/` |
| **Timeline event data / dates** | [`data/weddingDetails.ts`](../src/data/weddingDetails.ts) |
| **Timeline marker icons (SVGs)** | `public/icons/events/*.svg`, loaded via [`lib/loadSvgIcon.ts`](../src/lib/loadSvgIcon.ts) |
| **Things to Do map** | [`app/things-to-do/page.tsx`](../src/app/things-to-do/page.tsx), [`components/MapComponent.tsx`](../src/components/MapComponent.tsx) |
| **Travel page (airports)** | [`app/travel/page.tsx`](../src/app/travel/page.tsx) |
| **All location data (venues, hotels, airports, food, coffee)** | [`data/locations.ts`](../src/data/locations.ts) |
| **Accommodation page** | [`app/accommodation/page.tsx`](../src/app/accommodation/page.tsx) — placeholder, not built yet |
| **RSVP page** | [`app/rsvp/page.tsx`](../src/app/rsvp/page.tsx) — placeholder, not built yet |
| **Glass/blur visual style** | `liquid-glass-lite*` classes in [`app/globals.css`](../src/app/globals.css) |
| **Colors / fonts** | `:root` tokens at the top of [`globals.css`](../src/app/globals.css); see also `design.md` |
| **Date formatting ("02.19.2027")** | [`lib/formatDate.ts`](../src/lib/formatDate.ts) |
| **"Navigate here" links (Google Maps)** | [`lib/generateMapsLink.ts`](../src/lib/generateMapsLink.ts) |
| **Supabase / Resend setup (not wired up yet)** | [`lib/supabaseClient.ts`](../src/lib/supabaseClient.ts), [`lib/resend.ts`](../src/lib/resend.ts) |

---

## 1. Pages (`src/app/`)

Each folder under `app/` is a route, following Next.js App Router conventions. `page.tsx` inside a folder is what renders at that URL.

| Route | File | Status |
|---|---|---|
| `/` | `app/page.tsx` | Built — hero photos, wedding date, countdown |
| `/schedule` | `app/schedule/page.tsx` | Built — animated timeline |
| `/travel` | `app/travel/page.tsx` | Built — venue map image + airport list |
| `/accommodation` | `app/accommodation/page.tsx` | Placeholder only |
| `/things-to-do` | `app/things-to-do/page.tsx` | Built — interactive map + filterable location list |
| `/rsvp` | `app/rsvp/page.tsx` | Placeholder only |
| (all routes) | `app/layout.tsx` | Root shell — wraps every page in `SiteGate`, `Navbar`, `Footer`, `AudioPlayer` |
| (all routes) | `app/globals.css` | Design tokens (colors/fonts) + the glassmorphism CSS recipe |

**`app/page.tsx` (Welcome/Home)**
Renders the "Vinally ♥ Rushi" title, a 3-photo hero grid (reads from `public/images/hero/`, shows an "Add photo" placeholder per slot if the file's missing), the wedding date, and the `Countdown` component. Pulls the primary event from `weddingDetails.ts`.

**`app/schedule/page.tsx`**
Reads the timeline's SVG path from `public/images/schedule/schedule.svg` (server-side, via `readPublicFile`), builds a list of events from `weddingDetails.ts`, and renders either `Timeline` (desktop, `md:` and up) or `TimelineMobileView` (mobile). Each event's position label (`above`/`below`/`left`/`right`) is set by the `POSITIONS` array in this file, in the same order as `weddingEvents`.

**`app/travel/page.tsx`**
Static venue map image (mobile/desktop variants from `public/images/travel/`) plus a list of airports, filtered from `locations.ts` by `category === "airport"`.

**`app/things-to-do/page.tsx`**
Client component. Left/main column is `MapComponent` (dynamically imported with `ssr: false` since MapLibre needs the browser). Right column is a category filter pill row + scrollable list of location cards, both driven by `locations.ts`. Airports/hotels/venues are excluded from this page's list and map filter (those live on Travel/Accommodation instead).

**`app/accommodation/page.tsx` / `app/rsvp/page.tsx`**
Both are one-paragraph placeholders — no logic to document yet. See `PROJECT_SPEC.md` for what's planned.

---

## 2. Access Gate (`SiteGate` + `PasswordGate`)

Two components split state from visuals:

- **`components/SiteGate.tsx`** — the state manager. Wraps the whole site (mounted in `layout.tsx`). On mount, checks `localStorage["vr-wedding-auth"]`; if `"true"`, skips the gate entirely. Otherwise renders the real site (already mounted underneath) plus the `PasswordGate` overlay on top.
- **`components/PasswordGate.tsx`** — the visual + form. Draws the envelope (SVG monogram wax seal, glass-effect flaps built from `clip-path` triangles, not images), holds the password input, and on correct entry (`VR2027`, case-insensitive) sets `localStorage` and runs a 3-stage unlock animation (flap opens → whole gate fades out) before calling `onUnlock()` to tell `SiteGate` to swap in the real site.

To change the password: edit `CORRECT_PASSWORD` in `PasswordGate.tsx`. To force everyone to re-enter it (e.g. after changing it): the key is `vr-wedding-auth` in localStorage — there's no server-side reset, guests just need to clear it (or you bump the storage key name to invalidate everyone at once).

This is intentionally client-side only — no real security, just a soft gate for invited guests. See `feedback`/`project` memory for the reasoning if you're revisiting this.

---

## 3. Layout & Navigation

- **`components/Navbar.tsx`** — sticky header. Desktop shows a glass "pill" nav with a sliding highlight that follows hover/active route (measured via `getBoundingClientRect`, positioned with plain `left`/`width`, animated with a CSS transition). Mobile shows a hamburger that drops a glass menu panel. Edit `NAV_LINKS` here to add/remove/rename pages.
- **`components/Footer.tsx`** — static sign-off ("Love, Vinally & Rushi..."). No logic.
- **`components/AudioPlayer.tsx`** — fixed bottom-right glass pill with play/pause, mute, and a volume slider. Auto-plays on load (best-effort; browsers can block autoplay, in which case it just starts paused). Audio source is `public/audio/ghar music only.mp3` — the "ghar - bharat chauhan.mp3" file alongside it looks like a vocal/original reference version, not the one actually played.

---

## 4. Schedule Page / Timeline (`components/timeline/`)

The most involved single feature on the site — a hand-built SVG-path timeline, not a library.

| File | Role |
|---|---|
| `Timeline.tsx` | Desktop version. Injects the schedule SVG via `dangerouslySetInnerHTML` (has to be inlined, not `<img>`, so the path is DOM-queryable), positions event markers/labels along it, and drives the "draw itself in" animation once scrolled into view. |
| `TimelineMobileView.tsx` | Mobile version — same SVG + path math, simpler layout (no left/right/above/below label positioning, just circular badges on the line). |
| `TimelineMarker.tsx` | A single icon badge on the path. Loads `public/icons/events/{eventId}.svg`; falls back to a plain dot if that file doesn't exist. |
| `timelinePath.ts` | Pure path-math utilities: finds the "main" `<path>` inside the injected SVG (longest one, or an explicit `#timeline` id), and converts a 0–1 "percent along the path" into an `{x, y}` point using `getPointAtLength`. |
| `useTimelinePath.ts` | Hook that calls the above, converts points to `%`-based positions (so markers stay attached to the path across any resize — no pixel math needed), and drives the actual stroke-drawing animation via `stroke-dasharray`/`stroke-dashoffset`. |
| `useTimelineReveal.ts` | Hook that watches for the timeline scrolling into view (`IntersectionObserver`) and, once triggered, times each marker's reveal to match when the drawing line would visually reach it. |
| `constants.ts` | Single constant: `DRAW_DURATION_MS` (1800ms) — how long the line-draw animation takes. Both `useTimelinePath` and `useTimelineReveal` read this so the draw and the marker reveals stay in sync. |
| `timeline.css` / `timeline-mobile.css` | Layout/positioning CSS for markers and labels (desktop vs. mobile). |

**Important quirk:** the schedule SVG's path is authored in the opposite direction from how it's meant to be read — this is compensated for in `useTimelinePath.ts` (see comments there) rather than by re-exporting the SVG. If you ever regenerate `public/images/schedule/schedule.svg`, check whether that reversal comment still applies.

To add/reorder/edit events shown on the timeline: edit `weddingEvents` in `data/weddingDetails.ts` — the Schedule page derives everything (order, spacing along the path, icon lookup) from that array. To change per-event label position (above/below/left/right), edit the `POSITIONS` array in `app/schedule/page.tsx`, matched by index to `weddingEvents`.

---

## 5. Things to Do Page / Map (`components/MapComponent.tsx`)

Built on **MapLibre GL** via `react-map-gl/maplibre` (not Google Maps/Mapbox — no API key needed, tiles come from a free CARTO basemap style).

- Renders pins for every entry in `locations.ts`, colored/sized differently for "special" categories (airport/hotel/venue) vs. everything else.
- Clicking a pin opens a `Popup` with a "navigate here" link (via `generateMapsLink`).
- **Known workarounds baked into this file** (see inline comments if debugging map issues):
  - The worker script is pointed at a static copy in `public/vendor/` because Turbopack's dev bundler doesn't preserve MapLibre's normal `import.meta.url` worker-resolution trick — without this, tiles fetch but silently never render. If you ever upgrade the `maplibre-gl` package, re-copy `maplibre-gl-worker.mjs` (and `maplibre-gl-shared.mjs`) from `node_modules/maplibre-gl/dist/`.
  - A `ResizeObserver` on the map's container forces `map.resize()`, because this page's grid/glass layout can settle a moment after the map first mounts, leaving the canvas stuck at a stale 0×0 size otherwise.
- The wrapping `<div>` around `MapComponent` on the Things to Do page uses `liquid-glass-lite-frame` (border/shadow only, no blur) rather than the full glass classes — `backdrop-filter` on an ancestor of a WebGL canvas can blank out the map's own rendering in some browsers.

- **`components/LocationIcon.tsx`** — tiny helper used by both the map pins and the sidebar cards. Takes a Lucide icon name as a string (from `Location.icon` in `locations.ts`) and renders that icon, falling back to a plain `MapPin` if the name doesn't match a real Lucide icon.

---

## 6. Data (`src/data/`)

- **`locations.ts`** — the single source of truth for every physical place referenced anywhere on the site: venues, hotels, airports, restaurants, coffee shops, sightseeing spots. Has a rubric comment at the top explaining exactly how to add a new entry (id format, how to get lat/lng from Google Maps, valid icon names). Other data (like `weddingDetails.ts`) references a place by its `id` rather than duplicating name/address/coordinates.
- **`weddingDetails.ts`** — the wedding's own events (Grah Shanti ×2, Haldi & Pithi, Wedding, Reception & Garba), each with a date/time, attire info, and a `locationId` pointing into `locations.ts`. Also has a rubric comment covering date/timezone format and how `isPrimaryEvent` picks which event the homepage countdown targets. **Still has `REPLACE_EVENT_#_COLORS` placeholders** for attire colors on most events — worth filling in.

---

## 7. Hooks (`src/hooks/`)

- **`useCountdown.ts`** — ticks every second, returns `{days, hours, minutes, seconds, isPast}` for a given target date string. Returns `null` until the component has mounted client-side (avoids a server/client mismatch on first render, since "now" differs by the instant each is computed).

(Timeline-specific hooks `useTimelinePath` and `useTimelineReveal` live in `components/timeline/` instead, since they're tightly coupled to that feature — see section 4.)

---

## 8. Lib / Utilities (`src/lib/`)

| File | Purpose |
|---|---|
| `formatDate.ts` | Formats an ISO date string as `MM.DD.YYYY`, always in Pacific time regardless of viewer/server timezone. |
| `generateMapsLink.ts` | Turns an address string into a `https://maps.google.com/?q=...` link — works cross-platform without needing separate iOS/Android deep links. |
| `imageExists.ts` | Server-only. Checks whether a file exists under `public/` — used by the homepage hero grid and schedule page to show "Add photo"/"Add SVG" placeholders instead of a broken image when an asset hasn't been added yet. |
| `readPublicFile.ts` | Server-only. Reads a text file from `public/` (used to pull in the raw schedule SVG markup so it can be inlined into the DOM). |
| `loadSvgIcon.ts` | Builds the URL for a timeline marker's icon (`public/icons/events/{eventId}.svg`) and a fallback data-URI dot SVG if that file is missing. |
| `supabaseClient.ts` | Supabase client, reads `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` from env. **Not wired into any page yet** — exists for the planned RSVP backend. |
| `resend.ts` | Resend email client, reads `RESEND_API_KEY` from env. **Not wired into any page yet** — exists for planned RSVP confirmation emails. |

---

## 9. Styling (`src/app/globals.css`)

Design tokens (`--color-primary`, `--color-secondary`, etc. and the two font variables) live at the top — this is the only place hex values should be edited. See `design.md` for what each token means.

The rest of the file is the **glassmorphism system** — five related utility classes, all variations on the same "layered gradient + backdrop blur + inset bevel + drop shadow" recipe:

| Class | Use it for |
|---|---|
| `.liquid-glass-lite` | Default glass surface — has `will-change: transform`, so reserve it for elements that actually animate (e.g. the nav pill). |
| `.liquid-glass-lite-static` | Same look, no `will-change` — use on grids/lists of many cards (things-to-do sidebar cards) so the GPU isn't asked to keep a composited layer per card at rest. |
| `.liquid-glass-lite-active` | Brighter/higher-contrast variant, for glass elements that sit on top of *another* glass surface (e.g. the sliding highlight behind the active nav link) — needs more contrast to read as a distinct raised layer. |
| `.liquid-glass-lite-secondary` | Same recipe with a lavender (`#BABAFF`) tint in the fill, bright top highlight kept. Use on whichever surface is at the visual "top" of a composition (e.g. the password-gate envelope's flap). |
| `.liquid-glass-lite-secondary-flat` | Same tint, no bright top-highlight stop — use for a glass surface sitting *below* another glass element that already owns the highlight (e.g. the envelope's face/body, under the flap). |
| `.liquid-glass-lite-frame` | Border + shadow only, no blur/background at all — required around any WebGL/canvas content (`MapComponent`), since `backdrop-filter` on an ancestor can blank out canvas rendering. |

Also defines `@keyframes shake` / `.animate-shake`, used by `PasswordGate` on a wrong password.

A `@supports not (backdrop-filter)` fallback swaps all glass classes to a flat semi-opaque background for older browsers.

---

## 10. Public Assets (`public/`)

| Folder | Contents |
|---|---|
| `audio/` | Background music. `ghar music only.mp3` is the one actually played by `AudioPlayer`; `ghar - bharat chauhan.mp3` appears to be a reference/vocal version kept alongside it. |
| `icons/events/` | One SVG per timeline event (`wedding.svg`, `reception-garba.svg`, `haldi-pithi.svg`, `rushi-grah-shanti.svg`, `vinally-grah-shanti.svg`), filenames matching each event's `eventid` in `weddingDetails.ts`. |
| `images/hero/` | The 3 homepage hero photos (`hero-1.jpg`, `hero-2.jpg`, `hero-3.jpg`). |
| `images/schedule/` | `schedule.svg` — the hand-drawn path the timeline animates along. |
| `images/travel/` | Venue map images (`venue-map.png` desktop, `venue-map-mobile.png` mobile). |
| `logo/` | `monogram.svg` — the "RV" mark used in the Navbar and (inlined/recolored) as the password gate's wax seal. |
| `vendor/` | Static copies of MapLibre's worker/shared scripts — a workaround, see section 5. |

---

## Directory Listing (for browsing by folder)

```
src/
├── app/
│   ├── layout.tsx              Root shell: fonts, SiteGate, Navbar, Footer, AudioPlayer
│   ├── globals.css             Design tokens + glassmorphism classes
│   ├── page.tsx                 Welcome/Home
│   ├── schedule/page.tsx        Schedule (timeline)
│   ├── travel/page.tsx          Travel (airports)
│   ├── accommodation/page.tsx   Where to Stay (placeholder)
│   ├── things-to-do/page.tsx    Things to Do (map + list)
│   └── rsvp/page.tsx            RSVP (placeholder)
├── components/
│   ├── SiteGate.tsx             Gate state (localStorage check)
│   ├── PasswordGate.tsx         Gate visuals + form + unlock animation
│   ├── Navbar.tsx                Nav with glass pill + mobile drawer
│   ├── Footer.tsx
│   ├── AudioPlayer.tsx           Background music controls
│   ├── Countdown.tsx             Homepage countdown display
│   ├── LocationIcon.tsx          Lucide icon-by-name helper
│   ├── MapComponent.tsx          MapLibre map (Things to Do)
│   └── timeline/
│       ├── Timeline.tsx              Desktop timeline
│       ├── TimelineMobileView.tsx    Mobile timeline
│       ├── TimelineMarker.tsx        Single event icon/marker
│       ├── timelinePath.ts           SVG path math (pure functions)
│       ├── useTimelinePath.ts        Hook: positions + draw animation
│       ├── useTimelineReveal.ts      Hook: scroll-triggered reveal timing
│       ├── constants.ts              DRAW_DURATION_MS
│       ├── timeline.css              Desktop layout
│       └── timeline-mobile.css       Mobile layout
├── data/
│   ├── locations.ts              All physical places (venues/hotels/airports/food/coffee)
│   └── weddingDetails.ts         Wedding events, dates, attire
├── hooks/
│   └── useCountdown.ts           Countdown timer hook
└── lib/
    ├── formatDate.ts              MM.DD.YYYY formatter
    ├── generateMapsLink.ts        Google Maps link builder
    ├── imageExists.ts             Server: check file exists in public/
    ├── readPublicFile.ts          Server: read text file from public/
    ├── loadSvgIcon.ts             Timeline marker icon URL + fallback
    ├── supabaseClient.ts          Supabase client (unused so far)
    └── resend.ts                  Resend email client (unused so far)

public/
├── audio/                        Background music files
├── icons/events/                 Timeline marker SVGs (one per event)
├── images/hero/                  Homepage hero photos
├── images/schedule/               schedule.svg (timeline path)
├── images/travel/                 Venue map images
├── logo/                          monogram.svg
└── vendor/                        MapLibre worker workaround files
```
