
import { useQuery } from "@tanstack/react-query";
import { mockEvents } from "@/data/mockData";

// Adapter to transform Backend Event to UI Event
const adaptEvent = (beEvent: any): any => ({
    id: beEvent.id,
    title: beEvent.title,
    date: new Date(beEvent.starts_at).toLocaleDateString("en-US", { weekday: 'short', day: 'numeric', month: 'short' }),
    time: new Date(beEvent.starts_at).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' }),
    location: "Nairobi", // Default for now
    venue: beEvent.location?.name || "TBD",
    imageUrl: beEvent.image_url || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30",
    category: beEvent.category || "Music",
    price: 1000,
    organizer: {
        id: "1",
        name: "Vybz Demo",
        avatar: "https://i.pravatar.cc/150?img=12"
    },
    attendees: beEvent.attendees || 0,
    isGoing: false,
    isPremium: false,
    rating: 4.5,
    description: beEvent.description,
    coordinates: {
        latitude: beEvent.location?.latitude || -1.2921,
        longitude: beEvent.location?.longitude || 36.8219,
    }
});

const fetchEvents = async () => {
    const domain = process.env.EXPO_PUBLIC_DOMAIN || 'http://localhost:5000';
    const res = await fetch(`${domain}/api/events`);
    if (!res.ok) throw new Error("Failed to fetch events");
    const data = await res.json();
    return data.map(adaptEvent);
};

export const useEvents = () => {
    return useQuery({
        queryKey: ['events'],
        queryFn: fetchEvents,
        initialData: mockEvents
    });
};
