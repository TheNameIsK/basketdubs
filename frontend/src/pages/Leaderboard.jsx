/**
 * Leaderboard Page - Top users by all-time points
 */
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function Leaderboard() {
  const { user, session, signOut } = useAuth()
  const navigate = useNavigate()
  const [leaderboard, setLeaderboard] = useState([])
  const [currentUserRank, setCurrentUserRank] = useState(null)
  const [currentUserData, setCurrentUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = session?.access_token
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/leaderboard`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      
      setLeaderboard(response.data.leaderboard)
      setCurrentUserRank(response.data.current_user_rank)
      setCurrentUserData(response.data.current_user_data)
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err)
      setError('Failed to load leaderboard. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return null
  }

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-600'
    if (rank === 2) return 'text-gray-500'
    if (rank === 3) return 'text-orange-600'
    return 'text-gray-700'
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-orange-600">🏆 Leaderboard</h1>
              <p className="text-gray-600 mt-1">Top predictors by all-time points</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/court')}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                🏀 Court
              </button>
              <button
                onClick={() => navigate('/shop')}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
              >
                🛍️ Shop
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                👤 Profile
              </button>
              <button
                onClick={signOut}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Current User Rank (if not in top 50) */}
        {currentUserData && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow p-6 mb-4 text-white">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm opacity-90">Your Rank</div>
                <div className="text-3xl font-bold">#{currentUserRank}</div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-90">Your Points</div>
                <div className="text-2xl font-bold">{currentUserData.all_time_points} pts</div>
                <div className="text-xs opacity-75">
                  {currentUserData.spendable_points} spendable
                </div>
              </div>
            </div>
            <div className="mt-2 text-sm opacity-90">
              Keep predicting to climb the ranks! 🚀
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-600">Loading leaderboard...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchLeaderboard}
              className="mt-2 text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Leaderboard Table */}
        {!loading && !error && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Player
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                      All-Time Points
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                      Spendable
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leaderboard.map((player) => (
                    <tr 
                      key={player.user_id}
                      className={`hover:bg-gray-50 transition-colors ${
                        player.is_current_user ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${getRankColor(player.rank)}`}>
                            #{player.rank}
                          </span>
                          {getMedalEmoji(player.rank) && (
                            <span className="text-2xl">{getMedalEmoji(player.rank)}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${
                            player.is_current_user ? 'text-blue-600' : 'text-gray-800'
                          }`}>
                            {player.username}
                          </span>
                          {player.is_current_user && (
                            <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-lg font-bold text-orange-600">
                          {player.all_time_points}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-gray-600">
                          {player.spendable_points}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {leaderboard.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">🏀</div>
                <p>No players on the leaderboard yet.</p>
                <p className="text-sm mt-1">Be the first to make predictions!</p>
              </div>
            )}
          </div>
        )}

        {/* Footer Info */}
        {!loading && !error && leaderboard.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            <p>Showing top {leaderboard.length} players</p>
            <p className="mt-1">Rankings update in real-time as games are scored</p>
          </div>
        )}
      </div>
    </div>
  )
}
