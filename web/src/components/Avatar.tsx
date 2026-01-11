import { cn } from '@/lib/utils'

interface AvatarProps {
    src?: string | null
    alt?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    className?: string
}

const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
}

export function Avatar({ src, alt = 'Avatar', size = 'md', className }: AvatarProps) {
    return (
        <div className={cn(
            'rounded-full overflow-hidden bg-surface-tertiary flex items-center justify-center',
            sizes[size],
            className
        )}>
            {src ? (
                <img src={src} alt={alt} className="w-full h-full object-cover" />
            ) : (
                <span className={cn(
                    'font-bold text-text-muted',
                    size === 'sm' && 'text-xs',
                    size === 'md' && 'text-sm',
                    size === 'lg' && 'text-base',
                    size === 'xl' && 'text-lg',
                )}>
                    {alt.charAt(0).toUpperCase()}
                </span>
            )}
        </div>
    )
}
