---
version: alpha
name: Tomorro-design-analysis
description: A friendly, high-trust SaaS interface anchored on deep forest-green hero and CTA bands, punctuated by a signature lime-green accent used for buttons, highlights, and badges. Warm off-white and pale-green surfaces carry the feature and testimonial content between the dark bands. Type runs heavy, tightly-tracked, uppercase display headlines paired with relaxed sentence-case body copy. Every corner in the system is rounded — from pill-shaped buttons and avatar badges to fully-rounded cards and photography — giving the brand an approachable, "human SaaS" feel rather than an enterprise-chrome one.

colors:
  primary: "#c8f24c"
  ink: "#12261c"
  body: "#4f5f54"
  body-strong: "#2b3d33"
  muted: "#8a9a8e"
  hairline: "#e3eae0"
  hairline-strong: "#cddcc9"
  canvas: "#ffffff"
  surface-card: "#ffffff"
  surface-soft: "#eef8df"
  surface-elevated: "#dff2c4"
  on-primary: "#12261c"
  on-dark: "#ffffff"
  dark-green: "#1b3b2c"
  dark-green-deep: "#12281e"
  lime-accent: "#c8f24c"
  lime-light: "#e4ffa8"
  cream: "#faf8f0"
  badge-orange: "#f4a13a"
  badge-pink: "#f4b8c8"
  badge-blue: "#a7c7e7"
  warning: "#f4a13a"
  success: "#3fa34d"

typography:
  display-xl:
    fontFamily: "General Sans, Aeonik, sans-serif"
    fontSize: 56px
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: -0.5px
  display-lg:
    fontFamily: "General Sans, Aeonik, sans-serif"
    fontSize: 40px
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: -0.5px
  display-md:
    fontFamily: "General Sans, Aeonik, sans-serif"
    fontSize: 32px
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: 0
  display-sm:
    fontFamily: "General Sans, Aeonik, sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0
  title-lg:
    fontFamily: "General Sans, sans-serif"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0
  title-md:
    fontFamily: "General Sans, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  title-sm:
    fontFamily: "General Sans, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  label-uppercase:
    fontFamily: "General Sans, sans-serif"
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 1px
  body-md:
    fontFamily: "Inter, General Sans, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body-sm:
    fontFamily: "Inter, General Sans, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  caption:
    fontFamily: "Inter, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.2px
  button:
    fontFamily: "General Sans, sans-serif"
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0
  nav-link:
    fontFamily: "General Sans, sans-serif"
    fontSize: 15px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  none: 0px
  xs: 8px
  sm: 12px
  md: 20px
  lg: 32px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 40px
  xxl: 64px
  section: 96px

components:
  button-primary:
    backgroundColor: "{colors.dark-green}"
    textColor: "{colors.on-dark}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: 14px 28px
    height: 48px
  button-accent:
    backgroundColor: "{colors.lime-accent}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: 14px 28px
    height: 48px
  button-outline:
    backgroundColor: transparent
    textColor: "{colors.on-dark}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: 14px 28px
    height: 48px
  button-play:
    backgroundColor: transparent
    textColor: "{colors.on-dark}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: 12px 20px
  top-nav:
    backgroundColor: "{colors.dark-green}"
    textColor: "{colors.on-dark}"
    typography: "{typography.nav-link}"
    height: 72px
  hero-band:
    backgroundColor: "{colors.dark-green}"
    textColor: "{colors.on-dark}"
    typography: "{typography.display-xl}"
    rounded: "{rounded.lg}"
    padding: 96px
  floating-chat-bubble:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: 12px 16px
  avatar-badge:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 6px 14px
  logo-strip:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.muted}"
    typography: "{typography.body-sm}"
    padding: 40px
  feature-panel:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 40px
  pill-tab:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    typography: "{typography.label-uppercase}"
    rounded: "{rounded.full}"
    padding: 10px 20px
  pill-tab-active:
    backgroundColor: "{colors.dark-green}"
    textColor: "{colors.on-dark}"
    typography: "{typography.label-uppercase}"
    rounded: "{rounded.full}"
    padding: 10px 20px
  video-card:
    backgroundColor: "{colors.dark-green-deep}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.lg}"
  team-photo-card:
    backgroundColor: "{colors.dark-green}"
    textColor: "{colors.on-dark}"
    typography: "{typography.title-lg}"
    rounded: "{rounded.md}"
    padding: 24px
  case-study-card:
    backgroundColor: "{colors.dark-green}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 40px
  testimonial-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 24px
  quote-card-dark:
    backgroundColor: "{colors.dark-green-deep}"
    textColor: "{colors.on-dark}"
    typography: "{typography.title-md}"
    rounded: "{rounded.md}"
    padding: 24px
  award-badge:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 8px 16px
  carousel-arrow:
    backgroundColor: "{colors.dark-green}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.full}"
    size: 44px
  footer:
    backgroundColor: "{colors.dark-green-deep}"
    textColor: "{colors.hairline-strong}"
    typography: "{typography.body-sm}"
    padding: 64px
