# Project Specification: Custom Bespoke Wedding Website  
  
## 1. Executive Summary & Tech Stack Architecture  
A fully custom, high-performance wedding website with elegant glassmorphism design and password-gated access. Built with Next.js, React, and Tailwind CSS to provide complete layout flexibility, bespoke typography, and personal flair without constraints of standard providers (Zola, WithJoy).  
  
* **Framework:** Next.js (App Router, React Server Components, TypeScript)  
* **Styling:** Tailwind CSS v4 + Lucide Icons (`lucide-react`) + Custom Glassmorphism CSS  
* **Authentication:** Client-side password gate with localStorage persistence (invitation-only access)  
* **Deployment & Compute:** Vercel (Connected to GitHub CI/CD pipeline)  
* **Database / Backend:** Supabase PostgreSQL (Managed DB, Row Level Security, Client SDK)  
* **Outbound Email:** Resend API + `@react-email/components` (Transactional confirmations)  
* **Inbound Email:** iCloud+ Custom Domain (MX/TXT records pointing to personal inbox)  
* **Mapping Engine:** MapLibre GL JS + `react-map-gl/maplibre` (Custom dark/warm map styling)  
* **Domain & DNS:** Cloudflare Registrar (Custom domain linked to Vercel via A/CNAME)  
* **Media:** Ambient background audio with glass-styled player controls  
  
---  

## 2. Access Layer: Password Gate

### Architecture
The site is wrapped in a **SiteGate** component that gates access to all content via a password-protected envelope visual.

**SiteGate.tsx** (Wrapper Component)
- Client component in root `layout.tsx`
- Checks `localStorage("vr-wedding-auth")` on mount
- If unlocked on prior visit, renders site immediately
- Otherwise, displays PasswordGate overlay on top of site content

**PasswordGate.tsx** (Visual Component)
- Renders an elegant **envelope visual** with wax seal containing the monogram (SVG)
- Displays password input form on engagement
- Handles password validation (case-insensitive, password: "VR2027")
- Orchestrates three-stage unlock animation:
  1. **Form Stage:** Password input visible
  2. **Flap Stage:** Envelope flap rotates 180° (1000ms spring easing)
  3. **Reveal Stage:** Entire envelope animates away, site slides in (700ms)
- On correct password: sets `localStorage("vr-wedding-auth", "true")` and triggers unlock

### Visual Design
- **Envelope Structure:** Two flaps (top V-shape, bottom Λ-shape) using `clip-path` polygon
- **Top Flap:** Rotating triangle with wax seal, glass effect with bright highlight
- **Bottom Flap:** Filled triangle matching top flap glass appearance
- **Face:** Continuous envelope background behind flaps, single glass border (no horizontal dividing line)
- **Glassmorphism:** Applies `liquid-glass-lite-secondary` class with backdrop blur, bright 45% opacity white top highlight, lavender tint
- **Animation:** Uses CSS 3D transforms (`rotateX`, `scale`) with spring-like cubic-bezier easing

---  

## 3. Page & Navigation Structure  
  
The application consists of 6 primary top-level tabs/routes:  
  
### 1. Welcome (`/`)  
* **Hero Section:** High-resolution photo gallery/carousel with overlay text.  
* **Core Info:** Wedding Date, City/State, and Countdown Timer.  
* **Countdown Component:** Dynamic React hook (`useCountdown`) calculating Days, Hours, Minutes, Seconds until ceremony time.  
  
### 2. Schedule (`/schedule`)  
* **Timeline Component:** Vertical chronological timeline drawn with SVG path and animated reveal on scroll
* **Cards for Events:** Welcome Drinks, Ceremony, Reception, After-party with tangent/normal-based positioning
* **Card Features:** Time, Venue Name, Address, Dress Code, and Expandable Details
* **Animation:** Path draws in reverse (bottom-to-top), cards slide and fade in as user scrolls past each marker  
  
### 3. Travel (`/travel`)  
* **Flight Info:** Nearby primary/secondary airports (Codes, driving distance to venue).  
* **Ground Transport:** Quick links & discount info for rental car agencies, rideshare details, and parking notes.  
* **Interactive Travel Map:** Pinpoint visual of airports, transit hubs, and main venue locations.  
  
### 4. Where to Stay (`/accommodation`)  
* Hotel block cards with discounted booking links, group codes, and nightly rates.  
* One-click "Copy Code" buttons for hotel promo codes.  
* Distance and travel time metrics from hotels to primary venue.  
  
### 5. Things to Do (`/things-to-do`)  
* Curated local recommendations organized by category tabs:  
* **Food & Dining** (Filterable tags: *Vegetarian Friendly*, *Late Night*, *Views*)  
* **Coffee & Bakeries**  
* **Sightseeing & Culture**  
* **Interactive Map Integration:** MapLibre map with interactive pins corresponding to listed spots. Clicking a card focuses the map pin; clicking a pin opens a detailed card popup.  
  
