export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  venue: string;
  imageUrl: string;
  price: number;
  currency: string;
  category: string;
  attendees: number;
  isPremium: boolean;
  isGoing: boolean;
  rating: number;
  description: string;
  organizer: {
    name: string;
    avatar: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  imageUrl: string;
  rating: number;
  category: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Message {
  id: string;
  crewName: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  members: User[];
}

export const mockUsers: User[] = [
  { id: "1", name: "Alex M.", avatar: "https://i.pravatar.cc/150?img=1" },
  { id: "2", name: "Sarah K.", avatar: "https://i.pravatar.cc/150?img=2" },
  { id: "3", name: "James O.", avatar: "https://i.pravatar.cc/150?img=3" },
  { id: "4", name: "Lisa N.", avatar: "https://i.pravatar.cc/150?img=4" },
  { id: "5", name: "Mike T.", avatar: "https://i.pravatar.cc/150?img=5" },
];

export const currentUser: User = {
  id: "0",
  name: "Vincent",
  avatar: "https://i.pravatar.cc/150?img=68",
};

export const mockEvents: Event[] = [
  {
    id: "1",
    title: "Sunset Yoga & Chill",
    date: "Thu, 10 Apr 2025",
    time: "11:00 AM",
    location: "Westlands, Nairobi",
    venue: "Skyline Rooftop",
    imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
    price: 0,
    currency: "KES",
    category: "Wellness",
    attendees: 15,
    isPremium: false,
    isGoing: true,
    rating: 4.5,
    description: "Join us for a relaxing sunset yoga session with breathtaking views of the city. Perfect for all skill levels. Mats and refreshments provided.",
    organizer: { name: "Samantha William", avatar: "https://i.pravatar.cc/150?img=5" },
    coordinates: { latitude: -1.2636, longitude: 36.8030 },
  },
  {
    id: "2",
    title: "Amapiano Night Live",
    date: "Fri, 11 Apr 2025",
    time: "9:00 PM",
    location: "Kilimani, Nairobi",
    venue: "Club Nexus",
    imageUrl: "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=800",
    price: 1500,
    currency: "KES",
    category: "Music",
    attendees: 234,
    isPremium: true,
    isGoing: false,
    rating: 4.8,
    description: "The biggest Amapiano party in Nairobi! Featuring top DJs from South Africa and Kenya. VIP tables available.",
    organizer: { name: "Rafael Maetimo", avatar: "https://i.pravatar.cc/150?img=11" },
    coordinates: { latitude: -1.2870, longitude: 36.7880 },
  },
  {
    id: "3",
    title: "Beachside Picnic",
    date: "Sat, 12 Apr 2025",
    time: "2:00 PM",
    location: "Diani Beach",
    venue: "The Boardwalk",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    price: 2500,
    currency: "KES",
    category: "Social",
    attendees: 45,
    isPremium: false,
    isGoing: false,
    rating: 4.5,
    description: "A beautiful beachside picnic with gourmet food, live acoustic music, and games. Bring your friends!",
    organizer: { name: "Beach Club KE", avatar: "https://i.pravatar.cc/150?img=20" },
    coordinates: { latitude: -4.3156, longitude: 39.5748 },
  },
  {
    id: "4",
    title: "Tech Startup Meetup",
    date: "Sun, 13 Apr 2025",
    time: "3:00 PM",
    location: "Westlands, Nairobi",
    venue: "iHub",
    imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800",
    price: 0,
    currency: "KES",
    category: "Networking",
    attendees: 87,
    isPremium: false,
    isGoing: false,
    rating: 4.2,
    description: "Connect with fellow entrepreneurs, investors, and tech enthusiasts. Pitch sessions and networking opportunities.",
    organizer: { name: "iHub Kenya", avatar: "https://i.pravatar.cc/150?img=30" },
    coordinates: { latitude: -1.2636, longitude: 36.8090 },
  },
  {
    id: "5",
    title: "Jazz Night Under Stars",
    date: "Mon, 14 Apr 2025",
    time: "7:00 PM",
    location: "Karen, Nairobi",
    venue: "The Alchemist",
    imageUrl: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800",
    price: 3000,
    currency: "KES",
    category: "Music",
    attendees: 120,
    isPremium: true,
    isGoing: false,
    rating: 4.9,
    description: "An intimate evening of smooth jazz with Kenya's finest musicians. Premium cocktails and fine dining available.",
    organizer: { name: "Jazz Kenya", avatar: "https://i.pravatar.cc/150?img=40" },
    coordinates: { latitude: -1.3177, longitude: 36.7128 },
  },
  {
    id: "6",
    title: "Comedy Night",
    date: "Tue, 15 Apr 2025",
    time: "8:00 PM",
    location: "CBD, Nairobi",
    venue: "K1 Klubhouse",
    imageUrl: "https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=800",
    price: 1000,
    currency: "KES",
    category: "Comedy",
    attendees: 200,
    isPremium: false,
    isGoing: true,
    rating: 4.6,
    description: "Laugh out loud with Kenya's top comedians! Food and drinks available. Limited seats.",
    organizer: { name: "Churchill Show", avatar: "https://i.pravatar.cc/150?img=50" },
    coordinates: { latitude: -1.2864, longitude: 36.8172 },
  },
  {
    id: "ts-external-1",
    title: "Nairobi Festival 2025",
    date: "Sat, 20 Dec 2024",
    time: "10:00 AM",
    location: "CBD, Nairobi",
    venue: "Uhuru Park",
    imageUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800",
    price: 1500,
    currency: "KES",
    category: "Festival",
    attendees: 540,
    isPremium: true,
    isGoing: false,
    rating: 4.9,
    description: "The biggest cultural festival in Nairobi! Music, food, and art from across the country. Tickets available exclusively on TicketSasa.",
    organizer: { name: "Nairobi County", avatar: "https://i.pravatar.cc/150?img=51" },
    coordinates: { latitude: -1.2891, longitude: 36.8177 },
    // @ts-ignore
    is_external: true,
    source_url: "https://ticketsasa.com/events/details/nairobi_festival_2024",
    price_range: "From KES 1,500"
  },
];

export const mockVenues: Venue[] = [
  {
    id: "1",
    name: "Ember & Oak",
    address: "55 Grove Street, Westlands",
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
    rating: 4.5,
    category: "Restaurants",
  },
  {
    id: "2",
    name: "Luna Bistro",
    address: "410 Sunset Blvd, Kilimani",
    imageUrl: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800",
    rating: 4.5,
    category: "Restaurants",
  },
  {
    id: "3",
    name: "Saffron Soul",
    address: "89 Curry Lane, Karen",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
    rating: 4.5,
    category: "Restaurants",
  },
  {
    id: "4",
    name: "The Marble Table",
    address: "14 West 22nd St, Lavington",
    imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800",
    rating: 4.5,
    category: "Restaurants",
  },
  {
    id: "5",
    name: "Komorebi Kitchen",
    address: "22 Willow St, Westlands",
    imageUrl: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800",
    rating: 4.5,
    category: "Restaurants",
  },
  {
    id: "6",
    name: "Sky Lounge",
    address: "Tower Top, CBD",
    imageUrl: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800",
    rating: 4.7,
    category: "Bars",
  },
  {
    id: "7",
    name: "Uhuru Gardens",
    address: "Langata Road",
    imageUrl: "https://images.unsplash.com/photo-1587653915936-5623d64a9f0c?w=800",
    rating: 4.3,
    category: "Parks",
  },
  {
    id: "8",
    name: "Java House Karen",
    address: "Karen Shopping Centre",
    imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
    rating: 4.4,
    category: "Cafe",
  },
];

export const mockMessages: Message[] = [
  {
    id: "1",
    crewName: "Weekend Warriors",
    lastMessage: "Who's going to Amapiano Night?",
    timestamp: "2m ago",
    unreadCount: 3,
    members: mockUsers.slice(0, 4),
  },
  {
    id: "2",
    crewName: "Yoga Squad",
    lastMessage: "See you all tomorrow at 11!",
    timestamp: "1h ago",
    unreadCount: 0,
    members: mockUsers.slice(1, 3),
  },
  {
    id: "3",
    crewName: "Tech Founders",
    lastMessage: "Great meetup yesterday!",
    timestamp: "3h ago",
    unreadCount: 1,
    members: mockUsers.slice(2, 5),
  },
  {
    id: "4",
    crewName: "Jazz Lovers",
    lastMessage: "Anyone got extra tickets?",
    timestamp: "Yesterday",
    unreadCount: 0,
    members: mockUsers.slice(0, 2),
  },
];

export const categories = [
  "All",
  "Music",
  "Wellness",
  "Social",
  "Networking",
  "Comedy",
  "Sports",
  "Food",
];

export const venueCategories = [
  "Restaurants",
  "Bars",
  "Parks",
  "Cafe",
  "Rooftops",
];

// ========================================
// CIRCLE TYPES & MOCK DATA
// ========================================

export type MemberStatus = 'ready' | 'getting_ready' | 'running_late' | 'offline';

export interface CircleMember extends User {
  status: MemberStatus;
  eta?: number; // minutes if running late
  isLocationSharing: boolean;
}

export type ActivityType = 'location_share' | 'event_add' | 'check_in' | 'message' | 'bill_split';

export interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  type: ActivityType;
  timestamp: string;
  description: string;
}