---

## Overview

Tomorro's marketing surface pairs a deep forest-green canvas (`{colors.dark-green}` — #1b3b2c) with warm off-white and pale-green surfaces (`{colors.canvas}`, `{colors.surface-soft}`), stitched together by a single **signature lime-green accent** (`{colors.lime-accent}` — #c8f24c) that carries almost all of the brand's energy. Unlike a cold enterprise-SaaS palette, the system leans approachable: every corner is rounded, avatar bubbles and rating badges float over the hero photography, and the type voice mixes a heavy, tightly-tracked display face with relaxed, friendly body copy.

The layout alternates **dark forest-green bands** (hero, case-study proof section, awards band is the exception — light) with **light bands** (feature panels, testimonial grid, logo strip) to create rhythm down the page. Rounded pill shapes are the connective tissue of the whole system — buttons, tabs, avatar badges, and even large hero/panel containers all resolve to a rounded silhouette rather than the sharp rectangles of a technical/engineering brand.

**Key Characteristics:**
- Deep forest-green (`{colors.dark-green}` — #1b3b2c) hero, footer, and proof-point bands contrast against white and pale-green (`{colors.surface-soft}` — #eef8df) feature bands.
- A single lime-green accent (`{colors.lime-accent}` — #c8f24c) does the brand's heavy lifting — CTA buttons, star ratings, bullet dots, small badges — and is used sparingly enough that it always reads as "the brand color."
- Display headlines are heavy weight (800), tightly tracked, and set in sentence case or mixed case — never full UPPERCASE the way a motorsport/technical brand would use it.
- Rounded corners dominate: `{rounded.full}` pill buttons and avatar badges, `{rounded.lg}` (32px) hero/panel containers, `{rounded.md}` (20px) photo and testimonial cards. Sharp `{rounded.none}` corners essentially never appear.
- Floating avatar bubbles and small chat-style badges are scattered across the hero photography — a "social proof as decoration" pattern unique to this system.
- Spacing is generous and airy: `{spacing.section}` (96px) between major bands, with rounded full-bleed panels nested inside a centered, padded page container (never true edge-to-edge like a photography-led brand).

## Colors

### Brand & Accent
- **Primary / Lime Accent** (`{colors.lime-accent}` — #c8f24c): The system's single loudest color. Used on primary CTA buttons, star-rating icons, small bullet accents inside feature lists, and highlight dots. Reads as "the Tomorro color" precisely because it appears nowhere else.
- **Dark Green** (`{colors.dark-green}` — #1b3b2c): The brand's primary dark surface — hero band, case-study/proof band, team-role cards. Functions the way a near-black canvas would in a colder brand, but carries warmth.
- **Dark Green Deep** (`{colors.dark-green-deep}` — #12281e): A near-black forest tone used for the footer and for dark quote cards nested inside proof sections — one step darker than `{colors.dark-green}` for visual layering.
- **Cream** (`{colors.cream}` — #faf8f0): Used on floating avatar/chat badges layered over the dark hero photography — warmer than pure white so it sits comfortably on green.

### Surface
- **Canvas** (`{colors.canvas}` — #ffffff): Default page floor for feature, logo-strip, and testimonial bands.
- **Surface Soft** (`{colors.surface-soft}` — #eef8df): Pale green used for the "Never miss a deadline" feature panel and the "Designed for the entire company" / awards bands — a light echo of the dark-green brand color.
- **Surface Elevated** (`{colors.surface-elevated}` — #dff2c4): A slightly stronger pale green for nested elements inside soft-green panels (e.g. hover/active states on light surfaces).
- **Badge tones** (`{colors.badge-orange}`, `{colors.badge-pink}`, `{colors.badge-blue}`): Soft pastel tones used only on small circular avatar-badge accents scattered across the hero — decorative, not systemic brand colors.

### Hairlines & Borders
- **Hairline** (`{colors.hairline}` — #e3eae0): Faint divider tone used between logo-strip items and beneath card content on light surfaces.
- **Hairline Strong** (`{colors.hairline-strong}` — #cddcc9): Slightly stronger border used around light cards sitting on white (e.g. testimonial card outlines).

### Text
- **Ink** (`{colors.ink}` — #12261c): Primary text color on light/white surfaces — a near-black tinted with green rather than pure black.
- **On Dark** (`{colors.on-dark}` — #ffffff): All headline and primary text on the dark-green bands.
- **Body** (`{colors.body}` — #4f5f54): Default running-text color on light surfaces — muted sage-gray.
- **Body Strong** (`{colors.body-strong}` — #2b3d33): Emphasized body copy / lead paragraphs on light surfaces.
- **Muted** (`{colors.muted}` — #8a9a8e): Footer links, captions, secondary metadata.

### Semantic
- **Warning** (`{colors.warning}` — #f4a13a): Reused from the orange badge tone; used sparingly for alert-style callouts.
- **Success** (`{colors.success}` — #3fa34d): Confirmation states, rarely surfaced on marketing pages.

## Typography

### Font Family
The display face reads as a rounded, geometric grotesk (General Sans / Aeonik-class) at heavy weight (800) — confident but never aggressive, thanks to rounded terminals and tight negative tracking at large sizes. Body copy switches to a humanist sans (Inter-class) at regular weight for warmth and legibility. Fallback stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.

The pairing is:
- Display (800, tight tracking) for hero headlines, section titles, and large stat/quote callouts — the "confident" voice
- Body (400, relaxed line-height) for paragraphs, card descriptions, and testimonial copy — the "friendly, human" voice

Unlike a fully-uppercase technical brand, Tomorro's headlines are set in sentence case or mixed case with occasional full caps reserved only for very short section eyebrows ("OUR FEATURES", "OUR CUSTOMERS").

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 56px | 800 | 1.05 | -0.5px | Hero h1 ("Contract management that drives every team forward") |
| `{typography.display-lg}` | 40px | 800 | 1.1 | -0.5px | Section heads ("Designed for the entire company") |
| `{typography.display-md}` | 32px | 800 | 1.15 | 0 | Sub-section heads ("Our features") |
| `{typography.display-sm}` | 24px | 700 | 1.2 | 0 | CTA-band heads ("Ready to take control of your contract management?") |
| `{typography.title-lg}` | 20px | 700 | 1.3 | 0 | Card titles (team-role cards, testimonial names) |
| `{typography.title-md}` | 18px | 600 | 1.4 | 0 | Feature panel sub-heads, quote text |
| `{typography.title-sm}` | 16px | 600 | 1.4 | 0 | Small card headers |
| `{typography.label-uppercase}` | 12px | 700 | 1.3 | 1px | Eyebrow labels, pill-tab text ("Repository · Generation · Collaboration") |
| `{typography.body-md}` | 16px | 400 | 1.6 | 0 | Default paragraph copy |
| `{typography.body-sm}` | 14px | 400 | 1.55 | 0 | Testimonial quotes, footer body, captions |
| `{typography.caption}` | 12px | 500 | 1.4 | 0.2px | Avatar badge text, rating counts ("4.9 on G2") |
| `{typography.button}` | 15px | 600 | 1.0 | 0 | All button labels — sentence case, no letter-spacing |
| `{typography.nav-link}` | 15px | 500 | 1.4 | 0 | Top-nav menu items |

### Principles
Display type stays heavy (800) with tight negative tracking at large sizes, but never goes full uppercase except on short eyebrow labels — this is the opposite instinct from a technical/motorsport brand, and it's what makes Tomorro read as approachable SaaS rather than industrial. Body copy is generously spaced (1.55–1.6 line-height) to keep long feature descriptions easy to scan. Button labels are sentence case with zero letter-spacing — rounded pill shape carries the "premium" feeling instead of tracked caps.

### Note on Font Substitutes
If General Sans / Aeonik is unavailable, **Inter** at weight 800 for display and 400 for body is a close, freely-licensed substitute — Inter's rounded numerals and open apertures match the friendly tone. **Plus Jakarta Sans** is a good alternative if a slightly warmer, more rounded display face is desired.

## Layout

### Spacing System
- **Base unit:** 4px.
- **Tokens:** `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 40px · `{spacing.xxl}` 64px · `{spacing.section}` 96px.
- **Section padding (vertical):** `{spacing.section}` (96px) between major bands (hero → logo strip → features → video → team → case study → testimonials → awards → CTA → footer).
- **Hero band:** `{spacing.xxl}` (64px) internal vertical padding, with floating avatar badges positioned absolutely at the band's outer edges.
- **Card internal padding:** `{spacing.xl}` (40px) for feature panels and case-study cards; `{spacing.lg}` (24px) for testimonial and team-role cards.
- **Gutters:** `{spacing.lg}` (24px) between cards in 3-up grids; `{spacing.md}` (16px) inside the logo strip.

### Grid & Container
- **Max content width:** ~1200px centered, with generous side margins — narrower than a photography-led brand since content sits inside rounded panel containers rather than bleeding full-width.
- **Editorial body:** 12-column grid; dark and light bands alternate but never bleed truly edge-to-edge — every band is a rounded panel inset within the page margin.
- **Card grids:** 3-up at desktop (team-role cards, testimonial cards), 2-up at tablet, 1-up at mobile.
- **Footer:** 4-column link list at desktop, 2-up at tablet, 1-up at mobile.

### Whitespace Philosophy
Tomorro trusts rounded containers and color-blocking to organize the page rather than photography alone. Whitespace between bands is generous and consistent (`{spacing.section}`, 96px), and each band is visually "boxed" via rounded corners and a distinct background color rather than separated by hairlines. The rhythm of dark-green → white → pale-green → white → dark-green gives the page its shape even before reading any copy.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Flat | No shadow, no border | Body text sections, logo strip, footer |
| Soft hairline | 1px `{colors.hairline}` border | Testimonial card outlines, logo-strip dividers |
| Card surface | `{colors.surface-soft}` or `{colors.canvas}` background over page floor, subtle soft shadow | Feature panels, testimonial cards, team-role cards |
| Floating badge | Small rounded `{colors.cream}` chip with soft shadow, positioned absolutely over photography | Avatar/chat bubbles scattered across the hero |
| Color-block depth | Full rounded dark-green or pale-green panel against the white page floor | Hero band, case-study band, awards band, CTA band |

The system uses soft, low-contrast shadows sparingly — most depth comes from color-blocking (dark panel against white page) rather than photography or heavy shadow work. Floating avatar badges are the system's signature "decorative depth" device — small elevated chips that imply social proof without a testimonial section.

### Decorative Depth
- **Floating avatar/chat badges**: Small pill-shaped `{colors.cream}` chips carrying a circular avatar photo, a name/label, and sometimes a tiny chat-bubble tail — scattered over the hero photography at varied rotations. This is the system's most distinctive non-typographic element.
- **Star-rating rows**: Five lime-green star icons paired with a caption ("4.9 on G2", "4.9 on Capterra") — a repeated trust-signal motif under CTAs.
- **Wavy line-art**: A thin decorative squiggle/line-art illustration (seen in the awards band) rendered in `{colors.dark-green}` on the pale-green background — a single illustrative flourish, not a system-wide pattern.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.full}` | 9999px | All buttons, avatar badges, pill tabs, star/rating chips, carousel arrows — the dominant radius |
| `{rounded.lg}` | 32px | Hero band, feature panels, case-study band, CTA band — large color-block containers |
| `{rounded.md}` | 20px | Photo cards, testimonial cards, team-role cards, quote cards |
| `{rounded.sm}` | 12px | Small nested UI elements inside the feature-panel product screenshot |
| `{rounded.xs}` | 8px | Rare — small inline chips |
| `{rounded.none}` | 0px | Essentially unused — the system has no sharp corners |

The radius hierarchy is "almost always rounded, radius scales with size." Large containers get a large radius (32px), medium cards get 20px, and anything interactive (buttons, tabs, badges) goes fully pill-shaped. This is a deliberate brand-language choice — soft geometry reads as approachable and human, the opposite of BMW M's engineered sharp-rectangle language.

### Photography Geometry
Hero and case-study photography sits inside rounded `{rounded.lg}` (32px) panel containers rather than bleeding full-width — the photo is always visibly "contained" by a rounded frame. Team-role and testimonial photos use rounded `{rounded.md}` (20px) corners at roughly 4:5 or 1:1 crops. Avatar photos throughout the page (floating badges, testimonial authors) are always perfect circles (`{rounded.full}`).

## Components

### Top Navigation

**`top-nav`** — Dark forest-green nav bar pinned to the top of the page. ~72px tall, `{colors.dark-green}` background. Carries the Tomorro logo at left, primary horizontal menu (Product, Solutions, Pricing, Resources) with dropdown chevrons, right-side language selector, "Sign in" text link, and a lime or outline "Schedule a demo" pill button. Menu items render in `{typography.nav-link}`, sentence case.

### Buttons

**`button-primary`** — Solid dark-green pill button used inside light-surface contexts. Background `{colors.dark-green}`, text `{colors.on-dark}`, fully rounded (`{rounded.full}`), padding 14px × 28px, height ~48px. Type `{typography.button}` — sentence case, no letter-spacing.

**`button-accent`** — The signature lime CTA. Background `{colors.lime-accent}`, text `{colors.on-primary}` (dark green), same pill shape and sizing as `button-primary`. Reserved for the highest-priority conversion actions.

**`button-outline`** — Transparent background with a light outline, white text — used over the dark-green hero band where a filled button would compete with the badges/photography.

**`button-play`** — A secondary CTA pairing a small circular play-icon chip with a text label ("See a demo video"), transparent background, used beside the primary CTA in the hero.

**`carousel-arrow`** — Circular 44 × 44px arrow buttons in `{colors.dark-green}` with a white chevron, used to page through the testimonial carousel. The only small circular control in the system besides avatars.

### Cards & Containers

**`hero-band`** — Full-width rounded dark-green panel (`{rounded.lg}`) holding the h1 in `{typography.display-xl}`, a supporting paragraph in `{typography.body-md}`, two CTA buttons, a star-rating row, and floating `{component.avatar-badge}` chips scattered at the corners over a product-screenshot/photo backdrop. Vertical padding `{spacing.xxl}` (64px).

**`feature-panel`** — Large pale-green (`{colors.surface-soft}`) rounded panel (`{rounded.lg}`) used for "Our features." Left side carries an eyebrow pill-tab row, a `{typography.display-md}` headline, a short paragraph, a bulleted list with lime-green check accents, and a `{component.button-primary}`; right side holds a rounded product-screenshot card.

**`team-photo-card`** — Used in the 3-up "Designed for the entire company" grid. Dark-green rounded card (`{rounded.md}`) with a photo filling the top ~70%, a `{typography.title-lg}` role label overlaid at the bottom in white, and a small lime or outline "See case study" pill button.

**`case-study-card`** — A two-column dark-green rounded panel (`{rounded.lg}`) pairing a customer logo/name with a "Challenge" / "Solution" two-cell layout (each cell an icon + heading + short paragraph), followed by a nested `{component.quote-card-dark}` pull-quote with an avatar and name/title.

**`quote-card-dark`** — A slightly-darker rounded card (`{rounded.md}`) nested inside the case-study band, holding a `{typography.title-md}` pull-quote and a small avatar + name/title caption below.

**`testimonial-card`** — White rounded card (`{rounded.md}`) with a thin `{colors.hairline-strong}` border, holding a lime five-star row, a `{typography.body-sm}` quote, and an avatar + name/role/company caption at the bottom. Arranged in a horizontally-scrollable row with `{component.carousel-arrow}` controls.

**`award-badge`** — Small white rounded pill (`{rounded.full}`) with an icon, a bolded label ("Leader"), and a smaller caption ("Winter 2025") — arranged in a row inside the pale-green awards band alongside a star-rating chip and a `{component.button-accent}`.

**`avatar-badge`** — The floating hero decoration: a small cream rounded-rectangle or pill chip (`{rounded.lg}`/`{rounded.full}`) containing a circular avatar photo and a short label or chat-style snippet, positioned absolutely over the hero photography at slight rotations.

**`logo-strip`** — A centered row of partner/customer wordmark logos in muted gray, sitting on a plain white band beneath a small caption ("1000+ companies manage their contracts with Tomorro").

### Inputs & Forms

**`pill-tab`** + **`pill-tab-active`** — Rounded feature-category selector ("Repository · Generation · Collaboration · E-signature") sitting above the feature panel. Inactive tabs: transparent/white background, `{colors.body}` text. Active tab: filled `{colors.dark-green}` background, white text, fully rounded (`{rounded.full}`).

**`text-input`** *(inferred — not directly visible in the captured screenshot, documented for completeness of the component set)*: Would follow the system's rounded language — `{rounded.sm}`/`{rounded.md}` corners, `{colors.canvas}` background, 1px `{colors.hairline}` border, `{typography.body-md}` text.

### Footer

**`footer`** — Deep forest-green (`{colors.dark-green-deep}`) band closing the page. 4-column link list (Teams / Product / Resources / Contact) plus a "Use cases" sub-list. Top row carries a small sustainability callout ("we dedicate 1% of our revenues to eliminating carbon dioxide") with a `{component.button-outline}`-style "Learn more" pill. Bottom strip holds legal links and social icons in `{colors.muted}`. Vertical padding 64px.

## Do's and Don'ts

### Do
- Reserve the lime-green accent (`{colors.lime-accent}`) for the single highest-priority action per section — its power comes from scarcity.
- Round every corner. Large containers get `{rounded.lg}` (32px), cards get `{rounded.md}` (20px), and anything tappable goes fully pill-shaped (`{rounded.full}`).
- Alternate dark-green and light/pale-green bands to create page rhythm — never stack two dark bands or two white bands back-to-back.
- Use floating avatar badges and star-rating rows as lightweight, ambient social proof rather than relying only on a dedicated testimonials section.
- Keep display headlines sentence-case and heavy (800) rather than full uppercase — uppercase is reserved for short eyebrow labels only.
- Use `{spacing.section}` (96px) between major bands for consistent vertical rhythm.

### Don't
- Don't introduce a second saturated accent color alongside the lime green — pastel badge tones stay decorative and never compete with it as a CTA color.
- Don't use sharp `{rounded.none}` corners anywhere in the system — even technical/product-screenshot cards keep soft rounding.
- Don't set headlines in full uppercase at display sizes — this brand's confidence comes from weight and rounded geometry, not all-caps tracking.
- Don't let photography bleed true edge-to-edge; it should always sit inside a rounded panel container with visible page margin around it.
- Don't stack more than one dark-green band consecutively — the alternation with white/pale-green is the page's structural backbone.
- Don't apply heavy drop shadows; depth comes from color-blocking and soft, low-contrast shadows only.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 768px | Hamburger nav; hero h1 scales 56→32px; floating avatar badges reduce to 2–3 and reposition inline; card grids 1-up; footer 4 cols → 1 |
| Tablet | 768–1024px | Top nav stays horizontal but tightens; 2-up card grids; case-study two-column layout stacks to single column |
| Desktop | 1024–1440px | Full top-nav; 3-up card grids; case-study/feature panels stay two-column |
| Wide | > 1440px | Same as desktop with more breathing room; max content ~1200px, centered with wide margins |

### Touch Targets
- `{component.button-primary}` and `{component.button-accent}` render at 48px height minimum — meets WCAG AAA.
- `{component.carousel-arrow}` is 44 × 44px, at the accessible minimum.
- `{component.pill-tab}` renders with 10px vertical padding; effective tap area meets 44px with surrounding spacing.
- `{component.avatar-badge}` chips are decorative on desktop and are simplified (fewer, larger) on mobile to avoid accidental taps.

### Collapsing Strategy
- Top nav collapses to a hamburger sheet at < 768px; the menu opens as a full-screen dark-green overlay.
- Rounded panel containers (hero, feature, case-study, CTA bands) retain their rounded corners at every breakpoint but reduce internal padding from `{spacing.xxl}` to `{spacing.lg}` on mobile.
- Card grids reduce columns before shrinking card content — 3-up → 2-up → 1-up, with cards keeping their full padding and rounded corners.
- The testimonial carousel becomes swipeable (touch-drag) on mobile in place of the visible arrow controls.
- Floating avatar badges reduce in count and reposition to avoid overlapping the h1 on narrow viewports.

### Image Behavior
- Hero and case-study photography crops responsively within its rounded panel — wider crops at desktop, taller/vertical crops on mobile.
- Team-role and testimonial photos retain their aspect ratio and rounded corners at every breakpoint.
- The logo strip wraps to 2 rows on mobile rather than shrinking logos below a legible size.

## Iteration Guide

1. Focus on ONE component at a time. Reference its YAML key (`{component.hero-band}`, `{component.testimonial-card}`).
2. New components default to `{rounded.md}` (20px) for cards and `{rounded.full}` for anything interactive. Only use `{rounded.none}` if a genuinely new sharp-edged pattern is confirmed from further screenshots.
3. Variants (`-active`, `-disabled`) live as separate entries in `components:`.
4. Use `{token.refs}` everywhere — never inline hex.
5. Never document hover states. Default and Active/Pressed only.
6. Display headlines stay heavy (800) and sentence-case; reserve true uppercase for short eyebrow labels. Never blur the contrast between the two.
7. The lime-green accent is CTA/highlight-only — never extend it to large background fills.
8. When in doubt about emphasis: bigger rounded color-block panel before bigger type.

## Known Gaps

- Exact hex values for `{colors.dark-green}`, `{colors.lime-accent}`, and `{colors.surface-soft}` are estimated from visual sampling of the provided screenshot; a pixel-level color-picker pass against production assets would refine these.
- The precise display typeface is not confirmed from metadata — "General Sans / Aeonik" is a best-fit visual match; actual font-family names would need to be confirmed from page source or brand guidelines.
- Form components (text inputs, dropdowns, validation states) are not visible in the captured screenshot and are documented here only as inferred extensions of the system's rounded language.
- Animation and transition timings (carousel auto-play, hover-reveal on cards, badge micro-animations) are not in scope — none were observable in a static screenshot.
- The product-screenshot content nested inside the feature panel (the contract-repository UI) is out of scope for this brand-level analysis; its own internal design system would need a dedicated pass.
- Only one hero variant was captured; alternate hero states (e.g. video playing, different avatar-badge arrangements) may carry variations not documented here.
- Dark-mode or alternate-theme treatments were not present in the analyzed screenshot and are not documented.
