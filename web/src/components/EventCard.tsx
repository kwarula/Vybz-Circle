import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Calendar, Star, Heart } from 'lucide-react'
import { cn, formatDateTime } from '@/lib/utils'
import type { Event } from '@/lib/api'

interface EventCardProps {
    event: Event
    variant?: 'default' | 'featured' | 'minimal' | 'compact'
    className?: string
}

export function EventCard({ event, variant = 'default', className }: EventCardProps) {
    const [imageError, setImageError] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)
    const [isLiked, setIsLiked] = useState(false)

    const showFallback = !event.image_url || imageError
    const isCompact = variant === 'compact'

    // Category-based gradient for fallback
    const getCategoryGradient = () => {
        const gradients: Record<string, string> = {
            music: 'from-purple-600/40 to-pink-600/20',
            arts: 'from-cyan-600/40 to-blue-600/20',
            food: 'from-orange-600/40 to-red-600/20',
            wellness: 'from-green-600/40 to-teal-600/20',
            social: 'from-blue-600/40 to-purple-600/20',
            default: 'from-gray-600/40 to-gray-800/20'
        }
        const category = event.category?.toLowerCase() || 'default'
        return gradients[category] || gradients.default
    }

    const handleLikeClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsLiked(!isLiked)
    }

    return (
        <Link
            to={`/events/${event.id}`}
            className={cn(
                'group block',
                className
            )}
        >
            {/* Image Container - Airbnb aspect ratio */}
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2">
                {/* Shimmer loading state */}
                {!showFallback && !imageLoaded && (
                    <div className="absolute inset-0 shimmer bg-surface-secondary" />
                )}

                {!showFallback ? (
                    <img
                        src={event.image_url}
                        alt={event.title}
                        className={cn(
                            'w-full h-full object-cover transition-transform duration-300',
                            'group-hover:scale-105',
                            imageLoaded ? 'opacity-100' : 'opacity-0'
                        )}
                        loading="lazy"
                        onError={() => setImageError(true)}
                        onLoad={() => setImageLoaded(true)}
                    />
                ) : (
                    <div className={cn(
                        'w-full h-full flex items-center justify-center bg-gradient-to-br',
                        getCategoryGradient(),
                        'bg-surface-secondary'
                    )}>
                        <Calendar className="w-8 h-8 text-white/30" />
                    </div>
                )}

                {/* Category Badge - Small, top left */}
                {event.category && (
                    <div className="absolute top-2 left-2">
                        <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-medium text-white uppercase tracking-wide">
                            {event.category}
                        </span>
                    </div>
                )}

                {/* Heart button - Top right like Airbnb */}
                <button
                    onClick={handleLikeClick}
                    className={cn(
                        'absolute top-2 right-2 p-1.5 rounded-full',
                        'transition-all duration-200',
                        'hover:scale-110 active:scale-95'
                    )}
                >
                    <Heart
                        className={cn(
                            'w-5 h-5 transition-colors',
                            isLiked
                                ? 'fill-sunset-orange text-sunset-orange'
                                : 'fill-black/30 text-white stroke-[1.5]'
                        )}
                    />
                </button>
            </div>

            {/* Content - Compact like Airbnb */}
            <div className="space-y-0.5">
                {/* Title and Rating Row */}
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium text-white leading-tight line-clamp-1 group-hover:text-sunset-orange transition-colors">
                        {event.title}
                    </h3>
                    {/* Rating - Airbnb style */}
                    <div className="flex items-center gap-0.5 shrink-0">
                        <Star className="w-3 h-3 fill-white text-white" />
                        <span className="text-xs font-medium text-white">4.9</span>
                    </div>
                </div>

                {/* Location */}
                {event.venue_name && (
                    <p className="text-small text-text-secondary line-clamp-1">
                        {event.venue_name}
                    </p>
                )}

                {/* Date */}
                {event.starts_at && (
                    <p className="text-small text-text-muted">
                        {formatDateTime(event.starts_at).split('·')[0]}
                    </p>
                )}

                {/* Price - Like Airbnb */}
                <p className="text-sm pt-0.5">
                    <span className="font-semibold text-white">{event.price_range || 'Free'}</span>
                    {event.price_range && <span className="text-text-secondary"> entry</span>}
                </p>
            </div>
        </Link>
    )
}