export interface Circle {
  id: string;
  name: string;
  emoji: string;
  color: string;
  members: CircleMember[];
  activeEvent?: Event;
  statusMessage: string;
  recentActivity: ActivityItem[];
}

const circleMembers: CircleMember[] = [
  { ...mockUsers[0], status: 'ready', isLocationSharing: true },
  { ...mockUsers[1], status: 'getting_ready', isLocationSharing: false },
  { ...mockUsers[2], status: 'running_late', eta: 15, isLocationSharing: true },
  { ...mockUsers[3], status: 'offline', isLocationSharing: false },
];

export const mockCircles: Circle[] = [
  {
    id: "1",
    name: "Weekend Warriors",
    emoji: "🔥",
    color: "#8B5CF6",
    members: circleMembers,
    activeEvent: mockEvents[1], // Amapiano Night
    statusMessage: "Headed to Amapiano Night",
    recentActivity: [
      { id: "1", userId: "1", userName: "Alex M.", type: 'location_share', timestamp: "2m ago", description: "Alex shared location" },
      { id: "2", userId: "2", userName: "Sarah K.", type: 'event_add', timestamp: "15m ago", description: "Sarah added Amapiano Night to plans" },
      { id: "3", userId: "3", userName: "James O.", type: 'message', timestamp: "1h ago", description: "James sent a message" },
      { id: "4", userId: "1", userName: "Alex M.", type: 'bill_split', timestamp: "Yesterday", description: "Alex created a bill split" },
    ],
  },
  {
    id: "2",
    name: "Yoga Squad",
    emoji: "🧘",
    color: "#22C55E",
    members: circleMembers.slice(0, 2),
    activeEvent: mockEvents[0], // Sunset Yoga
    statusMessage: "Morning session tomorrow",
    recentActivity: [
      { id: "5", userId: "2", userName: "Sarah K.", type: 'check_in', timestamp: "3h ago", description: "Sarah checked in at Skyline Rooftop" },
    ],
  },
];

export const currentCircle = mockCircles[0];
