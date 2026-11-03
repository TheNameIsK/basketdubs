/**
 * The Court - Main predictions and scores page
 * VINTAGE REDESIGN: Retro Sports / Y2K / Vintage Athletic
 */
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { supabase } from '../services/supabase'
import Navigation from '../components/common/Navigation'

// Helper functions
const parseGameDateTime = (gameDateString) => {
  if (!gameDateString) return new Date()
  return new Date(gameDateString)
}

const isGameUpcoming = (game) => {
  if (game.status !== 'Scheduled') return false
  
  const gameTime = parseGameDateTime(game.date)
  const now = new Date()
  
  if (gameTime > now) return true
  
  const hours = gameTime.getHours()
  const minutes = gameTime.getMinutes()
  const seconds = gameTime.getSeconds()
  
  if (hours === 0 && minutes === 0 && seconds === 0) {
    const gameDate = new Date(gameTime.getFullYear(), gameTime.getMonth(), gameTime.getDate())
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return gameDate >= today
  }
  
  return false
}

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
  
  upcoming.sort((a, b) => parseGameDateTime(a.date) - parseGameDateTime(b.date))
  recent.sort((a, b) => parseGameDateTime(b.date) - parseGameDateTime(a.date))
  
  return { upcoming, recent }
}

const formatDateHeader = (date) => {
  return date.toLocaleDateString(undefined, { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

const formatTimeOnly = (date) => {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

// Vintage UI Components
const ScoreboardHeader = ({ date }) => {
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()
  
  return (
    <div className="scoreboard-panel mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-4xl tracking-widest">TONIGHT ON THE HARDWOOD</div>
          <div className="h-8 w-0.5 bg-vintage-cream/30" />
          <div className="text-lg text-vintage-cream/80">
            {isToday ? 'TODAY' : formatDateHeader(date).toUpperCase()}
          </div>
        </div>
        <div className="text-sm text-vintage-cream/60 font-roboto-slab">
          {date.getFullYear()} SEASON
        </div>
      </div>
    </div>
  )
}

const GameScoreboard = ({ game, onPredict, userPrediction }) => {
  const gameTime = parseGameDateTime(game.date)
  const isUpcoming = isGameUpcoming(game)
  const isLive = game.status === 'In Progress'
  const isFinal = game.status === 'Final'
  
  const userPredictedHome = userPrediction?.predicted_team_id === game.home_team.id
  const userPredictedVisitor = userPrediction?.predicted_team_id === game.visitor_team.id
  
  return (
    <div className="card-vintage mb-4 hover:shadow-hard-lg transition-all duration-200">
      {/* Game Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-ink-black/20">
        <div className="flex items-center gap-3">
          <div className="font-bebas text-2xl tracking-wider">MATCHUP</div>
          <div className="text-sm text-ink-black/60 font-roboto-slab">
            {formatTimeOnly(gameTime)} ET
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isUpcoming && (
            <span className="vintage-stamp text-xs">UPCOMING</span>
          )}
          {isLive && (
            <span className="vintage-stamp text-xs bg-scoreboard-red animate-pulse-hard">LIVE</span>
          )}
          {isFinal && (
            <span className="vintage-stamp text-xs bg-forest-green">FINAL</span>
          )}
        </div>
      </div>
      
      {/* Teams */}
      <div className="flex items-center justify-between mb-4">
        {/* Home Team */}
        <div className={`flex-1 text-center p-4 border-2 ${userPredictedHome ? 'border-burnt-orange bg-burnt-orange/10' : 'border-ink-black/30'}`}>
          <div className="font-bebas text-3xl mb-2">{game.home_team.abbreviation}</div>
          <div className="text-sm text-ink-black/60 font-roboto-slab mb-3">
            {game.home_team.city}
          </div>
          {isFinal && (
            <div className="text-4xl font-bebas">{game.home_score || '--'}</div>
          )}
          {isUpcoming && !userPrediction && (
            <button
              onClick={() => onPredict(game.id, game.home_team.id)}
              className="btn-vintage-outline text-sm px-4 py-2 mt-2"
            >
              PICK HOME
            </button>
          )}
          {userPredictedHome && (
            <div className="text-sm text-burnt-orange font-bebas mt-2">YOUR PICK</div>
          )}
        </div>
        
        {/* VS Divider */}
        <div className="mx-6">
          <div className="font-bebas text-4xl text-ink-black/40">VS</div>
          {isLive && (
            <div className="text-xs text-scoreboard-red font-bebas mt-1 animate-scoreboard-flash">
              LIVE
            </div>
          )}
        </div>
        
        {/* Visitor Team */}
        <div className={`flex-1 text-center p-4 border-2 ${userPredictedVisitor ? 'border-burnt-orange bg-burnt-orange/10' : 'border-ink-black/30'}`}>
          <div className="font-bebas text-3xl mb-2">{game.visitor_team.abbreviation}</div>
          <div className="text-sm text-ink-black/60 font-roboto-slab mb-3">
            {game.visitor_team.city}
          </div>
          {isFinal && (
            <div className="text-4xl font-bebas">{game.visitor_score || '--'}</div>
          )}
          {isUpcoming && !userPrediction && (
            <button
              onClick={() => onPredict(game.id, game.visitor_team.id)}
              className="btn-vintage-outline text-sm px-4 py-2 mt-2"
            >
              PICK AWAY
            </button>
          )}
          {userPredictedVisitor && (
            <div className="text-sm text-burnt-orange font-bebas mt-2">YOUR PICK</div>
          )}
        </div>
      </div>
      
      {/* Game Status */}
      <div className="text-center text-sm text-ink-black/60 font-roboto-slab border-t border-ink-black/20 pt-3">
        {game.period && game.time ? (
          <>
            {game.status === 'In Progress' ? `Q${game.period} - ${game.time}` : game.status}
          </>
        ) : (
          game.status
        )}
      </div>
    </div>
  )
}

const UserStatsPanel = ({ userStats }) => {
  return (
    <div className="card-vintage mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="font-bebas text-2xl tracking-wider">YOUR SEASON</div>
        <div className="text-sm text-ink-black/60 font-roboto-slab">
          {new Date().getFullYear()} CAMPAIGN
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 border-2 border-ink-black/20">
          <div className="text-3xl font-bebas text-burnt-orange">
            {userStats?.totalPoints || 0}
          </div>
          <div className="text-xs text-ink-black/60 mt-1">TOTAL POINTS</div>
        </div>
        
        <div className="text-center p-3 border-2 border-ink-black/20">
          <div className="text-3xl font-bebas text-forest-green">
            {userStats?.correctPredictions || 0}
          </div>
          <div className="text-xs text-ink-black/60 mt-1">CORRECT PICKS</div>
        </div>
        
        <div className="text-center p-3 border-2 border-ink-black/20">
          <div className="text-3xl font-bebas text-vintage-navy">
            {userStats?.winRate ? `${userStats.winRate}%` : '0%'}
          </div>
          <div className="text-xs text-ink-black/60 mt-1">ACCURACY</div>
        </div>
        
        <div className="text-center p-3 border-2 border-ink-black/20">
          <div className="text-3xl font-bebas text-scoreboard-red">
            {userStats?.currentStreak || 0}
          </div>
          <div className="text-xs text-ink-black/60 mt-1">STREAK</div>
        </div>
      </div>
    </div>
  )
}

const LeaderboardPreview = ({ topPlayers, userRank }) => {
  return (
    <div className="card-vintage">
      <div className="flex items-center justify-between mb-4">
        <div className="font-bebas text-2xl tracking-wider">LEAGUE STANDINGS</div>
        <div className="text-sm text-ink-black/60 font-roboto-slab">
          TOP 3
        </div>
      </div>
      
      {/* Podium */}
      <div className="flex items-end justify-center gap-4 mb-6">
        {topPlayers.slice(0, 3).map((player, index) => (
          <div 
            key={player.id} 
            className={`text-center ${index === 1 ? 'order-first' : ''}`}
          >
            <div className={`
              flex items-center justify-center mb-2
              ${index === 0 ? 'h-20 bg-burnt-orange' : 
                index === 1 ? 'h-24 bg-vintage-navy' : 
                'h-16 bg-forest-green'}
              border-2 border-ink-black relative
            `}>
              <div className="font-bebas text-3xl text-vintage-cream">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
              </div>
            </div>
            <div className="font-bebas text-lg">{player.username}</div>
            <div className="text-sm text-ink-black/60">{player.points} PTS</div>
          </div>
        ))}
      </div>
      
      {/* User Rank */}
      {userRank && userRank.rank > 3 && (
        <div className="border-t border-ink-black/20 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="font-bebas text-xl">#{userRank.rank}</div>
              <div className="font-roboto-slab">{userRank.username}</div>
            </div>
            <div className="font-bebas text-lg text-burnt-orange">
              {userRank.points} PTS
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Main Component
export default function Court() {
  const { user, session } = useAuth()
  const navigate = useNavigate()
  
  const [games, setGames] = useState([])
  const [predictions, setPredictions] = useState([])
  const [userStats, setUserStats] = useState(null)
  const [topPlayers, setTopPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')
  
  const today = new Date()
  
  const { upcoming, recent } = useMemo(() => categorizeGames(games), [games])
  
  const userPredictionsMap = useMemo(() => {
    const map = {}
    predictions.forEach(pred => {
      map[pred.game_id] = pred
    })
    return map
  }, [predictions])
  
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.access_token) return
      
      try {
        setLoading(true)
        
        // Fetch games
        const gamesResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/games`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` }
          }
        )
        setGames(gamesResponse.data.upcoming.concat(gamesResponse.data.recent))
        
        // Fetch user predictions
        const predictionsResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/predictions`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` }
          }
        )
        setPredictions(predictionsResponse.data.predictions || [])
        
        // Fetch user stats
        const profileResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/profile`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` }
          }
        )
        setUserStats(profileResponse.data)
        
        // Fetch leaderboard preview
        const leaderboardResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/leaderboard?limit=3`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` }
          }
        )
        setTopPlayers(leaderboardResponse.data.top_players || [])
        
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [session])
  
  const handlePredict = async (gameId, teamId) => {
    if (!session?.access_token) return
    
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/predictions`,
        {
          game_id: gameId,
          predicted_team_id: teamId
        },
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      )
      
      // Update predictions
      const newPrediction = response.data
      setPredictions(prev => [...prev.filter(p => p.game_id !== gameId), newPrediction])
      
    } catch (error) {
      console.error('Error making prediction:', error)
      alert(error.response?.data?.error || 'Failed to make prediction')
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-vintage-cream flex items-center justify-center">
        <div className="text-center">
          <div className="scoreboard-panel inline-block px-8 py-6">
            <div className="font-bebas text-2xl animate-pulse">LOADING SCOREBOARD...</div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-vintage-cream">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="scoreboard-text text-ink-black mb-2">BASKETDUBS</h1>
              <div className="font-roboto-slab text-lg text-ink-black/60">
                VINTAGE EDITION • {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
              </div>
            </div>
            <div className="text-right">
              <div className="font-bebas text-2xl text-ink-black">
                {today.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}
              </div>
              <div className="font-roboto-slab text-ink-black/60">
                {today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Games */}
          <div className="lg:col-span-2">
            {/* Stats Panel */}
            <UserStatsPanel userStats={userStats} />
            
            {/* Games Tabs */}
            <div className="flex border-b-2 border-ink-black/30 mb-6">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-6 py-3 font-bebas text-lg uppercase tracking-wider border-b-2 transition-all duration-200 ${
                  activeTab === 'upcoming' 
                    ? 'border-burnt-orange text-ink-black' 
                    : 'border-transparent text-ink-black/60 hover:text-ink-black'
                }`}
              >
                UPCOMING ({upcoming.length})
              </button>
              <button
                onClick={() => setActiveTab('recent')}
                className={`px-6 py-3 font-bebas text-lg uppercase tracking-wider border-b-2 transition-all duration-200 ${
                  activeTab === 'recent' 
                    ? 'border-burnt-orange text-ink-black' 
                    : 'border-transparent text-ink-black/60 hover:text-ink-black'
                }`}
              >
                RESULTS ({recent.length})
              </button>
            </div>
            
            {/* Games List */}
            <div>
              {(activeTab === 'upcoming' ? upcoming : recent).map(game => (
                <GameScoreboard
                  key={game.id}
                  game={game}
                  onPredict={handlePredict}
                  userPrediction={userPredictionsMap[game.id]}
                />
              ))}
              
              {(activeTab === 'upcoming' ? upcoming : recent).length === 0 && (
                <div className="card-vintage text-center py-12">
                  <div className="font-bebas text-2xl mb-2">
                    NO {activeTab === 'upcoming' ? 'UPCOMING' : 'RECENT'} GAMES
                  </div>
                  <div className="text-ink-black/60 font-roboto-slab">
                    Check back later for more matchups
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column: Sidebar */}
          <div>
            {/* Leaderboard Preview */}
            <LeaderboardPreview 
              topPlayers={topPlayers} 
              userRank={userStats}
            />
            
            {/* Quick Stats */}
            <div className="card-vintage mt-6">
              <div className="font-bebas text-xl tracking-wider mb-4">
                TODAY'S ACTION
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-ink-black/10">
                  <div className="text-sm text-ink-black/60">Games Today</div>
                  <div className="font-bebas">{upcoming.filter(g => {
                    const gameDate = parseGameDateTime(g.date)
                    return gameDate.toDateString() === today.toDateString()
                  }).length}</div>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-ink-black/10">
                  <div className="text-sm text-ink-black/60">Your Picks Today</div>
                  <div className="font-bebas">{predictions.filter(p => {
                    const predDate = new Date(p.created_at)
                    return predDate.toDateString() === today.toDateString()
                  }).length}</div>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <div className="text-sm text-ink-black/60">Season Games</div>
                  <div className="font-bebas">{games.length}</div>
                </div>
              </div>
              
              {/* LeBot CTA */}
              <div className="mt-6 pt-4 border-t border-ink-black/20">
                <div className="text-center">
                  <div className="text-sm text-ink-black/60 mb-2">NEED ADVICE?</div>
                  <button
                    onClick={() => {/* Will open LeBot modal */}}
                    className="btn-vintage-secondary w-full"
                  >
                    ASK LEBOT
                  </button>
                </div>
              </div>
            </div>
            
            {/* Vintage Tip */}
            <div className="card-vintage mt-6 bg-forest-green/5">
              <div className="text-xs text-ink-black/40 font-roboto-slab uppercase tracking-wider mb-2">
                PRO TIP
              </div>
              <div className="font-roboto-slab text-sm">
                Correct picks earn +2 points. Wrong picks lose -1 point. Play smart, build your streak.
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Vintage Footer */}
      <footer className="mt-12 py-6 border-t-2 border-ink-black/20 bg-vintage-navy/5">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="font-bebas text-lg tracking-wider mb-2">
            BASKETDUBS • THE HARDWOOD EDITION
          </div>
          <div className="text-sm text-ink-black/60 font-roboto-slab">
            Vintage NBA predictions since 2026 • Not affiliated with the NBA
          </div>
        </div>
      </footer>
    </div>
  )
}