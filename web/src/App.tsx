import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/hooks/useAuth'
import { ThemeProvider } from '@/hooks/useTheme'
import { Navbar } from '@/components/Navbar'

// Pages
import Home from '@/pages/Home'
import EventDetail from '@/pages/EventDetail'
import Discover from '@/pages/Discover'
import Profile from '@/pages/Profile'
import SignIn from '@/pages/auth/SignIn'
import AuthCallback from '@/pages/auth/Callback'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-midnight-teal">
      <Navbar />
      {/* Main content - full width, with top padding for fixed navbar */}
      <main className="pt-16 lg:pt-16 pb-16 lg:pb-0">
        {/* Generous horizontal padding like Airbnb */}
        <div className="max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-20">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Auth Routes (no layout) */}
              <Route path="/auth/signin" element={<SignIn />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Main App Routes */}
              <Route path="/" element={<AppLayout><Home /></AppLayout>} />
              <Route path="/events/:id" element={<AppLayout><EventDetail /></AppLayout>} />
              <Route path="/discover" element={<AppLayout><Discover /></AppLayout>} />
              <Route path="/messages" element={<AppLayout><ComingSoon title="Messages" /></AppLayout>} />
              <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

// Placeholder for upcoming pages
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
      <h1 className="text-h1 text-white mb-4 sticker px-6 py-2 glass-vibrant">{title}</h1>
      <p className="text-h2 text-text-secondary animate-pulse">Coming soon...</p>
    </div>
  )
}
