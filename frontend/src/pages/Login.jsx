/**
 * Login Page - Google OAuth Authentication
 * VINTAGE REDESIGN: Basketball Program Style
 */
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export default function Login() {
  const { user, session, signInWithGoogle, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    console.log('Login page - User:', user, 'Session:', session, 'Loading:', loading)
    // If user is already authenticated, redirect to court
    // The ProtectedRoute in App.jsx will handle the welcome page check
    if (!loading && user && session) {
      console.log('✅ User already authenticated, redirecting to /court')
      navigate('/court', { replace: true })
    }
  }, [user, session, loading, navigate])

  const handleGoogleLogin = async () => {
    try {
      console.log('🚀 Starting Google login...')
      const result = await signInWithGoogle()
      console.log('✅ Google login initiated:', result)
      // After OAuth redirect, user will land on /court
      // ProtectedRoute will check if they need to go to /welcome
    } catch (error) {
      console.error('❌ Login error:', error)
      console.error('Error details:', error.message, error.stack)
      alert(`Failed to sign in: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-vintage-cream flex items-center justify-center">
        <div className="text-center">
          <div className="scoreboard-panel inline-block px-8 py-6">
            <div className="font-bebas text-2xl animate-pulse">LOADING...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-vintage-cream flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Court Lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-1 h-1/2 bg-ink-black/10"></div>
        <div className="absolute top-1/4 right-1/4 w-1 h-1/2 bg-ink-black/10"></div>
        <div className="absolute left-1/2 top-1/3 w-1/2 h-1 bg-ink-black/10 transform -translate-x-1/2"></div>
        <div className="absolute left-1/2 bottom-1/3 w-1/2 h-1 bg-ink-black/10 transform -translate-x-1/2"></div>
      </div>
      
      {/* Main Login Card */}
      <div className="relative w-full max-w-md">
        {/* Vintage Header */}
        <div className="scoreboard-panel text-center mb-8">
          <div className="font-bebas text-5xl tracking-widest">BASKETDUBS</div>
          <div className="text-sm text-vintage-cream/80 mt-2">THE HARDWOOD EDITION</div>
        </div>
        
        {/* Login Card */}
        <div className="card-vintage relative z-10">
          {/* Program Header */}
          <div className="border-b-2 border-ink-black pb-4 mb-6">
            <div className="font-bebas text-2xl tracking-wider">OFFICIAL PROGRAM</div>
            <div className="text-sm text-ink-black/60 font-roboto-slab mt-1">
              VINTAGE NBA PREDICTION GAME
            </div>
          </div>
          
          {/* Welcome Message */}
          <div className="mb-8">
            <div className="text-4xl text-center mb-4">🏀</div>
            <h1 className="font-bebas text-3xl text-center mb-3">WELCOME TO THE COURT</h1>
            <p className="text-ink-black/70 text-center font-roboto-slab">
              Predict NBA games, earn points, customize your player.
              Zero gambling, 100% basketball fun.
            </p>
          </div>
          
          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="text-center p-3 border-2 border-ink-black/20">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-bebas text-sm">PREDICT GAMES</div>
            </div>
            <div className="text-center p-3 border-2 border-ink-black/20">
              <div className="text-2xl mb-2">🏆</div>
              <div className="font-bebas text-sm">EARN POINTS</div>
            </div>
            <div className="text-center p-3 border-2 border-ink-black/20">
              <div className="text-2xl mb-2">👕</div>
              <div className="font-bebas text-sm">CUSTOMIZE</div>
            </div>
            <div className="text-center p-3 border-2 border-ink-black/20">
              <div className="text-2xl mb-2">📈</div>
              <div className="font-bebas text-sm">LEADERBOARD</div>
            </div>
          </div>
          
          {/* Login Button */}
          <div className="text-center">
            <button
              onClick={handleGoogleLogin}
              className="btn-vintage w-full py-4 text-lg"
            >
              ENTER WITH GOOGLE
            </button>
            
            <div className="text-xs text-ink-black/40 mt-4 font-roboto-slab">
              Quick sign-in • No passwords • 24-hour sessions
            </div>
          </div>
        </div>
        
        {/* Vintage Footer */}
        <div className="text-center mt-8">
          <div className="text-sm text-ink-black/60 font-roboto-slab mb-2">
            EST. 2026 • NOT AFFILIATED WITH THE NBA
          </div>
          <div className="text-xs text-ink-black/40">
            Sessions automatically expire after 24 hours for security
          </div>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute bottom-8 left-8 opacity-10">
        <div className="font-bebas text-6xl">🏀</div>
      </div>
      <div className="absolute top-8 right-8 opacity-10">
        <div className="font-bebas text-6xl">🏆</div>
      </div>
    </div>
  )
}