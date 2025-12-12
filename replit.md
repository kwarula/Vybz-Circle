# Vybz Circle - Kenya's Premier Event Discovery Platform

## Overview
Vybz Circle is a comprehensive mobile application designed to revolutionize event discovery, ticketing, and social engagement in Kenya. Positioned as "Kenya's Google Maps of Events," the platform addresses the fragmented nature of event information with a unified, intelligent discovery experience.

## Current State
- **Phase**: Frontend UI Implementation (Complete)
- **Stack**: Expo (React Native) + Express (TypeScript)
- **Design**: iOS 26 Liquid Glass UI with purple/blue gradient theme

## Project Structure

```
client/
├── App.tsx                    # Main app entry with providers
├── components/
│   ├── Avatar.tsx             # User avatar component
│   ├── Button.tsx             # Primary button with animation
│   ├── Card.tsx               # Base card component
│   ├── CategoryChip.tsx       # Category filter chips
│   ├── ErrorBoundary.tsx      # App error boundary
│   ├── EventCard.tsx          # Event card (full, compact, map variants)
│   ├── HeaderTitle.tsx        # Custom header with app icon
│   ├── MessageCard.tsx        # Crew message card
│   ├── SearchBar.tsx          # Search input component
│   ├── ThemedText.tsx         # Themed text component
│   ├── ThemedView.tsx         # Themed view component
│   └── VenueCard.tsx          # Venue listing card
├── constants/
│   └── theme.ts               # Design tokens (colors, spacing, typography)
├── data/
│   └── mockData.ts            # Mock data for events, venues, users
├── hooks/
│   ├── useColorScheme.ts      # Color scheme detection
│   ├── useScreenOptions.ts    # Navigation screen options
│   └── useTheme.ts            # Theme hook
├── lib/
│   └── query-client.ts        # React Query configuration
├── navigation/
│   ├── DiscoverStackNavigator.tsx
│   ├── HomeStackNavigator.tsx
│   ├── MainTabNavigator.tsx   # Bottom tab navigation
│   ├── MessagesStackNavigator.tsx
│   ├── ProfileStackNavigator.tsx
│   └── RootStackNavigator.tsx
└── screens/
    ├── DiscoverScreen.tsx     # Map view / events discovery
    ├── EventDetailScreen.tsx  # Event detail modal
    ├── HomeScreen.tsx         # Main feed with events
    ├── MessagesScreen.tsx     # Crew messages
    ├── ProfileScreen.tsx      # User profile
    └── VenuesScreen.tsx       # Top Spots listing

server/
├── index.ts                   # Express server entry
├── routes.ts                  # API routes
├── storage.ts                 # Data storage interface
└── templates/
    └── landing-page.html      # Landing page

shared/
└── schema.ts                  # Shared type definitions
```

## Design System

### Colors (from design_guidelines.md)
- **Primary**: Vybz Purple `#8B5CF6`
- **Secondary**: Electric Blue `#3B82F6`
- **Gradient**: Purple to Blue (135deg)
- **Background**: Light `#F8FAFC` / Dark `#0F0F0F`

### Navigation
- **Bottom Tabs**: Home, Discover, Messages, Profile
- **Screens**: Event Detail (modal), Top Spots

## Recent Changes
- December 2025: Initial UI implementation
  - Created all core screens matching reference design
  - Implemented event cards with attendees, premium badges
  - Added map view with event pins (native only)
  - Built profile with stats, menu items, upcoming events
  - Created crew messaging interface

## Commands
- `npm run all:dev` - Start both Expo and Express servers
- `npm run expo:dev` - Start Expo development server only
- `npm run server:dev` - Start Express server only

## User Preferences
- Dark mode native design preferred
- iOS 26 Liquid Glass UI style
- No emojis in the application
- Mobile-first experience

## Next Phase (Backend)
1. Supabase Auth integration (Google, Phone OTP, Apple)
2. PostgreSQL database for events, users, tickets
3. M-Pesa STK Push integration (Safaricom Daraja API)
4. AI voice search (Gemini/OpenAI)
5. Gamification system (Firestarter, Circuit, Turf Wars)
6. SOS safety features
