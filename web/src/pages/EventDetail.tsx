import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar, Clock, ExternalLink, Share2, Heart, Ticket } from 'lucide-react'
import { useEvent } from '@/hooks/useEvents'
import { Button } from '@/components/Button'
import { formatDate, formatTime } from '@/lib/utils'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

export default function EventDetail() {
    const { id } = useParams<{ id: string }>()
    const { data: event, isLoading, error } = useEvent(id || '')
    const { user } = useAuth()

    const handleGetTickets = async () => {
        if (!event || !id) return

        try {
            const result = await api.events.trackClick(id, user?.id)
            if (result.ticketUrl) {
                window.open(result.ticketUrl, '_blank', 'noopener,noreferrer')
            }
        } catch (e) {
            console.error('Failed to track click:', e)
            // Fallback to direct source URL
            if (event.source_url) {
                window.open(event.source_url, '_blank', 'noopener,noreferrer')
            }
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-sunset-orange border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (error || !event) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <p className="text-h3 text-white mb-4">Event not found</p>
                <Link to="/" className="text-sunset-orange hover:underline">Go back home</Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen pb-24">
            {/* Hero Image */}
            <div className="relative h-[50vh] lg:h-[60vh]">
                {event.image_url ? (
                    <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-surface-secondary flex items-center justify-center">
                        <Calendar className="w-20 h-20 text-text-muted" />
                    </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-midnight-teal via-midnight-teal/50 to-transparent" />

                {/* Back Button */}
                <Link
                    to="/"
                    className="absolute top-20 lg:top-8 left-4 lg:left-8 p-3 rounded-full glass hover:bg-surface-secondary transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>

                {/* Actions */}
                <div className="absolute top-20 lg:top-8 right-4 lg:right-8 flex gap-2">
                    <button className="p-3 rounded-full glass hover:bg-surface-secondary transition-colors">
                        <Heart className="w-5 h-5 text-white" />
                    </button>
                    <button className="p-3 rounded-full glass hover:bg-surface-secondary transition-colors">
                        <Share2 className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Category Badge */}
                {event.category && (
                    <span className="absolute bottom-4 left-4 lg:left-8 px-4 py-2 rounded-full text-small bg-sunset-orange text-white font-bold">
                        {event.category}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="px-4 lg:px-8 -mt-8 relative z-10">
                <div className="max-w-3xl">
                    <h1 className="text-hero text-white mb-6">{event.title}</h1>

                    {/* Meta Info Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        {/* Date & Time */}
                        {event.starts_at && (
                            <div className="bg-surface rounded-xl p-4 sticker">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-sunset-orange/20">
                                        <Calendar className="w-5 h-5 text-sunset-orange" />
                                    </div>
                                    <span className="text-caption text-text-muted">Date & Time</span>
                                </div>
                                <p className="text-body text-white font-semibold">{formatDate(event.starts_at)}</p>
                                <p className="text-small text-text-secondary">{formatTime(event.starts_at)}</p>
                            </div>
                        )}

                        {/* Location */}
                        {event.venue_name && (
                            <div className="bg-surface rounded-xl p-4 sticker">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-bright-turquoise/20">
                                        <MapPin className="w-5 h-5 text-bright-turquoise" />
                                    </div>
                                    <span className="text-caption text-text-muted">Location</span>
                                </div>
                                <p className="text-body text-white font-semibold">{event.venue_name}</p>
                            </div>
                        )}
                    </div>

                    {/* Price */}
                    {event.price_range && (
                        <div className="bg-surface rounded-xl p-4 mb-8 sticker">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-caption text-text-muted block mb-1">Price</span>
                                    <span className="text-h2 text-sunset-orange font-bold">{event.price_range}</span>
                                </div>
                                {event.is_external && (
                                    <span className="px-3 py-1 rounded-full text-tiny bg-electric-berry/20 text-electric-berry">
                                        External Ticketing
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {event.description && (
                        <div className="mb-8">
                            <h2 className="text-h3 text-white mb-4">About</h2>
                            <p className="text-body text-text-secondary leading-relaxed whitespace-pre-wrap">
                                {event.description}
                            </p>
                        </div>
                    )}

                    {/* Organizer */}
                    {event.organizer_name && (
                        <div className="mb-8">
                            <h2 className="text-h3 text-white mb-4">Organizer</h2>
                            <div className="bg-surface rounded-xl p-4 sticker inline-block">
                                <p className="text-body text-white font-semibold">{event.organizer_name}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky CTA */}
            <div className="fixed bottom-20 lg:bottom-0 left-0 right-0 lg:left-72 p-4 bg-midnight-teal/95 backdrop-blur-md border-t border-white/5 z-30">

                <div className="max-w-3xl mx-auto flex items-center gap-4">
                    {event.price_range && (
                        <div className="hidden sm:block">
                            <span className="text-small text-text-muted">From</span>
                            <p className="text-h3 text-sunset-orange font-bold">{event.price_range}</p>
                        </div>
                    )}
                    <Button
                        className="flex-1 sm:flex-none sm:min-w-[200px]"
                        size="lg"
                        onClick={handleGetTickets}
                    >
                        <Ticket className="w-5 h-5" />
                        Get Tickets
                        {event.is_external && <ExternalLink className="w-4 h-4" />}
                    </Button>
                </div>
            </div>
        </div>
    )
}
