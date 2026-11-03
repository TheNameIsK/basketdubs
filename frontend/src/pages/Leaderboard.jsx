/**
 * Leaderboard Page - Top users by all-time points
 * VINTAGE REDESIGN: Newspaper Style Standings
 */
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navigation from '../components/common/Navigation'

export default function Leaderboard() {
  const { user, session } = useAuth()
  const navigate = useNavigate()
  const [leaderboard, setLeaderboard] = useState([])
  const [currentUserRank, setCurrentUserRank] = useState(null)
  const [currentUserData, setCurrentUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeView, setActiveView] = useState('overall')

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

  // Podium Component for Top 3
  const Podium = ({ topPlayers }) => {
    return (
      <div className="card-vintage mb-8">
        <div className="font-bebas text-2xl tracking-wider mb-6 text-center">
          LEAGUE PODIUM
        </div>
        
        <div className="flex items-end justify-center gap-6">
          {[2, 1, 3].map(position => {
            const player = topPlayers[position - 1]
            if (!player) return null
            
            return (
              <div key={player.id} className="text-center">
                {/* Podium Stand */}
                <div className={`
                  flex flex-col items-center justify-end
                  ${position === 1 ? 'h-32 bg-burnt-orange' : 
                    position === 2 ? 'h-28 bg-vintage-navy' : 
                    'h-24 bg-forest-green'}
                  border-2 border-ink-black relative
                `}>
                  <div className="mt-4">
                    <div className="font-bebas text-4xl text-vintage-cream">
                      {position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉'}
                    </div>
                  </div>
                </div>
                
                {/* Player Info */}
                <div className="mt-4">
                  <div className="font-bebas text-xl">{player.username}</div>
                  <div className="text-sm text-ink-black/60">
                    {player.all_time_points} PTS
                  </div>
                  <div className="text-xs text-ink-black/40 mt-1">
                    {player.correct_predictions || 0} W • {player.win_rate || 0}%
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Newspaper Style Table Row
  const LeaderboardRow = ({ player, rank, isCurrentUser }) => {
    return (
      <div className={`
        flex items-center justify-between p-4 border-b border-ink-black/20
        ${isCurrentUser ? 'bg-burnt-orange/10 border-l-2 border-l-burnt-orange' : ''}
        hover:bg-ink-black/5 transition-colors duration-200
      `}>
        {/* Rank & Player */}
        <div className="flex items-center gap-4">
          <div className={`
            w-10 h-10 flex items-center justify-center font-bebas text-lg
            ${rank <= 3 ? 'bg-burnt-orange text-vintage-cream' : 'bg-ink-black/10'}
            border border-ink-black/30
          `}>
            {rank}
          </div>
          
          <div>
            <div className="font-bebas text-lg">
              {player.username}
              {isCurrentUser && (
                <span className="ml-2 text-xs text-burnt-orange">(YOU)</span>
              )}
            </div>
            <div className="text-xs text-ink-black/60 font-roboto-slab">
              {player.email?.split('@')[0] || 'Player'}
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="font-bebas text-xl text-burnt-orange">
              {player.all_time_points}
            </div>
            <div className="text-xs text-ink-black/60">POINTS</div>
          </div>
          
          <div className="text-right hidden md:block">
            <div className="font-bebas">
              {player.correct_predictions || 0}/{player.total_predictions || 0}
            </div>
            <div className="text-xs text-ink-black/60">RECORD</div>
          </div>
          
          <div className="text-right hidden lg:block">
            <div className="font-bebas">
              {player.win_rate || 0}%
            </div>
            <div className="text-xs text-ink-black/60">ACCURACY</div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-vintage-cream flex items-center justify-center">
        <div className="text-center">
          <div className="scoreboard-panel inline-block px-8 py-6">
            <div className="font-bebas text-2xl animate-pulse">LOADING STANDINGS...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-vintage-cream flex items-center justify-center">
        <div className="text-center">
          <div className="scoreboard-panel inline-block px-8 py-6">
            <div className="font-bebas text-xl text-scoreboard-red mb-2">ERROR</div>
            <div className="text-sm text-vintage-cream/80">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  const topPlayers = leaderboard.slice(0, 3)
  const remainingPlayers = leaderboard.slice(3)

  return (
    <div className="min-h-screen bg-vintage-cream">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="scoreboard-text text-ink-black mb-2">THE LEAGUE</h1>
              <div className="font-roboto-slab text-lg text-ink-black/60">
                SEASON STANDINGS • GLOBAL RANKINGS • PLAYER STATS
              </div>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveView('overall')}
                className={`px-4 py-2 font-bebas uppercase tracking-wider border-2 ${
                  activeView === 'overall' 
                    ? 'border-ink-black bg-burnt-orange text-vintage-cream' 
                    : 'border-ink-black/30 text-ink-black hover:bg-ink-black/5'
                }`}
              >
                OVERALL
              </button>
              <button
                onClick={() => setActiveView('weekly')}
                className={`px-4 py-2 font-bebas uppercase tracking-wider border-2 ${
                  activeView === 'weekly' 
                    ? 'border-ink-black bg-burnt-orange text-vintage-cream' 
                    : 'border-ink-black/30 text-ink-black hover:bg-ink-black/5'
                }`}
              >
                WEEKLY
              </button>
              <button
                onClick={() => setActiveView('streaks')}
                className={`px-4 py-2 font-bebas uppercase tracking-wider border-2 ${
                  activeView === 'streaks' 
                    ? 'border-ink-black bg-burnt-orange text-vintage-cream' 
                    : 'border-ink-black/30 text-ink-black hover:bg-ink-black/5'
                }`}
              >
                STREAKS
              </button>
            </div>
          </div>
        </div>

        {/* Current User Card */}
        {currentUserRank && currentUserData && (
          <div className="card-vintage mb-8 bg-gradient-to-r from-forest-green/10 to-vintage-navy/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="font-bebas text-3xl text-burnt-orange">
                  #{currentUserRank}
                </div>
                <div>
                  <div className="font-bebas text-xl">{currentUserData.username}</div>
                  <div className="text-sm text-ink-black/60">
                    Your position in the league
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="font-bebas text-2xl text-burnt-orange">
                    {currentUserData.all_time_points}
                  </div>
                  <div className="text-xs text-ink-black/60">POINTS</div>
                </div>
                
                <div className="text-right hidden md:block">
                  <div className="font-bebas text-xl">
                    {Math.round((currentUserData.correct_predictions / Math.max(currentUserData.total_predictions, 1)) * 100)}%
                  </div>
                  <div className="text-xs text-ink-black/60">ACCURACY</div>
                </div>
                
                <div className="text-right hidden lg:block">
                  <div className="font-bebas text-xl">
                    {currentUserData.current_streak || 0}
                  </div>
                  <div className="text-xs text-ink-black/60">STREAK</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Podium */}
        {topPlayers.length > 0 && <Podium topPlayers={topPlayers} />}

        {/* Standings Table */}
        <div className="card-vintage">
          <div className="flex items-center justify-between mb-6">
            <div className="font-bebas text-2xl tracking-wider">
              {activeView === 'overall' && 'OVERALL STANDINGS'}
              {activeView === 'weekly' && 'WEEKLY RANKINGS'}
              {activeView === 'streaks' && 'ACTIVE STREAKS'}
            </div>
            <div className="text-sm text-ink-black/60 font-roboto-slab">
              {leaderboard.length} PLAYERS
            </div>
          </div>
          
          {/* Table Header */}
          <div className="flex items-center justify-between p-4 border-b-2 border-ink-black bg-ink-black/5">
            <div className="font-bebas uppercase tracking-wider">PLAYER</div>
            <div className="flex items-center gap-6">
              <div className="font-bebas uppercase tracking-wider">POINTS</div>
              <div className="font-bebas uppercase tracking-wider hidden md:block">RECORD</div>
              <div className="font-bebas uppercase tracking-wider hidden lg:block">ACCURACY</div>
            </div>
          </div>
          
          {/* Table Body */}
          <div className="max-h-[500px] overflow-y-auto">
            {remainingPlayers.map((player, index) => (
              <LeaderboardRow
                key={player.id}
                player={player}
                rank={index + 4}
                isCurrentUser={player.id === currentUserData?.id}
              />
            ))}
            
            {remainingPlayers.length === 0 && (
              <div className="text-center py-12">
                <div className="font-bebas text-xl mb-2">NO ADDITIONAL PLAYERS</div>
                <div className="text-ink-black/60 font-roboto-slab">
                  More players will appear as they join the league
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* League Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="card-vintage text-center">
            <div className="font-bebas text-3xl text-burnt-orange mb-2">
              {leaderboard.reduce((sum, player) => sum + (player.all_time_points || 0), 0)}
            </div>
            <div className="text-sm text-ink-black/60">TOTAL LEAGUE POINTS</div>
          </div>
          
          <div className="card-vintage text-center">
            <div className="font-bebas text-3xl text-forest-green mb-2">
              {leaderboard.reduce((sum, player) => sum + (player.correct_predictions || 0), 0)}
            </div>
            <div className="text-sm text-ink-black/60">TOTAL CORRECT PICKS</div>
          </div>
          
          <div className="card-vintage text-center">
            <div className="font-bebas text-3xl text-vintage-navy mb-2">
              {Math.round(leaderboard.reduce((sum, player) => sum + (player.win_rate || 0), 0) / Math.max(leaderboard.length, 1))}%
            </div>
            <div className="text-sm text-ink-black/60">AVERAGE ACCURACY</div>
          </div>
        </div>
      </main>
      
      {/* Vintage Footer */}
      <footer className="mt-12 py-6 border-t-2 border-ink-black/20 bg-vintage-navy/5">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="font-bebas text-lg tracking-wider mb-2">
            BASKETDUBS LEAGUE STANDINGS
          </div>
          <div className="text-sm text-ink-black/60 font-roboto-slab">
            Compete for the top spot, track your rank, build your legacy
          </div>
        </div>
      </footer>
    </div>
  )
}