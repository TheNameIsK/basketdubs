/**
 * The Court - Main predictions and scores page
 * WITH DEBUGGING IMPROVEMENTS
 */
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { supabase } from '../services/supabase'
import LeBot from '../components/LeBot'

/**
 * Convert game datetime from database (stored as ISO string) to user's local time
 * Database stores times in UTC or with timezone info
 * This function properly converts to user's browser timezone
 */
const parseGameDateTime = (gameDateString) => {
  if (!gameDateString) return new Date()
  
  // The database returns ISO datetime strings like:
  // "2025-11-25T00:00:00+00:00" or "2025-11-25T19:00:00-05:00"
  // JavaScript's Date constructor handles these correctly
  return new Date(gameDateString)
}

/**
 * Check if a game should be in "upcoming" (not started yet)
 * A game is upcoming if:
 * 1. Status is "Scheduled" (hasn't started)
 * 2. Game time is in the future OR time is midnight (00:00:00) which means TBD
 */
const isGameUpcoming = (game) => {
  // If status is not Scheduled, it's not upcoming
  if (game.status !== 'Scheduled') return false
  
  const gameTime = parseGameDateTime(game.date)
  const now = new Date()
  
  // If game time is in the future, it's upcoming
  if (gameTime > now) return true
  
  // If game time is midnight (00:00:00), it means time is TBD - treat as upcoming
  // This handles games where the exact time hasn't been set yet
  const hours = gameTime.getHours()
  const minutes = gameTime.getMinutes()
  const seconds = gameTime.getSeconds()
  
  if (hours === 0 && minutes === 0 && seconds === 0) {
    // Midnight time = TBD, check if it's today or future date
    const gameDate = new Date(gameTime.getFullYear(), gameTime.getMonth(), gameTime.getDate())
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return gameDate >= today
  }
  
  return false
}

/**
 * Categorize games into upcoming (not started) and recent (started/finished)
 * Based on user's current time
 */
const categorizeGames = (allGames) => {
  const upcoming = []
  const recent = []
  
  allGames.forEach(game => {
    if (isGameUpcoming(game)) {
      upcoming.push(game)
    } else {
      recent.push(game)
    }
  })
  
  // Sort upcoming by time (earliest first)
  upcoming.sort((a, b) => parseGameDateTime(a.date) - parseGameDateTime(b.date))
  
  // Sort recent by time (most recent first)
  recent.sort((a, b) => parseGameDateTime(b.date) - parseGameDateTime(a.date))
  
  return { upcoming, recent }
}

/**
 * Format a date for display (e.g., "Mon, Nov 25, 2025")
 */
