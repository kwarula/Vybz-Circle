import { useState } from 'react'
import { Compass, Filter } from 'lucide-react'
import { useEvents } from '@/hooks/useEvents'
import { EventCard } from '@/components/EventCard'
import { MapboxMap } from '@/components/MapboxMap'
import FilterModal, { FilterState } from '@/components/FilterModal'

export default function Discover() {
    const { data: events = [], isLoading } = useEvents()
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
    const [filters, setFilters] = useState<FilterState>({
        date: 'This Weekend',
        price: 'Any Price',
        categories: [],
        verifiedOnly: true,
        includeSoldOut: false,
    })

    const handleEventClick = (event: any) => {
        // Handle event click on map
        console.log('Event clicked:', event)
    }

    const handleApplyFilters = (newFilters: FilterState) => {
        setFilters(newFilters)
    }

    // Apply filters to events
    const filteredEvents = events.filter(event => {
        // Category filter
        if (filters.categories.length > 0 && !filters.categories.includes('All')) {
            if (!filters.categories.some(cat => event.category?.toLowerCase() === cat.toLowerCase())) {
                return false
            }
        }

        // Price filter
        if (filters.price !== 'Any Price') {
            const price = event.price || 0
            if (filters.price === 'Free' && price > 0) return false
            if (filters.price === 'Under 1000' && price >= 1000) return false
            if (filters.price === 'Under 3000' && price >= 3000) return false
            if (filters.price === 'High End' && price < 3000) return false
        }

        // Verified filter
        if (filters.verifiedOnly && !event.verified) {
            return false
        }

        // Sold out filter
        if (!filters.includeSoldOut && event.is_sold_out) {
            return false
        }

        return true
    })

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="pb-6 px-4 lg:px-8">

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        < Compass className="w-8 h-8 text-sunset-orange" />
                        <h1 className="text-h1 text-white">Discover</h1>
                    </div>
                    <button
                        onClick={() => setIsFilterModalOpen(true)}
                        className="p-3 rounded-xl bg-surface hover:bg-surface-secondary transition-colors relative"
                    >
                        <Filter className="w-5 h-5 text-text-secondary" />
                        {(filters.categories.length > 0 || filters.price !== 'Any Price' || !filters.verifiedOnly || filters.includeSoldOut) && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-sunset-orange rounded-full" />
                        )}
                    </button>
                </div>

                {/* Map Implementation */}
                <div className="w-full h-[400px] lg:h-[500px] rounded-2xl overflow-hidden mb-8 shadow-2xl border border-white/5">
                    <MapboxMap
                        events={filteredEvents}
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
                ) : filteredEvents.length === 0 ? (
                    <div className="text-center py-12 glass-subtle rounded-xl">
                        <p className="text-body text-white mb-3">No events match your filters</p>
                        <button
                            onClick={() => setIsFilterModalOpen(true)}
                            className="text-small text-sunset-orange hover:text-sunset-orange/80 font-semibold"
                        >
                            Adjust Filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredEvents.slice(0, 6).map((event) => (
                            <EventCard key={event.id} event={event} variant="minimal" />
                        ))}
                    </div>
                )}
            </div>

            {/* Filter Modal */}
            <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onApply={handleApplyFilters}
                initialFilters={filters}
            />
        </div>
    )
}
