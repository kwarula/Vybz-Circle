import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps {
    children: ReactNode
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
    size?: 'sm' | 'md' | 'lg'
    className?: string
    disabled?: boolean
    onClick?: () => void
    type?: 'button' | 'submit'
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    className,
    disabled,
    onClick,
    type = 'button',
}: ButtonProps) {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bright-turquoise focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'

    const variants = {
        primary: 'gradient-primary text-white hover:opacity-90 active:scale-[0.98]',
        secondary: 'bg-surface-secondary text-white hover:bg-surface-tertiary active:scale-[0.98]',
        ghost: 'text-text-secondary hover:text-white hover:bg-surface-secondary',
        outline: 'border-2 border-sunset-orange text-sunset-orange hover:bg-sunset-orange hover:text-white',
    }

    const sizes = {
        sm: 'h-9 px-4 text-sm',
        md: 'h-12 px-6 text-base',
        lg: 'h-14 px-8 text-lg',
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={cn(baseStyles, variants[variant], sizes[size], className)}
        >
            {children}
        </button>
    )
}
