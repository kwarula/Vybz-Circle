import { useState } from 'react'
import { Search, MapPin, Star, Filter } from 'lucide-react'
import FilterModal, { FilterState } from '@/components/FilterModal'

interface Venue {
    id: string
    name: string
    address: string
    imageUrl: string
    rating: number
    category: string
}

const VENUE_CATEGORIES = ['All', 'Restaurants', 'Cafes', 'Parks', 'Rooftops', 'Clubs', 'Bars', 'Lounges']

const MOCK_VENUES: Venue[] = [
    {
        id: '1',
        name: 'The Alchemist',
        address: 'Westlands, Nairobi',
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
        rating: 4.5,
        category: 'Bars'
    },
    {
        id: '2',
        name: 'Artcaffe',
        address: 'Lavington, Nairobi',
        imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
        rating: 4.3,
        category: 'Cafes'
    },
    {
        id: '3',
        name: 'The Nest Rooftop',
        address: 'Westlands, Nairobi',
        imageUrl: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=800',
        rating: 4.7,
        category: 'Rooftops'
    },
    {
        id: '4',
        name: 'Karura Forest',
        address: 'Gigiri, Nairobi',
        imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
        rating: 4.8,
        category: 'Parks'
    },
    {
        id: '5',
        name: 'Brew Bistro',
        address: 'Westlands, Nairobi',
        imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
        rating: 4.4,
        category: 'Restaurants'
    },
    {
        id: '6',
        name: 'K1 Klub House',
        address: 'Parklands, Nairobi',
        imageUrl: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800',
        rating: 4.6,
        category: 'Clubs'
    }
]

export default function Venues() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
    const [filters, setFilters] = useState<FilterState>({
        date: 'This Weekend',
        price: 'Any Price',
        categories: [],
        verifiedOnly: true,
        includeSoldOut: false,
    })

    const handleApplyFilters = (newFilters: FilterState) => {
        setFilters(newFilters)
    }

    const filteredVenues = MOCK_VENUES.filter(venue => {
        const matchesSearch = venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            venue.address.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'All' || venue.category === selectedCategory

        // Apply additional filters from FilterModal
        // For venues, we can filter by rating as a proxy for "verified"
        if (filters.verifiedOnly && venue.rating < 4.0) {
            return false
        }

        return matchesSearch && matchesCategory
    })

    return (
        <div className="py-8">
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-h1 text-white mb-2">Top Spots</h1>
                        <p className="text-text-secondary">Discover the best venues in Nairobi</p>
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
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search venues..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface border border-surface-tertiary text-white placeholder:text-text-muted focus:border-sunset-orange focus:outline-none transition-colors"
                />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                {VENUE_CATEGORIES.map(category => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-6 py-2 rounded-full text-small font-semibold transition-colors whitespace-nowrap ${
                            selectedCategory === category
                                ? 'bg-gradient-primary text-white'
                                : 'bg-surface text-text-secondary hover:bg-surface-secondary'
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Venues Grid */}
            {filteredVenues.length === 0 ? (
                <div className="text-center py-16">
                    <MapPin className="w-16 h-16 text-text-muted mx-auto mb-4" />
                    <h2 className="text-h2 text-white mb-2">No venues found</h2>
                    <p className="text-text-secondary">Try adjusting your search or filters</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredVenues.map(venue => (
                        <div
                            key={venue.id}
                            className="group rounded-xl bg-surface border border-surface-tertiary overflow-hidden hover:border-sunset-orange/50 transition-all cursor-pointer"
                        >
                            {/* Image */}
                            <div className="aspect-[4/3] overflow-hidden">
                                <img
                                    src={venue.imageUrl}
                                    alt={venue.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="text-white font-semibold">{venue.name}</h3>
                                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sunset-orange/10">
                                        <Star className="w-3 h-3 text-sunset-orange fill-sunset-orange" />
                                        <span className="text-tiny text-sunset-orange font-bold">{venue.rating}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-text-secondary text-small">
                                    <MapPin className="w-4 h-4" />
                                    <span>{venue.address}</span>
                                </div>

                                <div className="mt-3">
                                    <span className="inline-block px-3 py-1 rounded-full bg-electric-berry/10 text-electric-berry text-tiny font-semibold">
                                        {venue.category}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

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
