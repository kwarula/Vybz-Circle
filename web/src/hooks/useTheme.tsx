import { useState, useEffect, createContext, useContext } from 'react'
import type { ReactNode } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeContextType {
    theme: Theme
    isDark: boolean
    setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window === 'undefined') return 'dark'
        return (localStorage.getItem('theme') as Theme) || 'dark'
    })

    const [isDark, setIsDark] = useState(true)

    useEffect(() => {
        const root = document.documentElement

        if (theme === 'system') {
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            setIsDark(systemDark)
            root.classList.toggle('dark', systemDark)
        } else {
            setIsDark(theme === 'dark')
            root.classList.toggle('dark', theme === 'dark')
        }

        localStorage.setItem('theme', theme)
    }, [theme])

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme)
    }

    return (
        <ThemeContext.Provider value={{ theme, isDark, setTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}
