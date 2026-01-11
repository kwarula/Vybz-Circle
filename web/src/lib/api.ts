import { supabase } from './supabase'

const API_BASE = import.meta.env.VITE_API_URL || ''

export async function getAccessToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
}

export async function apiRequest<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: unknown
): Promise<T> {
    const token = await getAccessToken()

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }))
        throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
}

// Typed API helpers
export const api = {
    events: {
        list: (source?: string) =>
            apiRequest<Event[]>('GET', `/api/events${source ? `?source=${source}` : ''}`),
        get: (id: string) =>
            apiRequest<Event>('GET', `/api/events/${id}`),
        trackClick: (id: string, userId?: string) =>
            apiRequest<{ success: boolean; ticketUrl: string }>('POST', `/api/events/${id}/track-click`, { userId }),
    },
    user: {
        getTickets: (userId: string) =>
            apiRequest<Ticket[]>('GET', `/api/users/${userId}/tickets`),
    },
}

// Types (matching shared/schema.ts)
export interface Event {
    id: string
    title: string
    slug?: string
    category?: string
    venue_id?: string
    location?: { lat: number; lng: number }
    starts_at?: string
    ticketing_type?: string
    source?: string
    status?: string
    scout_count?: number
    description?: string
    image_url?: string
    created_at?: string
    source_platform?: string
    source_url?: string
    external_id?: string
    organizer_name?: string
    price_range?: string
    venue_name?: string
    scraped_at?: string
    is_external?: boolean
}

export interface Ticket {
    id: string
    event_id: string
    user_id: string
    ticket_code: string
    status: string
    checked_in_at?: string
    mpesa_receipt?: string
    created_at?: string
}

export interface User {
    id: string
    phone?: string
    email?: string
    display_name?: string
    rep_points?: number
    rep_level?: number
    interests?: string[]
    created_at?: string
}
