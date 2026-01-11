import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";

// Adapter to transform Backend Event to UI Event
const adaptEvent = (beEvent: any): any => {
    console.log('Adapting event:', beEvent.title);
    return {
        id: beEvent.id,
        title: beEvent.title,
        date: beEvent.starts_at
            ? new Date(beEvent.starts_at).toLocaleDateString("en-US", { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
            : beEvent.date || "TBD",
        time: beEvent.starts_at
            ? new Date(beEvent.starts_at).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })
            : beEvent.time || "TBD",
        location: beEvent.location?.city || "Nairobi",
        venue: beEvent.venue_name || beEvent.location?.name || "TBD",
        imageUrl: beEvent.image_url || beEvent.imageUrl || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30",
        category: beEvent.category || "Events",
        price: beEvent.min_price || beEvent.price || 0,
        currency: "KES",
        organizer: {
            id: beEvent.organizer_id || "1",
            name: beEvent.organizer_name || "Event Organizer",
            avatar: "https://i.pravatar.cc/150?img=12"
        },
        attendees: beEvent.attendees || 0,
        isGoing: false,
        isPremium: beEvent.is_premium || false,
        rating: 4.5,
        description: beEvent.description || `Join us for ${beEvent.title}`,
        coordinates: {
            latitude: beEvent.latitude || beEvent.location?.latitude || -1.2921,
            longitude: beEvent.longitude || beEvent.location?.longitude || 36.8219,
        },
        // Scraped event fields
        is_external: beEvent.is_external || false,
        source_url: beEvent.source_url,
        source_platform: beEvent.source_platform,
        price_range: beEvent.price_range
    };
};

const fetchEvents = async () => {
    console.log('Fetching events via apiRequest');

    const res = await apiRequest('GET', 'api/events');
    const data = await res.json();
    console.log('Fetched events count:', data.length);

    const adapted = data.map(adaptEvent);
    console.log('Adapted events count:', adapted.length);

    return adapted;
};

export const useEvents = () => {
    return useQuery({
        queryKey: ['events'],
        queryFn: fetchEvents,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnMount: true,
        retry: 3
    });
};
