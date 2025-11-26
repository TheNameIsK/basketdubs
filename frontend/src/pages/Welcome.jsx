
/**
 * Welcome Page - First-time user setup
 * Allows users to set their username
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    if (username.length > 20) {
      setError('Username must be less than 20 characters')
      return
    }

    try {
      setLoading(true)
      const token = session?.access_token

      // Set the session flag BEFORE making the API call
      // This prevents the race condition where navigation happens before flag is set
      const sessionKey = `first_login_checked_${user.id}`
      sessionStorage.setItem(sessionKey, 'true')

      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/profile/username`,
        { username },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      // Success! Redirect to court
      navigate('/court')
    } catch (err) {
      // If API call fails, remove the session flag so user can try again
      const sessionKey = `first_login_checked_${user.id}`
      sessionStorage.removeItem(sessionKey)
      setError(err.response?.data?.error || 'Failed to set username')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏀</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome to Basketdubs!
          </h1>
          <p className="text-gray-600">
            Let's get you set up with a username
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Your Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              maxLength={20}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              3-20 characters, visible to other players
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || username.length < 3}
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Setting up...' : 'Continue to Court'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          You can change your username later in your profile
        </div>
      </div>
    </div>
  )
}
