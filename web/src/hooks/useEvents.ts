import { useQuery } from '@tanstack/react-query'
import { api, type Event } from '@/lib/api'

export function useEvents(source?: string) {
    return useQuery<Event[]>({
        queryKey: ['events', source],
        queryFn: () => api.events.list(source),
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}

export function useEvent(id: string) {
    return useQuery<Event>({
        queryKey: ['event', id],
        queryFn: () => api.events.get(id),
        enabled: !!id,
    })
}
