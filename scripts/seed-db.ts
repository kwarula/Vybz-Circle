
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const sampleEvents = [
    {
        title: "Neon Nights: Cyberpunk Rave",
        category: "Music",
        description: "Experience the future of sound in a neon-drenched underground rave.",
        location: { name: "The Alchemist, Westlands", latitude: -1.2647, longitude: 36.8016 },
        starts_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days from now
        image_url: "https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=1000&auto=format&fit=crop",
        attendees: 124,
        ticketing_type: "vybz",
        status: "live",
        slug: `neon-nights-${Date.now()}`,
        source: "organizer"
    },
    {
        title: "Art & Soul: Rooftop Jazz",
        category: "Arts",
        description: "Smooth jazz, fine wine, and a breathtaking view of the Nairobi skyline.",
        location: { name: "GTC Tower, Westlands", latitude: -1.2721, longitude: 36.8123 },
        starts_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days from now
        image_url: "https://images.unsplash.com/photo-1514525253440-b393452e8d26?q=80&w=1000&auto=format&fit=crop",
        attendees: 86,
        ticketing_type: "vybz",
        status: "live",
        slug: `art-soul-${Date.now()}`,
        source: "organizer"
    },
    {
        title: "Tech Connect: AI Summit",
        category: "Tech",
        description: "Join leading innovators discussing the future of AI in Africa.",
        location: { name: "Radisson Blu, Upper Hill", latitude: -1.2985, longitude: 36.8267 },
        starts_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days from now
        image_url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000&auto=format&fit=crop",
        attendees: 2500,
        ticketing_type: "vybz",
        status: "live",
        slug: `tech-connect-${Date.now()}`,
        source: "organizer"
    },
    {
        title: "Afro-Fusion Food Festival",
        category: "Food",
        description: "A culinary journey through the continent's best flavors.",
        location: { name: "Karura Forest", latitude: -1.2335, longitude: 36.8282 },
        starts_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(), // 2 weeks from now
        image_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000&auto=format&fit=crop",
        attendees: 540,
        ticketing_type: "vybz",
        status: "live",
        slug: `afro-food-${Date.now()}`,
        source: "organizer"
    },
    {
        title: "Sunset Yoga & Meditation",
        category: "Wellness",
        description: "Unwind and recharge with a guided sunset yoga session.",
        location: { name: "Arboretum Park", latitude: -1.2750, longitude: 36.8050 },
        starts_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1).toISOString(), // Tomorrow
        image_url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop",
        attendees: 45,
        ticketing_type: "vybz",
        status: "live",
        slug: `sunset-yoga-${Date.now()}`,
        source: "organizer"
    }
];

async function seed() {
    console.log('🌱 Seeding database with sample events...');

    for (const event of sampleEvents) {
        const { data, error } = await supabase
            .from('events')
            .insert(event)
            .select();

        if (error) {
            console.error(`Error inserting ${event.title}:`, error.message);
        } else {
            console.log(`✅ Inserted: ${event.title}`);
        }
    }

    console.log('✨ Seeding complete!');
}

seed();
