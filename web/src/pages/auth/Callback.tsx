import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
    const navigate = useNavigate()

    useEffect(() => {
        // Handle the OAuth callback
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                navigate('/', { replace: true })
            } else {
                navigate('/auth/signin', { replace: true })
            }
        })
    }, [navigate])

    return (
        <div className="min-h-screen bg-midnight-teal flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-2 border-sunset-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-text-secondary">Signing you in...</p>
            </div>
        </div>
    )
}
