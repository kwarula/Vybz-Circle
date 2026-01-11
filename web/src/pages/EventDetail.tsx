import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar, Users, Star, Heart, Share2, Ticket, ExternalLink, Clock, X, Copy, Check } from 'lucide-react'
import { useEvent } from '@/hooks/useEvents'
import { Button } from '@/components/Button'
import { formatDate, formatTime } from '@/lib/utils'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

export default function EventDetail() {
    const { id } = useParams<{ id: string }>()
    const { data: event, isLoading, error } = useEvent(id || '')
    const { user } = useAuth()
    const [isWishlisted, setIsWishlisted] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)
    const [copied, setCopied] = useState(false)
    const [showAllPhotos, setShowAllPhotos] = useState(false)

    // Mock additional images (in production, fetch from backend)
    const galleryImages = event?.image_url ? [
        event.image_url,
        event.image_url, // Replace with actual gallery images
        event.image_url,
        event.image_url,
        event.image_url
    ] : []

    const handleGetTickets = async () => {
        if (!event || !id) return

        try {
            const result = await api.events.trackClick(id, user?.id)
            if (result.ticketUrl) {
                window.open(result.ticketUrl, '_blank', 'noopener,noreferrer')
            }
        } catch (e) {
            console.error('Failed to track click:', e)
            if (event.source_url) {
                window.open(event.source_url, '_blank', 'noopener,noreferrer')
            }
        }
    }

    const handleShare = () => {
        setShowShareModal(true)
    }

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const toggleWishlist = () => {
        setIsWishlisted(!isWishlisted)
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-3 border-sunset-orange border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (error || !event) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <p className="text-h2 text-white mb-4">Event not found</p>
                <Link to="/" className="text-sunset-orange hover:underline">Go back home</Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            {/* Top Navigation Bar - Airbnb style */}
            <div className="sticky top-16 lg:top-16 z-40 bg-midnight-teal/95 backdrop-blur-lg border-b border-white/5">
                <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-20 py-4">
                    <div className="flex items-center justify-between">
                        <Link
                            to="/"
                            className="flex items-center gap-2 text-white hover:text-text-secondary transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="hidden sm:inline text-sm font-medium">Back</span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleShare}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-surface transition-colors text-white"
                            >
                                <Share2 className="w-4 h-4" />
                                <span className="hidden sm:inline text-sm font-medium">Share</span>
                            </button>
                            <button
                                onClick={toggleWishlist}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-surface transition-colors text-white"
                            >
                                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-error text-error' : ''}`} />
                                <span className="hidden sm:inline text-sm font-medium">Save</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Photo Gallery - Airbnb style grid */}
            <div className="max-w-[1600px] mx-auto px-0 sm:px-10 lg:px-20">
                <div className="grid grid-cols-4 gap-2 h-[50vh] lg:h-[60vh] mt-0 sm:mt-6 overflow-hidden sm:rounded-2xl">
                    {/* Main large image */}
                    <div className="col-span-4 lg:col-span-2 row-span-2 relative group cursor-pointer">
                        <img
                            src={galleryImages[0]}
                            alt={event.title}
                            className="w-full h-full object-cover"
                            onClick={() => setShowAllPhotos(true)}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                    </div>

                    {/* Grid of smaller images - hidden on mobile */}
                    {galleryImages.slice(1, 5).map((img, idx) => (
                        <div key={idx} className="hidden lg:block col-span-1 relative group cursor-pointer">
                            <img
                                src={img}
                                alt={`${event.title} ${idx + 2}`}
                                className="w-full h-full object-cover"
                                onClick={() => setShowAllPhotos(true)}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                            {idx === 3 && (
                                <button
                                    onClick={() => setShowAllPhotos(true)}
                                    className="absolute bottom-4 right-4 px-4 py-2 bg-white text-midnight-teal rounded-lg font-medium text-sm hover:bg-white/90 transition-colors flex items-center gap-2"
                                >
                                    Show all photos
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content - Two Column Layout */}
            <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-20 py-8 lg:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Title & Quick Info */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                {event.category && (
                                    <span className="px-3 py-1 rounded-full bg-sunset-orange/10 text-sunset-orange text-sm font-semibold">
                                        {event.category}
                                    </span>
                                )}
                                {event.is_external && (
                                    <span className="px-3 py-1 rounded-full bg-electric-berry/10 text-electric-berry text-sm font-semibold">
                                        External Event
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                                {event.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-text-secondary">
                                {event.venue_name && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-sm">{event.venue_name}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 fill-sunset-orange text-sunset-orange" />
                                    <span className="text-sm font-semibold text-white">4.8</span>
                                    <span className="text-sm">(124 reviews)</span>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-surface-tertiary" />

                        {/* Event Highlights */}
                        <div>
                            <h2 className="text-2xl font-semibold text-white mb-6">Event highlights</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {event.starts_at && (
                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-surface/50 hover:bg-surface transition-colors">
                                        <div className="p-3 rounded-xl bg-sunset-orange/10">
                                            <Calendar className="w-6 h-6 text-sunset-orange" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-text-muted mb-1">Date & Time</p>
                                            <p className="text-white font-semibold">{formatDate(event.starts_at)}</p>
                                            <p className="text-sm text-text-secondary">{formatTime(event.starts_at)}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-start gap-4 p-4 rounded-xl bg-surface/50 hover:bg-surface transition-colors">
                                    <div className="p-3 rounded-xl bg-bright-turquoise/10">
                                        <Users className="w-6 h-6 text-bright-turquoise" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-text-muted mb-1">Expected Attendees</p>
                                        <p className="text-white font-semibold">500+ people</p>
                                        <p className="text-sm text-text-secondary">Going</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-surface-tertiary" />

                        {/* About Event */}
                        {event.description && (
                            <div>
                                <h2 className="text-2xl font-semibold text-white mb-6">About this event</h2>
                                <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                                    {event.description}
                                </p>
                            </div>
                        )}

                        {/* Divider */}
                        <div className="border-t border-surface-tertiary" />

                        {/* Organizer */}
                        {event.organizer_name && (
                            <div>
                                <h2 className="text-2xl font-semibold text-white mb-6">Hosted by</h2>
                                <div className="flex items-start gap-4 p-6 rounded-2xl bg-surface">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sunset-orange to-electric-berry flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                                        {event.organizer_name[0]}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-white mb-2">{event.organizer_name}</h3>
                                        <div className="flex items-center gap-4 text-sm text-text-secondary mb-4">
                                            <span>⭐ 4.9 rating</span>
                                            <span>•</span>
                                            <span>156 events hosted</span>
                                        </div>
                                        <p className="text-text-secondary text-sm">
                                            Professional event organizer specializing in creating unforgettable experiences.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Divider */}
                        <div className="border-t border-surface-tertiary" />

                        {/* Location Map Placeholder */}
                        {event.venue_name && (
                            <div>
                                <h2 className="text-2xl font-semibold text-white mb-6">Where you'll be</h2>
                                <div className="aspect-video rounded-2xl bg-surface/50 flex items-center justify-center mb-4">
                                    <MapPin className="w-12 h-12 text-text-muted" />
                                </div>
                                <p className="text-white font-semibold mb-2">{event.venue_name}</p>
                                <p className="text-text-secondary text-sm">
                                    Get directions to the venue for easy navigation on event day.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Sticky Booking Card (Airbnb style) */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-32 space-y-6">
                            {/* Booking Card */}
                            <div className="p-6 rounded-2xl border border-surface-tertiary bg-surface/30 backdrop-blur-sm shadow-2xl">
                                {/* Price */}
                                <div className="mb-6">
                                    {event.price_range ? (
                                        <div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-bold text-white">{event.price_range}</span>
                                                <span className="text-text-muted">/ ticket</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-2xl font-bold text-white">Free Event</div>
                                    )}
                                </div>

                                {/* CTA Button */}
                                <Button
                                    className="w-full mb-4"
                                    size="lg"
                                    onClick={handleGetTickets}
                                >
                                    <Ticket className="w-5 h-5" />
                                    Get Tickets
                                    {event.is_external && <ExternalLink className="w-4 h-4" />}
                                </Button>

                                <p className="text-center text-xs text-text-muted mb-6">
                                    You won't be charged yet
                                </p>

                                {/* Quick Info */}
                                <div className="space-y-4 pt-6 border-t border-surface-tertiary">
                                    {event.starts_at && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-text-secondary">Date</span>
                                            <span className="text-sm text-white font-medium">{formatDate(event.starts_at)}</span>
                                        </div>
                                    )}
                                    {event.starts_at && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-text-secondary">Time</span>
                                            <span className="text-sm text-white font-medium">{formatTime(event.starts_at)}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-text-secondary">Tickets available</span>
                                        <span className="text-sm text-bright-turquoise font-medium">Yes</span>
                                    </div>
                                </div>
                            </div>

                            {/* Safety Note */}
                            <div className="p-4 rounded-xl bg-surface/30 border border-surface-tertiary">
                                <p className="text-xs text-text-secondary text-center">
                                    🔒 Safe and secure checkout • Instant confirmation • Mobile tickets
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface rounded-2xl max-w-md w-full p-6 relative">
                        <button
                            onClick={() => setShowShareModal(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-secondary transition-colors"
                        >
                            <X className="w-5 h-5 text-text-secondary" />
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-6">Share this event</h2>

                        <button
                            onClick={handleCopyLink}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-secondary hover:bg-surface-tertiary transition-colors mb-4"
                        >
                            <div className="flex items-center gap-3">
                                {copied ? (
                                    <Check className="w-5 h-5 text-success" />
                                ) : (
                                    <Copy className="w-5 h-5 text-text-secondary" />
                                )}
                                <span className="text-white">
                                    {copied ? 'Link copied!' : 'Copy link'}
                                </span>
                            </div>
                        </button>

                        {/* Social Share Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button className="p-4 rounded-xl bg-surface-secondary hover:bg-surface-tertiary transition-colors text-white text-sm font-medium">
                                WhatsApp
                            </button>
                            <button className="p-4 rounded-xl bg-surface-secondary hover:bg-surface-tertiary transition-colors text-white text-sm font-medium">
                                Twitter
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-lg border-t border-surface-tertiary p-4 z-40">
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        {event.price_range && (
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-white">{event.price_range}</span>
                                <span className="text-sm text-text-muted">/ ticket</span>
                            </div>
                        )}
                    </div>
                    <Button onClick={handleGetTickets} size="lg">
                        Get Tickets
                    </Button>
                </div>
            </div>
        </div>
    )
}
