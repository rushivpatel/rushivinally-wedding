# Design System

Single source of truth for colors and fonts. To restyle the entire site, edit the
values in **`src/app/globals.css`** (colors + font variable wiring) and
**`src/app/layout.tsx`** (which Google Fonts are loaded) — nothing else needs to
change, since every component references these tokens by ordinal name rather
than a literal hex code or font name.

---

## Colors

Defined in `src/app/globals.css`, inside `:root`:

```css
--color-primary: #2c3e50;
--color-secondary: #BABAFF;
--color-tertiary: #f8f4ec;
--color-quaternary: #ede6d8;
--color-quinary: #b8965a;
```

| Token | Current value | Role | Original spec name |
|---|---|---|---|
| `primary` | `#2C3E50` | Main text color, headings, dark surfaces (navbar/footer text) | Deep Slate / Rich Navy |
| `secondary` | `#BABAFF` | Secondary brand color, accents | Deep Purple / Royal Plum |
| `tertiary` | `#EBE5D8` | Page background, light surfaces | Warm Cream |
| `quaternary` | `#EDE6D8` | Hover/muted surface fill | Warm Stone |
| `quinary` | `#B8965A` | Accent highlights, active nav state, small caps labels | Gold / Bronze |

**Usage in components:** Tailwind utilities are generated automatically from the
`@theme inline` block, so use them directly as classes — e.g. `bg-primary`,
`text-quinary`, `border-secondary/20`, `bg-tertiary/70`. Never hardcode a hex
value or an old semantic name (`navy`, `gold`, etc.) in a component — always
reference the token.

**To restyle:** change the five hex values in `:root` in `globals.css`. Every
page and component updates automatically.

---

## Fonts

Loaded via `next/font/google` in `src/app/layout.tsx`, then mapped to token
names in `globals.css`:

```ts
// layout.tsx
const playfairDisplay = Playfair_Display({ variable: "--font-primary", subsets: ["latin"] });
const inter = Inter({ variable: "--font-secondary", subsets: ["latin"] });
```

| Token | Current font | Role | Tailwind class |
|---|---|---|---|
| `primary` | Playfair Display | Headings, display text, logo mark | `font-primary` |
| `secondary` | Inter | Body copy (applied globally on `<body>`) | `font-secondary` |

**To swap a font:** in `layout.tsx`, replace the Google Font import/call for
`playfairDisplay` or `inter` (e.g. swap `Playfair_Display` for
`Cormorant_Garamond`) but keep the `variable: "--font-primary"` /
`"--font-secondary"` names unchanged — no other file needs to be touched.

If a third font is ever needed (e.g. a monospace for numbers), add it as
`--font-tertiary` following the same pattern in both files.

---

## UI Conventions

Per the project spec, the visual language follows a **Modern Spatial UI / Glassmorphism** aesthetic. This requires blending physical translucency (frosted glass) with tactile Neumorphic geometry (soft 3D extrusions and recesses) and vibrant ambient color glows.

- **Corner Radii:** Pervasive use of pill-shaped containers (`rounded-full`) and organic squirkle-like rounded corners (`rounded-2xl` to `rounded-3xl`) for major cards and modals.
- **Smooth Transitions:** `transition-all duration-300 ease-out` for all hover, active, and focus states.

### Spatial Geometry & Neumorphism
Instead of flat flat-design surfaces, interface elements must feel like physical objects molded into or floating above the canvas.

1. **Recessed Tracks (Concave):** Containers holding segmented controls, grouped buttons (like window controls), or toggle switches must look pushed *into* the surface.
   - **Styling:** Apply a subtle inner shadow (`box-shadow: inset 0 2px 5px rgba(0,0,0,0.06), inset 0 0 2px rgba(0,0,0,0.04)`).
   - **Fill:** The background should be a slightly muted or more opaque tint compared to the surrounding canvas to create depth.
2. **Convex Buttons & Elements (Raised):** Active buttons sitting inside tracks (e.g., calendar date pills or circular icon buttons) must look physically raised and convex.
   - **Styling:** Combine a soft top-lit linear gradient (lighter at the top, slightly darker at the bottom) with a tight drop shadow.
3. **Ambient Color Blooms:** Highly saturated or active elements (like a red button or cyan active state) must cast a tinted shadow of their *own color*, not a black/gray shadow.
   - **Styling Example:** A red active pill should have a red ambient glow (`shadow-[0_8px_20px_rgba(239,68,68,0.25)]`).

### Liquid Glass Material — `liquid-glass-lite`

Defined in `src/app/globals.css` under `@layer utilities`. Pure CSS (no SVG filters, no WebGL). The glass material stacks **five elements** to read as a curved, physical piece of glass with polished edges:

1. **Specular Edge Rim (Refractive Light):** A crisp 1px semi-transparent white/light border (`border border-white/50`). This mimics light bending on the polished perimeter of glass.
2. **A vertical highlight gradient:** Bright sheen at the top, dimmer through the middle, soft glow at the bottom. This gives the glass structural convexity rather than looking like a flat tinted smudge.
3. **`backdrop-filter: blur(24px) saturate(180%)`:** The heavy "frosted" effect. The high saturation ensures underlying elements punch through the blur with vibrant color.
4. **Inset Edge Bevels:** `box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.7), inset 0 -1px 1px rgba(0, 0, 0, 0.05)`. This creates a crisp internal top highlight and soft bottom recess, giving the glass perceived thickness.
5. **Tactile Outer Shadow:** A tight contact shadow plus a wide, soft diffuse shadow so the glass floats slightly above the page.

Three variants, all sharing that same five-layer recipe:

| Class | Use for |
|---|---|
| `.liquid-glass-lite` | A single glass element that itself animates/transforms (hover-lift, modal, etc.) — includes `will-change: transform`. |
| `.liquid-glass-lite-static` | Multiple glass cards in a grid/list (hotel cards, dining cards) — same look, no `will-change`, so the GPU isn't taxed per idle card. |
| `.liquid-glass-lite-active` | Brighter/more opaque version for a glass element sitting **on top of another glass surface** — needs a stronger drop shadow and higher opacity border to separate it from the glass below. |

*There is also `.liquid-glass-lite-frame` (border + shadow only, no background/backdrop-filter) for wrapping WebGL/canvas content.*

**To restyle the material itself:** All the highlight/shadow values live inline in each variant in `globals.css`. Adjust the gradient stops, box-shadow layers, and border opacity directly there. Do not split these into separate tokens, as they function as a unified physics recipe.

### Interactive Components: Sliding Nav Pills & Segmented Controls

The desktop nav (`src/components/Navbar.tsx`) and any tabbed controls use a recessed `.neumorphic-track` wrapping the links, with a `.liquid-glass-lite-active` pill or solid convex button sliding behind whichever link is hovered/active.

- **Fluid Positioning:** The sliding pill's position is measured dynamically. A `useLayoutEffect` reads `getBoundingClientRect()` on the target link relative to the pill container and sets `left`/`width` via inline style, ensuring smooth, spring-like physical motion on hover change and window resize.
- **Active State Typography:** Active/hovered link text uses `text-quinary` (gold), matching the global "this is highlighted" color language. If text sits inside an active pill with a strong background color, apply a subtle text-shadow (debossed effect) to make the text feel physically engraved into the button.
