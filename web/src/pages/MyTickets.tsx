import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Ticket, Calendar, MapPin, QrCode, CheckCircle, Clock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import type { Ticket as TicketType, Event } from '@/lib/api'

export default function MyTickets() {
    const { user } = useAuth()
    const [tickets, setTickets] = useState<(TicketType & { event?: Event })[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all')

    useEffect(() => {
        if (user) {
            loadTickets()
        }
    }, [user])

    const loadTickets = async () => {
        try {
            setLoading(true)
            setError('')
            const fetchedTickets = await api.user.getTickets(user!.id)

            // Fetch event details for each ticket
            const ticketsWithEvents = await Promise.all(
                fetchedTickets.map(async (ticket) => {
                    try {
                        const event = await api.events.get(ticket.event_id)
                        return { ...ticket, event }
                    } catch {
                        return ticket
                    }
                })
            )

            setTickets(ticketsWithEvents)
        } catch (e: any) {
            setError(e.message || 'Failed to load tickets')
        } finally {
            setLoading(false)
        }
    }

    const filteredTickets = tickets.filter(ticket => {
        if (!ticket.event?.starts_at) return filter === 'all'
        const eventDate = new Date(ticket.event.starts_at)
        const now = new Date()

        if (filter === 'upcoming') return eventDate >= now
        if (filter === 'past') return eventDate < now
        return true
    })

    if (!user) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
                <Ticket className="w-16 h-16 text-text-muted mb-4" />
                <h2 className="text-h2 text-white mb-2">Sign in to view your tickets</h2>
                <Link to="/auth/signin" className="text-sunset-orange hover:text-electric-berry transition-colors">
                    Sign In
                </Link>
            </div>
        )
    }

    return (
        <div className="py-8">
            <div className="mb-8">
                <h1 className="text-h1 text-white mb-2">My Tickets</h1>
                <p className="text-text-secondary">View and manage your event tickets</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
                {(['all', 'upcoming', 'past'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-6 py-2 rounded-full text-small font-semibold transition-colors whitespace-nowrap ${
                            filter === tab
                                ? 'bg-gradient-primary text-white'
                                : 'bg-surface text-text-secondary hover:bg-surface-secondary'
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/30 text-error">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-48 rounded-xl bg-surface animate-pulse" />
                    ))}
                </div>
            ) : filteredTickets.length === 0 ? (
                <div className="text-center py-16">
                    <Ticket className="w-16 h-16 text-text-muted mx-auto mb-4" />
                    <h2 className="text-h2 text-white mb-2">No tickets found</h2>
                    <p className="text-text-secondary mb-6">
                        {filter === 'all' ? 'You haven\'t purchased any tickets yet' : `No ${filter} tickets`}
                    </p>
                    <Link to="/discover">
                        <button className="px-6 py-3 rounded-xl bg-gradient-primary text-white font-semibold hover:opacity-90 transition-opacity">
                            Discover Events
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {filteredTickets.map(ticket => (
                        <div key={ticket.id} className="p-6 rounded-xl bg-surface border border-surface-tertiary hover:border-sunset-orange/50 transition-colors">
                            {/* Event Image */}
                            {ticket.event?.image_url && (
                                <img
                                    src={ticket.event.image_url}
                                    alt={ticket.event.title}
                                    className="w-full h-40 object-cover rounded-lg mb-4"
                                />
                            )}

                            {/* Event Info */}
                            <h3 className="text-h3 text-white mb-2">{ticket.event?.title || 'Event'}</h3>

                            {ticket.event?.starts_at && (
                                <div className="flex items-center gap-2 text-text-secondary mb-2">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-small">
                                        {new Date(ticket.event.starts_at).toLocaleDateString('en-US', {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                            )}

                            {ticket.event?.venue_name && (
                                <div className="flex items-center gap-2 text-text-secondary mb-4">
                                    <MapPin className="w-4 h-4" />
                                    <span className="text-small">{ticket.event.venue_name}</span>
                                </div>
                            )}

                            {/* Ticket Status */}
                            <div className="flex items-center justify-between mb-4 pt-4 border-t border-surface-tertiary">
                                <div className="flex items-center gap-2">
                                    {ticket.status === 'valid' ? (
                                        <>
                                            <CheckCircle className="w-5 h-5 text-success" />
                                            <span className="text-small text-success">Valid</span>
                                        </>
                                    ) : ticket.checked_in_at ? (
                                        <>
                                            <CheckCircle className="w-5 h-5 text-bright-turquoise" />
                                            <span className="text-small text-bright-turquoise">Checked In</span>
                                        </>
                                    ) : (
                                        <>
                                            <Clock className="w-5 h-5 text-text-muted" />
                                            <span className="text-small text-text-muted">{ticket.status}</span>
                                        </>
                                    )}
                                </div>
                                <span className="text-tiny text-text-muted font-mono">{ticket.ticket_code}</span>
                            </div>

                            {/* Action Button */}
                            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-primary text-white font-semibold hover:opacity-90 transition-opacity">
                                <QrCode className="w-5 h-5" />
                                View QR Code
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
