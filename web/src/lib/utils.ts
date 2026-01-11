import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-KE', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    })
}

export function formatTime(date: string | Date): string {
    return new Date(date).toLocaleTimeString('en-KE', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    })
}

export function formatDateTime(date: string | Date): string {
    return `${formatDate(date)} · ${formatTime(date)}`
}
