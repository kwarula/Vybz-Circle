# Vybz Circle - Compact Design Guidelines

## Core Philosophy
Speed, clarity, and excitement for Kenya's vibrant event culture. Dark-mode native, social-first, safety-conscious.

---

## Architecture

### Authentication Flow
- **Primary:** Google Sign-In | **Secondary:** Phone + OTP (M-Pesa) | **iOS:** Apple Sign-In
- **Onboarding:** Splash → Carousel (3 screens) → Sign-up → Phone verify → Progressive permissions → Interest grid → Home
- **Permissions:** Location (first map use), notifications (after first event interest)
- **Account Deletion:** Profile → Settings → Account Management → Delete (double confirm + wallet warning)

### Navigation Structure
**Bottom Tabs (4):**
1. Home - Personalized feed
2. Discover - Map view
3. Messages - Crew coordination
4. Profile - User, tickets, wallet

**FAB (Floating):** AI Search - Purple gradient, microphone icon, right-side above tabs

---

## Design Tokens

### Colors
**Primary:**
- Vybz Purple: `#8B5CF6` | Electric Blue: `#3B82F6`
- Gradient: `linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)`

**Neutrals:**
- Background: `#0F0F0F` | Surface: `#1A1A1A` | Surface Light: `#2A2A2A`
- Border: `#3A3A3A` | Text: `#FFFFFF` / `#A1A1A1` / `#6B6B6B`

**Semantic:**
- Success: `#10B981` | Warning: `#F59E0B` | Error: `#EF4444` | SOS: `#DC2626`

### Typography (System Fonts)
- **Hero:** 32px Bold | **H1:** 24px Bold | **H2:** 20px Semibold
- **H3:** 18px Semibold | **Body:** 16px Regular | **Small:** 14px Regular | **Tiny:** 12px Medium

### Spacing (px)
- xs: 4 | sm: 8 | md: 16 | lg: 24 | xl: 32 | 2xl: 48

---

## Components

### Buttons
**Primary (Gradient):**
```
Height: 56px | Radius: 12px | Text: White, Semibold 16px
Press: Opacity 0.85
```

**Secondary (Outline):**
```
Border: 2px #8B5CF6 | Text: #8B5CF6 Semibold 16px
Press: Background → Surface
```

**FAB:**
```
Size: 64px | Shadow: (0,4,8,0.15) | Position: Fixed bottom-right (80px/20px)
```

### Cards
**Event Card:**
```
Background: #1A1A1A | Radius: 16px | Padding: 16px | Shadow: (0,2,8,0.08)
Image: 16:9, radius 12px | Title: H3, 2 lines max
Metadata: Small text + icons | Actions: Outline + Gradient buttons
Press: Scale 0.98
```

**Ticket Tier:**
```
Border: 1px #3A3A3A | Radius: 12px
Selected: Border 2px #8B5CF6
```

### Inputs
```
Background: #2A2A2A | Border: 1px #3A3A3A (focus: #8B5CF6)
Height: 48px | Radius: 8px | Padding: 16px horizontal
```

### Safety - SOS Trigger
```
Position: Fixed top-right all screens
Activation: Double-tap OR shake (haptic)
Confirmation: Modal with 3s countdown
Emergency Mode: Full-screen red overlay
```

---

## Screen Specs

### Home Feed
**Header:** Transparent gradient overlay
- Left: Avatar → Profile | Center: Greeting | Right: Notifications
- Category chips (horizontal scroll)

**Content:** Vertical ScrollView
- Safe area: top = headerHeight + 32px, bottom = tabBarHeight + 32px
- Pull-to-refresh, infinite scroll, skeleton loaders
- Event cards: Featured image, premium badge, title, date/location, attendance avatars, actions

### Discover (Map)
**Header:** Semi-transparent search bar + filter
**Map:** Full-screen with custom purple pins, clustering (>5 events)
**Floating:** Bottom sheet (3 states), My Location button, filter chips
**Shadows:** All floating elements (0,2,4,0.1)

### Event Detail (Modal)
**Header:** Custom with close (X) + share, overlay on hero
**Content:** ScrollView
- Hero (300px) → Title (Hero) → Date/time/location cards → Description (expandable) → Ticket tiers → Organizer → Map preview (200px)
- Safe area bottom: 32px

**Footer:** Sticky bar - Wishlist + "Get Tickets" (gradient, 56px)

### Profile
**Header:** User name + settings gear
**Content:** ScrollView
- Profile card (120px avatar) → Tabs (All/Upcoming/Past) → Wallet → Gamification widgets → Tickets list
- Safe area: top 32px, bottom tabBarHeight + 32px

---

## Interactions

### Gestures
- Pull-to-refresh: Home, Tickets, Messages
- Swipe: Bottom sheet, card dismiss, tabs
- Long-press: Event card → Quick actions
- Double-tap/Shake: SOS activation

### Animations
- Transitions: Platform defaults
- List items: Stagger fade (50ms delay)
- Buttons: Scale 0.98 (150ms ease-out)
- Loading: Skeleton screens (<2s)
- Success: Confetti (ticket/check-in)

### Feedback
- Haptics: Success/error/warning
- Visual: Color, scale, shadow
- Audio: Check-in, tickets (toggleable)

---

## Accessibility

### Standards
- Touch targets: 44x44px min (primary actions: 56x56px)
- Contrast: WCAG AA (4.5:1), errors AAA (7:1)
- Localization: English, Swahili, Sheng (AI search)
- Date/Time: EAT timezone, optional 24hr

### Offline
- Cached data fallback
- Yellow "Offline Mode" banner
- Queue actions with sync icon

---

## Critical Assets

1. **Avatars:** 6 presets - Maasai patterns, Nairobi skyline, flag colors
2. **Empty States:** No events/tickets/messages illustrations
3. **Onboarding:** 3 hero illustrations (discovery, social, safety)
4. **Category Icons:** 24px custom (16 total: Amapiano, Reggae, Jazz, etc.)
5. **Gamification:** Firestarter flame, Bingo card, Turf Wars flag
6. **Safety Icons:** Shield, location pin, emergency contacts

**Style:** Bold colors, sharp contrast, energetic compositions

---

## Implementation Notes

### Stack Organization
- **Home:** Feed → Event Detail → Venue → Checkout → Tickets → Wallet
- **Discover:** Map → Preview Sheet → Filters → Category Browse
- **Messages:** Crew List → Chat → Event Thread
- **Profile:** Overview → Settings → Edit → Gamification → Safety → My Events

### Performance
- Infinite scroll with skeleton loaders
- Image ratio: 16:9 (optimize for mobile)
- Animations: 150ms max for interactions
- Cache strategy for offline capability