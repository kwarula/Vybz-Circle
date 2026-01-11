import { Compass, Filter } from 'lucide-react'
import { useEvents } from '@/hooks/useEvents'
import { EventCard } from '@/components/EventCard'
import { MapboxMap } from '@/components/MapboxMap'

export default function Discover() {
    const { data: events = [], isLoading } = useEvents()

    const handleEventClick = (event: any) => {
        // Handle event click on map
        console.log('Event clicked:', event)
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="pb-6 px-4 lg:px-8">

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        < Compass className="w-8 h-8 text-sunset-orange" />
                        <h1 className="text-h1 text-white">Discover</h1>
                    </div>
                    <button className="p-3 rounded-xl bg-surface hover:bg-surface-secondary transition-colors">
                        <Filter className="w-5 h-5 text-text-secondary" />
                    </button>
                </div>

                {/* Map Implementation */}
                <div className="w-full h-[400px] lg:h-[500px] rounded-2xl overflow-hidden mb-8 shadow-2xl border border-white/5">
                    <MapboxMap
                        events={events}
                        onEventClick={handleEventClick}
                        className="w-full h-full"
                    />
                </div>
            </div>

            {/* Events List */}
            <div className="px-4 lg:px-8 pb-24">
                <h2 className="text-h2 text-white mb-4">Nearby Events</h2>
                {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="w-8 h-8 border-2 border-sunset-orange border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {events.slice(0, 6).map((event) => (
                            <EventCard key={event.id} event={event} variant="minimal" />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
