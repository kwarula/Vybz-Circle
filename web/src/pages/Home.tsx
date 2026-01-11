import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useEvents } from '@/hooks/useEvents'
import { useAuth } from '@/hooks/useAuth'
import { usePersonalizedRecommendations, useTrendingEvents } from '@/hooks/useRecommendations'
import { EventCard } from '@/components/EventCard'
import { Button } from '@/components/Button'
import { Loader2, Sparkles, ChevronRight, ArrowRight, TrendingUp, Zap } from 'lucide-react'

const MOODS = [
    { id: 'All', label: 'All Vybz', emoji: '✨' },
    { id: 'Wild', label: 'Wild Party', emoji: '🔥' },
    { id: 'Chill', label: 'Chill', emoji: '☕' },
    { id: 'Deep', label: 'Deep Vybz', emoji: '🧠' },
    { id: 'Foodie', label: 'Food & Drink', emoji: '🍕' },
    { id: 'Social', label: 'Social', emoji: '👋' },
]

export default function Home() {
    const [selectedMood, setSelectedMood] = useState('All')
    const { data: events = [], isLoading, error } = useEvents()
    const { data: personalizedEvents = [], isLoading: loadingPersonalized } = usePersonalizedRecommendations(12)
    const { data: trendingEvents = [], isLoading: loadingTrending } = useTrendingEvents(8)
    const { user } = useAuth()

    const userName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Friend'

    const filteredEvents = selectedMood === 'All'
        ? events
        : events.filter(e => e.category?.toLowerCase() === selectedMood.toLowerCase() || (selectedMood === 'Foodie' && e.category?.toLowerCase() === 'food'))

    const featuredEvents = events.filter(e => e.image_url).slice(0, 6)

    return (
        <div className="py-6">
            {/* Hero Section - Clean spacing */}
            <section className="mb-6">
                {/* Greeting */}
                <div className="mb-5">
                    <h1 className="text-hero text-white mb-1">
                        Habari, <span className="gradient-text-primary">{userName}</span>
                    </h1>
                    <p className="text-body text-text-secondary">
                        Discover what's happening in Nairobi
                    </p>
                </div>

                {/* Mood Selector */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {MOODS.map((mood) => (
                        <button
                            key={mood.id}
                            onClick={() => setSelectedMood(mood.id)}
                            className={cn(
                                'mood-chip shrink-0 flex items-center gap-1.5',
                                selectedMood === mood.id && 'active'
                            )}
                        >
                            <span className="text-sm">{mood.emoji}</span>
                            <span>{mood.label}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Personalized For You Section - Only shown to logged in users */}
            {user && personalizedEvents.length > 0 && (
                <section className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-sunset-orange" />
                            <h2 className="text-h1 text-white font-semibold">For You</h2>
                            <span className="px-2 py-0.5 rounded-full bg-sunset-orange/10 text-sunset-orange text-tiny font-semibold">
                                Personalized
                            </span>
                        </div>
                        <button className="flex items-center gap-1 text-small font-medium text-text-secondary hover:text-white transition-colors">
                            Show all <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {loadingPersonalized ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 text-sunset-orange animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Horizontal scroll container */}
                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-6 px-6 sm:-mx-10 sm:px-10 lg:-mx-20 lg:px-20">
                                {personalizedEvents.slice(0, 8).map((event) => (
                                    <div key={event.id} className="shrink-0 w-[220px] snap-start">
                                        <EventCard event={event} variant="compact" />
                                    </div>
                                ))}
                            </div>
                            <p className="text-tiny text-text-muted mt-3 text-center">
                                Based on your interests and activity
                            </p>
                        </>
                    )}
                </section>
            )}

            {/* Trending This Week Section */}
            {trendingEvents.length > 0 && (
                <section className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-bright-turquoise" />
                            <h2 className="text-h1 text-white font-semibold">Trending This Week</h2>
                        </div>
                        <button className="flex items-center gap-1 text-small font-medium text-text-secondary hover:text-white transition-colors">
                            Show all <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {loadingTrending ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 text-bright-turquoise animate-spin" />
                        </div>
                    ) : (
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-6 px-6 sm:-mx-10 sm:px-10 lg:-mx-20 lg:px-20">
                            {trendingEvents.map((event) => (
                                <div key={event.id} className="shrink-0 w-[220px] snap-start relative">
                                    <EventCard event={event} variant="compact" />
                                    {event.trending_stats && (
                                        <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-bright-turquoise/90 backdrop-blur-sm">
                                            <div className="flex items-center gap-1">
                                                <TrendingUp className="w-3 h-3 text-white" />
                                                <span className="text-tiny font-bold text-white">
                                                    {event.trending_stats.engagement_score}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* Featured Section - Horizontal scroll like Airbnb */}
            {featuredEvents.length > 0 && (
                <section className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-h1 text-white font-semibold">Featured Vybz</h2>
                        <button className="flex items-center gap-1 text-small font-medium text-text-secondary hover:text-white transition-colors">
                            Show all <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Horizontal scroll container */}
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-6 px-6 sm:-mx-10 sm:px-10 lg:-mx-20 lg:px-20">
                        {featuredEvents.map((event) => (
                            <div key={event.id} className="shrink-0 w-[220px] snap-start">
                                <EventCard event={event} variant="compact" />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Main Events Grid */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-h1 text-white font-semibold">Live in the City</h2>
                    <button className="flex items-center gap-1 text-small font-medium text-text-secondary hover:text-white transition-colors">
                        Show all <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 text-sunset-orange animate-spin" />
                    </div>
                ) : error ? (
                    <div className="text-center py-12 glass-subtle rounded-xl">
                        <p className="text-body text-white mb-3">Failed to load events</p>
                        <Button variant="primary" onClick={() => window.location.reload()} size="sm">
                            Try Again
                        </Button>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="text-center py-12 glass-subtle rounded-xl">
                        <Sparkles className="w-6 h-6 text-text-muted mx-auto mb-2" />
                        <p className="text-body text-white mb-1">No {selectedMood} events found</p>
                        <p className="text-small text-text-secondary">Try a different category</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 gap-y-8">
                        {filteredEvents.map((event) => (
                            <EventCard key={event.id} event={event} variant="compact" />
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
