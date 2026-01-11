import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const DATES = ['Today', 'Tomorrow', 'This Weekend', 'Next Week', 'Choose Date']
const PRICES = ['Any Price', 'Free', 'Under 1000', 'Under 3000', 'High End']
const CATEGORIES = ['All', 'Music', 'Wellness', 'Social', 'Networking', 'Comedy', 'Sports', 'Food']

export interface FilterState {
    date: string
    price: string
    categories: string[]
    verifiedOnly: boolean
    includeSoldOut: boolean
}

interface FilterModalProps {
    isOpen: boolean
    onClose: () => void
    onApply: (filters: FilterState) => void
    initialFilters?: FilterState
}

export default function FilterModal({ isOpen, onClose, onApply, initialFilters }: FilterModalProps) {
    const [selectedDate, setSelectedDate] = useState(initialFilters?.date || 'This Weekend')
    const [selectedPrice, setSelectedPrice] = useState(initialFilters?.price || 'Any Price')
    const [selectedCategories, setSelectedCategories] = useState<string[]>(initialFilters?.categories || [])
    const [verifiedOnly, setVerifiedOnly] = useState(initialFilters?.verifiedOnly ?? true)
    const [includeSoldOut, setIncludeSoldOut] = useState(initialFilters?.includeSoldOut ?? false)

    // Update state when initialFilters change
    useEffect(() => {
        if (initialFilters) {
            setSelectedDate(initialFilters.date)
            setSelectedPrice(initialFilters.price)
            setSelectedCategories(initialFilters.categories)
            setVerifiedOnly(initialFilters.verifiedOnly)
            setIncludeSoldOut(initialFilters.includeSoldOut)
        }
    }, [initialFilters])

    const toggleCategory = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        )
    }

    const handleReset = () => {
        setSelectedDate('This Weekend')
        setSelectedPrice('Any Price')
        setSelectedCategories([])
        setVerifiedOnly(true)
        setIncludeSoldOut(false)
    }

    const handleApply = () => {
        onApply({
            date: selectedDate,
            price: selectedPrice,
            categories: selectedCategories,
            verifiedOnly,
            includeSoldOut,
        })
        onClose()
    }

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="bg-surface border border-surface-tertiary rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-surface-tertiary">
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
                        >
                            <X className="w-5 h-5 text-text-secondary" />
                        </button>
                        <h2 className="text-h2 text-white font-semibold">Filters</h2>
                        <button
                            onClick={handleReset}
                            className="text-body font-semibold text-sunset-orange hover:text-sunset-orange/80 transition-colors"
                        >
                            Reset
                        </button>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6 space-y-8">
                        {/* Date Filter */}
                        <div className="space-y-3">
                            <h3 className="text-small font-semibold text-text-secondary uppercase tracking-wider">
                                When
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {DATES.map((date) => (
                                    <button
                                        key={date}
                                        onClick={() => setSelectedDate(date)}
                                        className={cn(
                                            'px-4 py-2 rounded-full text-small font-semibold transition-all',
                                            selectedDate === date
                                                ? 'bg-sunset-orange text-white'
                                                : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary border border-surface-tertiary'
                                        )}
                                    >
                                        {date}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Price Filter */}
                        <div className="space-y-3">
                            <h3 className="text-small font-semibold text-text-secondary uppercase tracking-wider">
                                Price
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {PRICES.map((price) => (
                                    <button
                                        key={price}
                                        onClick={() => setSelectedPrice(price)}
                                        className={cn(
                                            'px-4 py-2 rounded-full text-small font-semibold transition-all',
                                            selectedPrice === price
                                                ? 'bg-sunset-orange text-white'
                                                : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary border border-surface-tertiary'
                                        )}
                                    >
                                        {price}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Categories Filter */}
                        <div className="space-y-3">
                            <h3 className="text-small font-semibold text-text-secondary uppercase tracking-wider">
                                Categories
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => toggleCategory(category)}
                                        className={cn(
                                            'px-4 py-2 rounded-full text-small font-semibold transition-all',
                                            selectedCategories.includes(category)
                                                ? 'bg-sunset-orange text-white'
                                                : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary border border-surface-tertiary'
                                        )}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Toggle Options */}
                        <div className="space-y-3">
                            <h3 className="text-small font-semibold text-text-secondary uppercase tracking-wider">
                                Options
                            </h3>
                            <div className="space-y-4">
                                {/* Verified Events Only */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary border border-surface-tertiary">
                                    <div>
                                        <p className="text-body text-white font-medium">Verified Events Only</p>
                                        <p className="text-small text-text-muted">Show only trusted organizers</p>
                                    </div>
                                    <button
                                        onClick={() => setVerifiedOnly(!verifiedOnly)}
                                        className={cn(
                                            'relative w-12 h-6 rounded-full transition-colors',
                                            verifiedOnly ? 'bg-sunset-orange' : 'bg-surface-tertiary'
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                                                verifiedOnly ? 'left-7' : 'left-1'
                                            )}
                                        />
                                    </button>
                                </div>

                                {/* Include Sold Out */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary border border-surface-tertiary">
                                    <div>
                                        <p className="text-body text-white font-medium">Include Sold Out</p>
                                        <p className="text-small text-text-muted">Show events with no tickets left</p>
                                    </div>
                                    <button
                                        onClick={() => setIncludeSoldOut(!includeSoldOut)}
                                        className={cn(
                                            'relative w-12 h-6 rounded-full transition-colors',
                                            includeSoldOut ? 'bg-sunset-orange' : 'bg-surface-tertiary'
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                                                includeSoldOut ? 'left-7' : 'left-1'
                                            )}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-surface-tertiary">
                        <button
                            onClick={handleApply}
                            className="w-full h-14 rounded-xl bg-gradient-primary text-white font-semibold text-body hover:opacity-90 active:scale-[0.98] transition-all"
                        >
                            Show Results
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
