/**
 * Authentication Context for Basketdubs
 * Manages user session and authentication state
 */
import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 Initial session check:', session ? 'Session found' : 'No session')
      
      if (session) {
        // Debug: Log the full session object to see what timestamps are available
        console.log('📊 Session object:', {
          expires_at: session.expires_at,
          expires_in: session.expires_in,
          user: {
            created_at: session.user?.created_at,
            last_sign_in_at: session.user?.last_sign_in_at,
          }
        })
      }
      
      checkSessionExpiry(session)
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state changed:', event, session ? 'Session exists' : 'No session')
      
      checkSessionExpiry(session)
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Check session expiry every 5 minutes
    const intervalId = setInterval(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        checkSessionExpiry(session)
      })
    }, 5 * 60 * 1000) // 5 minutes

    return () => {
      subscription.unsubscribe()
      clearInterval(intervalId)
    }
  }, [])

  const checkSessionExpiry = (session) => {
    if (!session) return

    const now = Date.now()
    
    // Check if user's last sign-in was more than 24 hours ago
    // last_sign_in_at is provided by Supabase/Google OAuth
    const lastSignInAt = session.user?.last_sign_in_at
    
    if (lastSignInAt) {
      const lastSignInTime = new Date(lastSignInAt).getTime()
      const twentyFourHours = 24 * 60 * 60 * 1000 // in milliseconds
      const timeSinceLogin = now - lastSignInTime
      
      if (timeSinceLogin > twentyFourHours) {
        console.log('⏰ User logged in more than 24 hours ago, signing out...')
        console.log(`Last sign in: ${lastSignInAt}, Time since: ${Math.floor(timeSinceLogin / 1000 / 60 / 60)} hours`)
        signOut()
        return
      }
    }
    
    // Note: We don't need to check session.expires_at because Supabase
    // automatically refreshes tokens and handles expiry for us
  }

  const signInWithGoogle = async () => {
    console.log('🔑 Calling Supabase signInWithOAuth...')
    console.log('Redirect URL:', `${window.location.origin}/court`)
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/court`
      }
    })
    
    console.log('OAuth response:', { data, error })
    
    if (error) {
      console.error('❌ OAuth error:', error)
      throw error
    }
    
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