### 6. RSVP (`/rsvp`)  
* **Current Phase:** Clean placeholder wrapper page featuring a prominent button linking/redirecting to an external form provider (or embedded iframe).  
* **Architecture Provision:** Form actions structured to seamlessly swap to custom Supabase database writes later if desired.  
  
---  
  
## 4. Database Schema (Supabase / PostgreSQL)  
  
```sql  
-- Households table (Groups families or couples together)  
CREATE TABLE households (  
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  
family_name TEXT NOT NULL,  
max_plus_ones INT DEFAULT 0,  
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  
);  
  
-- Guests table  
CREATE TABLE guests (  
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  
household_id UUID REFERENCES households(id) ON DELETE CASCADE,  
first_name TEXT NOT NULL,  
last_name TEXT NOT NULL,  
is_attending BOOLEAN DEFAULT NULL,  
meal_preference TEXT DEFAULT NULL,  
dietary_restrictions TEXT DEFAULT NULL,  
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  
);  
  
-- Index for fast lookup during search-based RSVP  
CREATE INDEX idx_guests_name ON guests (LOWER(first_name), LOWER(last_name));  
```  
  
---  
  
## 5. Design System & Aesthetic Guidelines  

### Typography  
* **Headings:** Serif (`Playfair Display` via `next/font/google`)  
* **Body:** Clean Sans-serif (`Inter` via `next/font/google`)  
* **Font Variables:** `--font-primary` (Playfair), `--font-secondary` (Inter)

### Color Palette  
* **Primary:** Deep Slate / Navy (`#1a1a2e` or similar dark navy)  
* **Secondary:** Rich Lavender / Royal Purple (`#babaff`)  
* **Tertiary:** Warm Cream/Beige text on dark backgrounds  
* **Quinary:** Subtle borders and dividers  
* **Accent:** Warm gold/bronze highlights for interactive elements  

### Glassmorphism Design System
**Core Recipe:** Neumorphism + Spatial UI with sophisticated glass effect  

**Glass Classes (Tailwind):**
- `liquid-glass-lite`: Primary glass surface (backdrop-filter blur + saturate, white/lavender tint, 45% opacity bright top highlight, subtle border)
- `liquid-glass-lite-secondary`: Variant with bright top highlight and lavender tint (used for envelope flaps, buttons)
- `liquid-glass-lite-secondary-flat`: Uniform tone variant without bright top gradient (used for envelope face, structural elements)
- `liquid-glass-lite-frame`: Glass frame wrapper for images and maps

**Visual Characteristics:**
- `backdrop-filter: blur(20px) saturate(160%)`
- Bright highlight at top: `rgba(255,255,255,0.45)` creating 3D depth
- Subtle border: `1px solid rgba(255,255,255,0.45)`
- Drop shadows for elevated surfaces (not box-shadow)
- Rounded corners: `rounded-2xl` or `rounded-3xl`

**Usage:**
- Envelope password gate (glass flaps, face, seal container)
- Navigation pill (sliding glass background behind active tab)
- Card components and UI containers
- Audio player controls (glass button with gold accent background)

### UI Elements & Interactions  
* **Rounded Corners:** `rounded-2xl` for cards, `rounded-3xl` for large sections, `rounded-full` for pills/buttons  
* **Transitions:** Smooth `transition-all duration-300` on hover, spring-like easing on animations (`cubic-bezier(0.34, 1.56, 0.64, 1)`)  
* **Interactive Depth:** Use drop-shadow and transform scale on hover for tactile feel  
* **Navigation:** Glass-styled navbar pill with sliding underline effect

### Audio Player
- Fixed position bottom-right (`fixed bottom-6 right-6 z-50`)
- Glass container with play/pause toggle, mute button, volume slider
- Uses gold/bronze secondary color for buttons and accents
- Auto-plays on page load (subject to browser autoplay policy)  
  
---  
  
## 6. Target Project Directory Structure  
  