const formatDateHeader = (date) => {
  return date.toLocaleDateString(undefined, { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Format time only (e.g., "7:00 PM")
 */
const formatTimeOnly = (date) => {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Format date for prediction history (e.g., "Nov 25, 2025")
 */
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Team Logo Component
 * Displays team logo with fallback
 * Uses height-only to maintain aspect ratio
 */
const TeamLogo = ({ abbreviation, className = "h-8" }) => {
  const [imgError, setImgError] = useState(false)
  
  // Don't render if no abbreviation provided
  if (!abbreviation || imgError) {
    return null
  }
  
  return (
    <img 
      src={`/assets/teams/${abbreviation.toLowerCase()}_logo.png`}
      alt={`${abbreviation} logo`}
      className={`${className} w-auto object-contain`}
      onError={() => setImgError(true)}
    />
  )
}

/**
 * Group games by their date in user's timezone
 * Returns object like: { "2025-11-25": [game1, game2], "2025-11-26": [game3] }
 */
const groupGamesByDate = (games) => {
  const grouped = {}

  games.forEach(game => {
    // Use the official NBA date (the date part before timezone)
    const dateKey = game.date.split("T")[0]

    if (!grouped[dateKey]) {
      grouped[dateKey] = []
    }
    grouped[dateKey].push(game)
  })

  return grouped
}

export default function Court() {
  const { user, session, signOut } = useAuth()
  const navigate = useNavigate()
  const [games, setGames] = useState({ upcoming: [], recent: [] })
  const [predictions, setPredictions] = useState({})
  const [predictionHistory, setPredictionHistory] = useState([])
  const [userPoints, setUserPoints] = useState({ spendable: 0, all_time: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState(null)
  
  // Pagination state
  const [currentUpcomingIndex, setCurrentUpcomingIndex] = useState(0)
  const [currentRecentIndex, setCurrentRecentIndex] = useState(0)

  // Memoized grouped games
  const upcomingGroups = useMemo(() => groupGamesByDate(games.upcoming), [games.upcoming])
  const upcomingDates = useMemo(() => Object.keys(upcomingGroups).sort(), [upcomingGroups])
  
  const recentGroups = useMemo(() => groupGamesByDate(games.recent), [games.recent])
  const recentDates = useMemo(() => Object.keys(recentGroups).sort((a, b) => b.localeCompare(a)), [recentGroups])

  useEffect(() => {
    fetchGames()
    fetchPredictionHistory()
  }, [])

  useEffect(() => {
    if (games.upcoming.length > 0 || games.recent.length > 0) {
      fetchPredictions()
    }
    setCurrentUpcomingIndex(0)
    setCurrentRecentIndex(0)
  }, [games])

  useEffect(() => {
    if (user) {
      fetchUserPoints()
    }
  }, [user])

  const fetchGames = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/games`)
      
      // Backend returns all games (yesterday, today, tomorrow)
      // We categorize them based on user's current time
      const allGames = [...response.data.upcoming, ...response.data.recent]
      const categorized = categorizeGames(allGames)
      
      setGames(categorized)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch games:', err)
      setError('Failed to load games. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserPoints = async () => {
    try {
      const token = session?.access_token
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/results`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      setUserPoints(response.data.points)
    } catch (err) {
      console.error('Failed to fetch user points:', err)
    }
  }

  const fetchPredictions = async () => {
    try {
      const allGameIds = [
        ...games.upcoming.map(g => g.id),
        ...games.recent.map(g => g.id)
      ]
      
      if (allGameIds.length === 0) return

      const token = session?.access_token
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/predictions?game_ids=${allGameIds.join(',')}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      setPredictions(response.data)
    } catch (err) {
      console.error('Failed to fetch predictions:', err)
    }
  }

  const fetchPredictionHistory = async () => {
    try {
      setHistoryLoading(true)
      setHistoryError(null)
      console.log('Fetching prediction history...')
      
      const token = session?.access_token
      console.log('Token exists:', !!token)
      console.log('API URL:', import.meta.env.VITE_API_URL)
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/predictions/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      
      console.log('History response:', response.data)
      console.log('History length:', response.data?.length)
      
      setPredictionHistory(response.data)
    } catch (err) {
      console.error('Failed to fetch prediction history:', err)
      console.error('Error response:', err.response?.data)
      console.error('Error status:', err.response?.status)
      setHistoryError(err.response?.data?.error || 'Failed to load prediction history')
    } finally {
      setHistoryLoading(false)
    }
  }

  const handlePrediction = async (gameId, teamId, gameDate) => {
    try {
      setSubmitting(gameId)
      const token = session?.access_token
      
      const game = games.upcoming.find(g => g.id === gameId)
      
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/predictions`,
        {
          game_id: gameId,
          team_id: teamId,
          game_date: gameDate,
          game_status: game?.status || 'Scheduled'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      
      // Refresh all data
      await Promise.all([
        fetchPredictions(),
        fetchUserPoints(),
        fetchPredictionHistory()
      ])
    } catch (err) {
      console.error('Failed to submit prediction:', err)
      alert(err.response?.data?.error || 'Failed to submit prediction')
    } finally {
      setSubmitting(null)
    }
  }

  const handleCancelPrediction = async (gameId) => {
    try {
      setSubmitting(gameId)
      const token = session?.access_token
      
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/predictions/${gameId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      
      await Promise.all([
        fetchPredictions(),
        fetchUserPoints(),
        fetchPredictionHistory()
      ])
    } catch (err) {
      console.error('Failed to cancel prediction:', err)
      alert(err.response?.data?.error || 'Failed to cancel prediction')
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-orange-600">🏀 The Court</h1>
              <p className="text-gray-600 mt-1">Welcome, {user?.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right border-r pr-4">
                <div className="text-sm text-gray-500">Your Balance</div>
                <div className="text-2xl font-bold text-orange-600">
                  {userPoints.spendable} pts
                </div>
                <div className="text-xs text-gray-400">
                  All-time: {userPoints.all_time}
                </div>
                <button
                  onClick={() => {
                    fetchUserPoints()
                    fetchPredictions()
                    fetchPredictionHistory()
                  }}
                  className="text-xs text-blue-500 hover:text-blue-700 mt-1"
                >
                  🔄 Refresh
                </button>
              </div>
              <button
                onClick={() => navigate('/leaderboard')}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
              >
                🏆 Leaderboard
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                👤 Profile
              </button>
              <button
                onClick={() => navigate('/shop')}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
              >
                🛍️ Shop
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

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-600">Loading games...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchGames}
              className="mt-2 text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Games Display */}
        {!loading && !error && (
          <>
            {/* Upcoming Games */}
            <div className="bg-white rounded-lg shadow p-6 mb-4">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                🔮 Upcoming Games - Make Your Picks!
              </h2>
              
              {upcomingDates.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No upcoming games available for predictions</p>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4 bg-gray-50 p-2 rounded-lg">
                    <button 
                      onClick={() => setCurrentUpcomingIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentUpcomingIndex === 0}
                      className="p-2 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      ◀
                    </button>
                    <h3 className="font-semibold text-lg text-gray-700">
                      {(() => {
                        const firstGame = upcomingGroups[upcomingDates[currentUpcomingIndex]][0]
                        const raw = firstGame.date.split("T")[0]
                        return new Date(raw).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      })()}
                    </h3>
                    <button 
                      onClick={() => setCurrentUpcomingIndex(prev => Math.min(upcomingDates.length - 1, prev + 1))}
                      disabled={currentUpcomingIndex === upcomingDates.length - 1}
                      className="p-2 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      ▶
                    </button>
                  </div>

                  <div className="space-y-3">
                    {upcomingGroups[upcomingDates[currentUpcomingIndex]].map((game) => {
                      const prediction = predictions[game.id]
                      const visitorPicked = prediction?.predicted_team_id === game.visitor_team.id
                      const homePicked = prediction?.predicted_team_id === game.home_team.id
                      const isSubmitting = submitting === game.id

                      return (
                        <div 
                          key={game.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors"
                        >
                          {prediction && (
                            <div className="flex justify-end mb-2">
                              <button
                                onClick={() => handleCancelPrediction(game.id)}
                                disabled={isSubmitting}
                                className="text-xs text-red-500 hover:text-red-700 underline"
                              >
                                Cancel Pick
                              </button>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <button 
                              onClick={() => handlePrediction(game.id, game.visitor_team.id, game.date.split('T')[0])}
                              disabled={isSubmitting}
                              className={`flex-1 text-left p-3 rounded-lg transition-all ${
                                visitorPicked
                                  ? 'bg-orange-500 text-white shadow-lg'
                                  : 'hover:bg-orange-50'
                              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="font-bold text-lg">{game.visitor_team.abbreviation}</div>
                                <TeamLogo abbreviation={game.visitor_team.abbreviation} />
                              </div>
                              <div className={`text-sm ${visitorPicked ? 'text-orange-100' : 'text-gray-600'}`}>
                                {game.visitor_team.city}
                              </div>
                              {visitorPicked && (
                                <div className="text-xs mt-1 font-semibold">✓ Your Pick</div>
                              )}
                            </button>

                            <div className="px-4 text-center">
                              <div className="text-gray-400 text-sm">vs</div>
                              <div className="text-xs text-gray-500 mt-1 whitespace-nowrap">
                                {formatTimeOnly(parseGameDateTime(game.date))}
                              </div>
                            </div>

                            <button 
                              onClick={() => handlePrediction(game.id, game.home_team.id, game.date.split('T')[0])}
                              disabled={isSubmitting}
                              className={`flex-1 text-right p-3 rounded-lg transition-all ${
                                homePicked 
                                  ? 'bg-orange-500 text-white shadow-lg' 
                                  : 'hover:bg-orange-50'
                              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <div className="flex items-center justify-end gap-2">
                                <TeamLogo abbreviation={game.home_team.abbreviation} />
                                <div className="font-bold text-lg">{game.home_team.abbreviation}</div>
                              </div>
                              <div className={`text-sm ${homePicked ? 'text-orange-100' : 'text-gray-600'}`}>
                                {game.home_team.city}
                              </div>
                              {homePicked && (
                                <div className="text-xs mt-1 font-semibold">✓ Your Pick</div>
                              )}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Recent Games */}
            <div className="bg-white rounded-lg shadow p-6 mb-4">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                📊 Recent Games
              </h2>
              
              {recentDates.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent games</p>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4 bg-gray-50 p-2 rounded-lg">
                    <button 
                      onClick={() => setCurrentRecentIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentRecentIndex === 0}
                      className="p-2 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      ◀
                    </button>
                    <h3 className="font-semibold text-lg text-gray-700">
                      {(() => {
                        const firstGame = recentGroups[recentDates[currentRecentIndex]][0]
                        const raw = firstGame.date.split("T")[0]
                        return new Date(raw).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      })()}
                    </h3>
                    <button 
                      onClick={() => setCurrentRecentIndex(prev => Math.min(recentDates.length - 1, prev + 1))}
                      disabled={currentRecentIndex === recentDates.length - 1}
                      className="p-2 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      ▶
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      {recentGroups[recentDates[currentRecentIndex]].map((game) => {
                        const prediction = predictions[game.id]
                        const isFinal = game.status === 'Final'
                        
                        let winnerId = null
                        if (isFinal && game.home_score !== null && game.visitor_score !== null) {
                          winnerId = game.home_score > game.visitor_score 
                            ? game.home_team.id 
                            : game.visitor_team.id
                        }
                        
                        const userWon = prediction && winnerId && prediction.predicted_team_id === winnerId
                        const userLost = prediction && winnerId && prediction.predicted_team_id !== winnerId
                        
                        return (
                          <div 
                            key={game.id}
                            className={`border rounded-lg p-4 ${
                              userWon ? 'border-green-400 bg-green-50' : 
                              userLost ? 'border-red-400 bg-red-50' : 
                              'border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 text-left">
                                <div className="flex items-center gap-2">
                                  <div className="font-bold text-lg">{game.visitor_team.abbreviation}</div>
                                  <TeamLogo abbreviation={game.visitor_team.abbreviation} />
                                  {prediction?.predicted_team_id === game.visitor_team.id && (
                                    <span className="text-xs">🎯</span>
                                  )}
                                </div>
                                <div className="text-2xl font-bold text-gray-800">
                                  {game.visitor_score ?? '-'}
                                </div>
                              </div>

                              <div className="px-4 text-center">
                                <div className="text-sm font-semibold text-gray-600">
                                  {game.status === 'Final' ? 'FINAL' : game.status}
                                </div>
                                {userWon && (
                                  <div className="text-xs font-bold text-green-600 mt-1">+2 pts</div>
                                )}
                                {userLost && (
                                  <div className="text-xs font-bold text-red-600 mt-1">-1 pt</div>
                                )}
                              </div>

                              <div className="flex-1 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {prediction?.predicted_team_id === game.home_team.id && (
                                    <span className="text-xs">🎯</span>
                                  )}
                                  <TeamLogo abbreviation={game.home_team.abbreviation} />
                                  <div className="font-bold text-lg">{game.home_team.abbreviation}</div>
                                </div>
                                <div className="text-2xl font-bold text-gray-800">
                                  {game.home_score ?? '-'}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Prediction History */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  📜 Your Prediction History
                </h2>
                <button
                  onClick={fetchPredictionHistory}
                  disabled={historyLoading}
                  className="text-sm text-blue-500 hover:text-blue-700 disabled:opacity-50"
                >
                  {historyLoading ? 'Loading...' : '🔄 Refresh'}
                </button>
              </div>
              
              {historyLoading && (
                <div className="text-center py-8">
                  <div className="text-gray-500">Loading prediction history...</div>
                </div>
              )}

              {historyError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600">{historyError}</p>
                  <button 
                    onClick={fetchPredictionHistory}
                    className="mt-2 text-red-700 underline text-sm"
                  >
                    Try again
                  </button>
                </div>
              )}
              
              {!historyLoading && !historyError && predictionHistory.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No settled predictions yet. Make some predictions to see your history!
                </p>
              )}

              {!historyLoading && !historyError && predictionHistory.length > 0 && (
                <div className="space-y-2">
                  {predictionHistory.map((pred, index) => (
                    <div 
                      key={`${pred.game_id}-${index}`}
                      className={`border rounded-lg p-4 ${
                        pred.result === 'win' 
                          ? 'border-green-400 bg-green-50' 
                          : 'border-red-400 bg-red-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold ${
                              pred.result === 'win' ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {pred.result === 'win' ? '✓ WIN' : '✗ LOSS'}
                            </span>
                            <span className={`text-sm px-2 py-1 rounded ${
                              pred.result === 'win' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                            }`}>
                              {pred.result === 'win' ? '+2 pts' : '-1 pt'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                            <TeamLogo abbreviation={pred.visitor_abbr} className="h-6" />
                            <span>{pred.matchup}</span>
                            <TeamLogo abbreviation={pred.home_abbr} className="h-6" />
                            <span>•</span>
                            <span>{pred.score}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(pred.game_date)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">You picked:</div>
                          <div className="font-bold text-gray-800 mt-1">{pred.predicted_team_name}</div>
                          <div className="flex items-center justify-end gap-2 text-xs text-gray-500 mt-1">
                            <span>Winner:</span>
                            <span>{pred.winner_name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* LeBot AI Assistant */}
      <LeBot />
    </div>
  )
}