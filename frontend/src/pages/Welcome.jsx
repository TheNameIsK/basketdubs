/**
 * Welcome Page - First-time user setup
 * VINTAGE REDESIGN: Rookie Registration Style
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'

export default function Welcome() {
  const { session, user } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Debug: Log when component mounts/unmounts
  console.log('Welcome component rendered, username:', username)

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('Form submitted with username:', username)
    
    // Prevent double submission
    if (loading) {
      console.log('Already loading, ignoring submit')
      return
    }
    
    setError('')

    if (username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    if (username.length > 20) {
      setError('Username must be less than 20 characters')
      return
    }

    // Store username in a variable to prevent state issues during async operations
    const usernameToSubmit = username

    try {
      setLoading(true)
      const token = session?.access_token
      console.log('Submitting username:', usernameToSubmit, 'with token:', token ? 'present' : 'missing')
      
      if (!token) {
        throw new Error('No authentication token')
      }

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/profile/username`,
        { username: usernameToSubmit },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      console.log('Username update response:', response.data)

      // Clear the session storage flag
      if (user?.id) {
        const sessionKey = `first_login_checked_${user.id}`
        sessionStorage.setItem(sessionKey, 'true')
        console.log(`Set sessionStorage ${sessionKey} = true`)
      }

      // Navigate to court
      console.log('✅ Username set successfully, navigating to /court')
      navigate('/court', { replace: true })

    } catch (err) {
      console.error('Failed to set username:', err)
      setError(err.response?.data?.error || 'Failed to set username. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Generate a suggested username based on email
  const getSuggestedUsername = () => {
    if (!user?.email) return 'RookiePlayer'
    const emailPart = user.email.split('@')[0]
    const cleaned = emailPart.replace(/[^a-zA-Z0-9]/g, '')
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase() || 'RookiePlayer'
  }

  // Auto-fill suggested username on component mount
  useState(() => {
    if (!username) {
      setUsername(getSuggestedUsername())
    }
  })

  return (
    <div className="min-h-screen bg-vintage-cream flex items-center justify-center p-4 relative overflow-hidden">
      {/* Vintage Court Background */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-ink-black rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 transform -translate-y-1/2 w-32 h-32 border border-ink-black"></div>
        <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2 w-32 h-32 border border-ink-black"></div>
      </div>
      
      {/* Main Content */}
      <div className="relative w-full max-w-md">
        {/* Vintage Header */}
        <div className="scoreboard-panel text-center mb-8">
          <div className="font-bebas text-4xl tracking-widest">ROOKIE REGISTRATION</div>
          <div className="text-sm text-vintage-cream/80 mt-2">WELCOME TO BASKETDUBS</div>
        </div>
        
        {/* Registration Card */}
        <div className="card-vintage relative z-10">
          {/* Header */}
          <div className="border-b-2 border-ink-black pb-4 mb-6">
            <div className="font-bebas text-xl tracking-wider">CHOOSE YOUR PLAYER NAME</div>
            <div className="text-sm text-ink-black/60 font-roboto-slab mt-1">
              This will be your identity in the league
            </div>
          </div>
          
          {/* Welcome Message */}
          <div className="mb-8 text-center">
            <div className="text-5xl mb-4">🎯</div>
            <h2 className="font-bebas text-2xl mb-3">WELCOME, ROOKIE!</h2>
            <p className="text-ink-black/70 font-roboto-slab">
              You're about to enter the Basketdubs league. Choose a player name
              that will appear on the leaderboard and in-game.
            </p>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm text-ink-black/60 font-roboto-slab mb-2">
                PLAYER NAME
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border-2 border-ink-black bg-vintage-cream
                         font-bebas text-lg tracking-wider
                         focus:outline-none focus:border-burnt-orange"
                placeholder="Enter your player name"
                maxLength={20}
                disabled={loading}
              />
              <div className="text-xs text-ink-black/40 mt-2 font-roboto-slab">
                3-20 characters • Letters, numbers, and underscores only
              </div>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 border-2 border-scoreboard-red bg-scoreboard-red/10">
                <div className="text-scoreboard-red text-sm font-roboto-slab">{error}</div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="btn-vintage w-full py-4 text-lg"
              >
                {loading ? 'ENTERING LEAGUE...' : 'ENTER THE COURT'}
              </button>
              
              <button
                type="button"
                onClick={() => setUsername(getSuggestedUsername())}
                disabled={loading}
                className="btn-vintage-outline w-full py-3 text-sm"
              >
                USE SUGGESTED NAME
              </button>
            </div>
          </form>
          
          {/* Tips */}
          <div className="mt-8 pt-6 border-t border-ink-black/20">
            <div className="text-xs text-ink-black/40 font-roboto-slab uppercase tracking-wider mb-2">
              TIPS FOR ROOKIES
            </div>
            <ul className="text-sm text-ink-black/60 space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-burnt-orange">•</span>
                <span>Correct predictions earn +2 points</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-burnt-orange">•</span>
                <span>Wrong predictions lose -1 point</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-burnt-orange">•</span>
                <span>Spend points on gear in the Locker Room</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-burnt-orange">•</span>
                <span>Compete for the top spot on the leaderboard</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Vintage Footer */}
        <div className="text-center mt-8">
          <div className="text-sm text-ink-black/60 font-roboto-slab mb-2">
            YOUR JOURNEY STARTS HERE
          </div>
          <div className="text-xs text-ink-black/40">
            You can change your player name anytime from your profile
          </div>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute bottom-4 left-4 opacity-10">
        <div className="font-bebas text-4xl">🏀</div>
      </div>
      <div className="absolute top-4 right-4 opacity-10">
        <div className="font-bebas text-4xl">👤</div>
      </div>
    </div>
  )
}