```text  
wedding-site/  
├── src/  
│ ├── app/  
│ │ ├── layout.tsx # Root layout with SiteGate wrapper, Navbar, Footer, AudioPlayer  
│ │ ├── globals.css # Tailwind config + glass effect definitions  
│ │ ├── page.tsx # Welcome/Home tab  
│ │ ├── schedule/  
│ │ │ └── page.tsx # Schedule tab with Timeline component  
│ │ ├── travel/  
│ │ │ └── page.tsx # Travel tab with map and airport info  
│ │ ├── accommodation/  
│ │ │ └── page.tsx # Where to Stay tab  
│ │ ├── things-to-do/  
│ │ │ └── page.tsx # Things to Do tab with MapLibre integration  
│ │ ├── rsvp/  
│ │ │ └── page.tsx # RSVP tab  
│ │ └── api/  
│ │ └── rsvp/route.ts # Server API handler  
│ ├── components/  
│ │ ├── SiteGate.tsx # Access layer wrapper (checks localStorage)  
│ │ ├── PasswordGate.tsx # Envelope visual + password form  
│ │ ├── Navbar.tsx # Navigation with glass pill  
│ │ ├── Footer.tsx # Footer with site credits  
│ │ ├── AudioPlayer.tsx # Glass-styled audio controls  
│ │ ├── Timeline.tsx # Vertical event timeline with reveal animation  
│ │ ├── TimelineMarker.tsx # Individual timeline event marker  
│ │ ├── TimelineCard.tsx # Event details card  
│ │ ├── Countdown.tsx # Days/hours/minutes countdown (if used)  
│ │ ├── InteractiveMap.tsx # MapLibre wrapper component  
│ │ └── EmailTemplate.tsx # Resend email template  
│ ├── lib/  
│ │ ├── supabaseClient.ts # Supabase client initialization  
│ │ ├── resend.ts # Resend email API wrapper  
│ │ ├── timelinePathFinding.ts # Path-finding utilities for timeline SVG  
│ │ ├── readPublicFile.ts # Server utility for reading public assets  
│ │ └── utils.ts # General utilities  
│ ├── hooks/  
│ │ ├── useTimelinePath.ts # Hook to calculate timeline path coordinates  
│ │ ├── useTimelineReveal.ts # Hook to manage timeline reveal animation  
│ │ └── useCountdown.ts # Hook for countdown timer (if used)  
│ └── data/  
│ ├── scheduleEvents.ts # Wedding events (time, venue, details)  
│ ├── hotels.ts # Hotel block data with codes and rates  
│ ├── locations.ts # Location data (airports, hotels, venues)  
│ └── localSpots.ts # Local recommendations (food, sightseeing, etc.)  
├── public/  
│ ├── images/ # Event photos, maps, location images  
│ ├── audio/ # Ambient background music  
│ ├── svg/ # SVG assets (monogram, icons)  
│ └── data/ # Map overlays, GeoJSON  
├── .env.local # Environment variables (git-ignored)  
├── .env.local.example # Template for .env.local  
├── package.json  
├── tailwind.config.ts # Tailwind color palette  
├── tsconfig.json # TypeScript configuration  
└── next.config.ts # Next.js configuration  
```  
  
---  
  
## 7. Execution Milestones & Status  

### ✅ Phase 1: Foundation Setup (Complete)
* Next.js App Router with TypeScript & Tailwind CSS v4  
* Navbar with mobile drawer menu and glass-pill navigation  
* Footer with credits  
* Root layout with SiteGate wrapper  
* Google Fonts (Playfair Display + Inter)  

### ✅ Phase 2: Access Layer (Complete)
* Password gate with client-side localStorage authentication  
* Envelope visual with rotating flaps and wax seal  
* Three-stage unlock animation (form → flap → reveal)  
* Case-insensitive password validation  
* Device memory persistence  

### ✅ Phase 3: Visual Design System (Complete)
* Glassmorphism CSS framework with `liquid-glass-lite-*` classes  
* Neumorphism + spatial UI depth effects  
* Tailwind v4 color palette (primary, secondary, tertiary, quinary)  
* Drop-shadow and transform-based elevation  
* Responsive scaling for mobile/tablet/desktop  

### ✅ Phase 4: Core Page Components (Complete)
* Welcome/Home page structure  
* Schedule page with animated timeline  
  - SVG path-finding and coordinate calculation  
  - Tangent/normal-based card positioning  
  - Scroll-triggered reveal animation  
* Travel page with airport listings and map placeholder  
* Accommodation page structure  
* Things to Do page structure  
* RSVP page placeholder  

### ✅ Phase 5: Interactive Components (Partial)
* Audio player with glass styling and controls (Complete)  
* Timeline component with reveal animation (Complete)  
* MapLibre integration stub created (Ready for map data)  
* Countdown timer structure (Ready for implementation)  

### ⏳ Phase 6: Backend Integration (Pending)
* Supabase PostgreSQL connection for RSVP  
* Household/Guest schema setup and Row Level Security policies  
* Resend email API integration for confirmations  
* RSVP form submission and validation  

### ⏳ Phase 7: Remaining Features
* Welcome page photo carousel/gallery  
* Travel page interactive map (MapLibre + location pins)  
* Things to Do map integration and filtering  
* Hotel block data and promo code copy functionality  
* Local recommendations categorized and tagged  
* RSVP form submission and guest database writes  

### ⏳ Phase 8: Deployment & Polish
* Environment variable configuration  
* Vercel deployment setup  
* Cloudflare DNS and custom domain mapping  
* Performance optimization and lighthouse audits  
* Cross-browser and mobile testing  
* Accessibility review (WCAG 2.1 AA)
