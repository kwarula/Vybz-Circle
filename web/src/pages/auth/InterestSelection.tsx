import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Button } from '@/components/Button'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

const CATEGORIES = [
    { id: 'music', label: 'Music', emoji: '🎵' },
    { id: 'sports', label: 'Sports', emoji: '⚽' },
    { id: 'food', label: 'Food & Drinks', emoji: '🍔' },
    { id: 'wellness', label: 'Wellness', emoji: '🧘' },
    { id: 'networking', label: 'Networking', emoji: '🤝' },
    { id: 'social', label: 'Social', emoji: '🎉' },
    { id: 'arts', label: 'Arts & Culture', emoji: '🎨' },
    { id: 'tech', label: 'Technology', emoji: '💻' },
    { id: 'outdoors', label: 'Outdoors', emoji: '🏕️' },
    { id: 'nightlife', label: 'Nightlife', emoji: '🌙' },
    { id: 'education', label: 'Education', emoji: '📚' },
    { id: 'family', label: 'Family', emoji: '👨‍👩‍👧‍👦' }
]

export default function InterestSelection() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [selectedInterests, setSelectedInterests] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const toggleInterest = (categoryId: string) => {
        setSelectedInterests(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        )
    }

    const handleContinue = async () => {
        if (selectedInterests.length === 0) {
            setError('Please select at least one interest')
            return
        }

        try {
            setLoading(true)
            setError('')

            if (user) {
                // Update user interests in Supabase
                const { error: updateError } = await supabase
                    .from('users')
                    .update({ interests: selectedInterests })
                    .eq('id', user.id)

                if (updateError) throw updateError
            }

            navigate('/')
        } catch (e: any) {
            setError(e.message || 'Failed to save interests')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-midnight-teal flex flex-col p-8">
            <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-center">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-h1 text-white mb-2">What are you into?</h1>
                    <p className="text-text-secondary">Select your interests to personalize your experience</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/30 text-error text-small">
                        {error}
                    </div>
                )}

                {/* Interest Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
                    {CATEGORIES.map(category => {
                        const isSelected = selectedInterests.includes(category.id)
                        return (
                            <button
                                key={category.id}
                                onClick={() => toggleInterest(category.id)}
                                className={`
                                    relative p-4 rounded-xl border-2 transition-all
                                    ${isSelected
                                        ? 'bg-gradient-primary border-sunset-orange'
                                        : 'bg-surface border-surface-tertiary hover:border-sunset-orange/50'
                                    }
                                `}
                            >
                                {isSelected && (
                                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                                        <Check className="w-4 h-4 text-sunset-orange" />
                                    </div>
                                )}
                                <div className="text-4xl mb-2">{category.emoji}</div>
                                <div className={`text-small font-semibold ${isSelected ? 'text-white' : 'text-text-secondary'}`}>
                                    {category.label}
                                </div>
                            </button>
                        )
                    })}
                </div>

                {/* Selected Count */}
                <p className="text-center text-text-muted mb-6">
                    {selectedInterests.length} {selectedInterests.length === 1 ? 'interest' : 'interests'} selected
                </p>

                {/* Continue Button */}
                <Button
                    onClick={handleContinue}
                    className="w-full"
                    size="lg"
                    disabled={loading || selectedInterests.length === 0}
                >
                    {loading ? 'Saving...' : 'Continue'}
                </Button>

                <button
                    onClick={() => navigate('/')}
                    className="mt-4 text-center text-text-secondary hover:text-white transition-colors"
                >
                    Skip for now
                </button>
            </div>
        </div>
    )
}
