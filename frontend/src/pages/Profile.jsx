/**
 * My Player - Profile & Avatar Editor
 * VINTAGE REDESIGN: Trading Card Style Profile
 */
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navigation from '../components/common/Navigation'

export default function Profile() {
  const { user, session, signOut } = useAuth()
  const navigate = useNavigate()
  const [userProfile, setUserProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [inventory, setInventory] = useState([])
  const [avatarConfig, setAvatarConfig] = useState({})
  const [username, setUsername] = useState('')
  const [editingUsername, setEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('stats')

  useEffect(() => {
    fetchProfile()
    fetchInventory()
    fetchStats()
  }, [])

  const fetchProfile = async () => {
    try {
      const token = session?.access_token
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/results`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setUserProfile(response.data.points)
      
      // Get avatar config and username from Supabase
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/profile/avatar`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setAvatarConfig(data.avatar_config || {})
      setUsername(data.username || 'Player')
      setNewUsername(data.username || '')
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = session?.access_token
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/profile/stats`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setStats(response.data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const handleUsernameUpdate = async () => {
    setUsernameError('')
    
    if (newUsername.length < 3) {
      setUsernameError('Username must be at least 3 characters')
      return
    }

    try {
      setSaving(true)
      const token = session?.access_token
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/profile/username`,
        { username: newUsername },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setUsername(newUsername)
      setEditingUsername(false)
    } catch (err) {
      setUsernameError(err.response?.data?.error || 'Failed to update username')
    } finally {
      setSaving(false)
    }
  }

  const fetchInventory = async () => {
    try {
      const token = session?.access_token
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/shop/inventory`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setInventory(response.data)
    } catch (err) {
      console.error('Failed to fetch inventory:', err)
    }
  }

  // Trading Card Component
  const TradingCardProfile = () => {
    const winRate = stats?.correct_predictions && stats?.total_predictions 
      ? Math.round((stats.correct_predictions / stats.total_predictions) * 100)
      : 0
    
    return (
      <div className="trading-card relative overflow-hidden">
        {/* Card Header */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-burnt-orange to-scoreboard-red p-3">
          <div className="font-bebas text-2xl text-vintage-cream tracking-widest">
            PLAYER PROFILE CARD
          </div>
        </div>
        
        {/* Player Info */}
        <div className="pt-16 pb-6">
          {/* Avatar Display */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              {/* Avatar Layers */}
              <div className="w-48 h-48 bg-gradient-to-br from-vintage-cream to-burnt-orange/30 border-3 border-ink-black flex items-center justify-center">
                <div className="text-6xl">🏀</div>
              </div>
              {/* Rookie Season Badge */}
              {stats?.join_date && (
                <div className="absolute -top-3 -right-3 vintage-stamp bg-vintage-navy">
                  ROOKIE {new Date(stats.join_date).getFullYear()}
                </div>
              )}
            </div>
          </div>
          
          {/* Player Name */}
          <div className="text-center mb-6">
            <div className="font-bebas text-4xl mb-1">{username}</div>
            <div className="text-sm text-ink-black/60 font-roboto-slab">
              #{stats?.rank || 'N/A'} IN THE LEAGUE
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 border-2 border-ink-black/20">
              <div className="font-bebas text-3xl text-burnt-orange">
                {stats?.total_predictions || 0}
              </div>
              <div className="text-xs text-ink-black/60 mt-1">CAREER PICKS</div>
            </div>
            
            <div className="text-center p-3 border-2 border-ink-black/20">
              <div className="font-bebas text-3xl text-forest-green">
                {stats?.correct_predictions || 0}
              </div>
              <div className="text-xs text-ink-black/60 mt-1">WINS</div>
            </div>
            
            <div className="text-center p-3 border-2 border-ink-black/20">
              <div className="font-bebas text-3xl text-vintage-navy">
                {winRate}%
              </div>
              <div className="text-xs text-ink-black/60 mt-1">ACCURACY</div>
            </div>
            
            <div className="text-center p-3 border-2 border-ink-black/20">
              <div className="font-bebas text-3xl text-scoreboard-red">
                {stats?.current_streak || 0}
              </div>
              <div className="text-xs text-ink-black/60 mt-1">STREAK</div>
            </div>
          </div>
          
          {/* Season Record */}
          <div className="mb-6">
            <div className="text-center mb-2">
              <div className="font-bebas text-lg">SEASON RECORD</div>
              <div className="text-sm text-ink-black/60">
                {new Date().getFullYear()} CAMPAIGN
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <div className="text-center">
                <div className="font-bebas text-3xl text-forest-green">{stats?.wins || 0}</div>
                <div className="text-xs text-ink-black/60">WINS</div>
              </div>
              <div className="text-center">
                <div className="font-bebas text-3xl text-scoreboard-red">{stats?.losses || 0}</div>
                <div className="text-xs text-ink-black/60">LOSSES</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Card Footer */}
        <div className="border-t-2 border-ink-black/20 pt-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-ink-black/40">POINTS</div>
              <div className="font-bebas text-xl text-burnt-orange">
                {userProfile?.all_time || 0} TOTAL
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-ink-black/40">SPENDABLE</div>
              <div className="font-bebas text-xl text-forest-green">
                {userProfile?.spendable || 0} PTS
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Collection Component
  const CollectionPanel = () => {
    const categoryCounts = {
      head: inventory.filter(item => item.category === 'head').length,
      body: inventory.filter(item => item.category === 'body').length,
      shoes: inventory.filter(item => item.category === 'shoes').length,
      background: inventory.filter(item => item.category === 'background').length,
    }
    
    return (
      <div className="card-vintage">
        <div className="font-bebas text-2xl tracking-wider mb-4">YOUR COLLECTION</div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(categoryCounts).map(([category, count]) => (
            <div key={category} className="text-center p-4 border-2 border-ink-black/20">
              <div className="text-3xl font-bebas text-burnt-orange">{count}</div>
              <div className="text-xs text-ink-black/60 mt-1 uppercase">
                {category === 'head' && 'HEAD GEAR'}
                {category === 'body' && 'JERSEYS'}
                {category === 'shoes' && 'SNEAKERS'}
                {category === 'background' && 'BACKGROUNDS'}
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-sm text-ink-black/60 font-roboto-slab">
          Browse your collected items in the Locker Room
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-vintage-cream flex items-center justify-center">
        <div className="text-center">
          <div className="scoreboard-panel inline-block px-8 py-6">
            <div className="font-bebas text-2xl animate-pulse">LOADING PROFILE...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-vintage-cream">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="scoreboard-text text-ink-black mb-2">MY PLAYER</h1>
              <div className="font-roboto-slab text-lg text-ink-black/60">
                TRADING CARD PROFILE • SEASON STATS • COLLECTION
              </div>
            </div>
            
            {/* Username Editor */}
            <div className="flex items-center gap-3">
              {editingUsername ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="border-2 border-ink-black px-3 py-2 font-bebas text-lg bg-vintage-cream"
                    placeholder="Enter username"
                    maxLength={20}
                  />
                  <button
                    onClick={handleUsernameUpdate}
                    disabled={saving}
                    className="btn-vintage px-4 py-2 text-sm"
                  >
                    {saving ? 'SAVING...' : 'SAVE'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingUsername(false)
                      setNewUsername(username)
                      setUsernameError('')
                    }}
                    className="btn-vintage-outline px-4 py-2 text-sm"
                  >
                    CANCEL
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="scoreboard-panel text-center px-4 py-2">
                    <div className="font-bebas text-xl">{username}</div>
                  </div>
                  <button
                    onClick={() => setEditingUsername(true)}
                    className="btn-vintage-outline px-4 py-2 text-sm"
                  >
                    EDIT NAME
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {usernameError && (
            <div className="mb-4 p-3 border-2 border-scoreboard-red bg-scoreboard-red/10">
              <div className="text-scoreboard-red text-sm">{usernameError}</div>
            </div>
          )}
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Trading Card */}
          <div className="lg:col-span-2">
            <TradingCardProfile />
            
            {/* Tabs */}
            <div className="flex border-b-2 border-ink-black/30 mt-8 mb-6">
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-6 py-3 font-bebas text-lg uppercase tracking-wider border-b-2 transition-all duration-200 ${
                  activeTab === 'stats' 
                    ? 'border-burnt-orange text-ink-black' 
                    : 'border-transparent text-ink-black/60 hover:text-ink-black'
                }`}
              >
                SEASON STATS
              </button>
              <button
                onClick={() => setActiveTab('collection')}
                className={`px-6 py-3 font-bebas text-lg uppercase tracking-wider border-b-2 transition-all duration-200 ${
                  activeTab === 'collection' 
                    ? 'border-burnt-orange text-ink-black' 
                    : 'border-transparent text-ink-black/60 hover:text-ink-black'
                }`}
              >
                COLLECTION
              </button>
              <button
                onClick={() => setActiveTab('achievements')}
                className={`px-6 py-3 font-bebas text-lg uppercase tracking-wider border-b-2 transition-all duration-200 ${
                  activeTab === 'achievements' 
                    ? 'border-burnt-orange text-ink-black' 
                    : 'border-transparent text-ink-black/60 hover:text-ink-black'
                }`}
              >
                ACHIEVEMENTS
              </button>
            </div>
            
            {/* Tab Content */}
            <div className="card-vintage">
              {activeTab === 'stats' && (
                <div>
                  <div className="font-bebas text-xl tracking-wider mb-4">DETAILED STATISTICS</div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-ink-black/10">
                      <div className="text-ink-black/60">Total Predictions</div>
                      <div className="font-bebas text-lg">{stats?.total_predictions || 0}</div>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b border-ink-black/10">
                      <div className="text-ink-black/60">Correct Picks</div>
                      <div className="font-bebas text-lg text-forest-green">{stats?.correct_predictions || 0}</div>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b border-ink-black/10">
                      <div className="text-ink-black/60">Incorrect Picks</div>
                      <div className="font-bebas text-lg text-scoreboard-red">{stats?.incorrect_predictions || 0}</div>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b border-ink-black/10">
                      <div className="text-ink-black/60">Win Rate</div>
                      <div className="font-bebas text-lg">
                        {stats?.correct_predictions && stats?.total_predictions 
                          ? Math.round((stats.correct_predictions / stats.total_predictions) * 100)
                          : 0}%
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center py-3">
                      <div className="text-ink-black/60">Longest Streak</div>
                      <div className="font-bebas text-lg">{stats?.longest_streak || 0}</div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'collection' && (
                <CollectionPanel />
              )}
              
              {activeTab === 'achievements' && (
                <div>
                  <div className="font-bebas text-xl tracking-wider mb-4">ACHIEVEMENTS</div>
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🏆</div>
                    <div className="text-ink-black/60 font-roboto-slab">
                      Achievements coming soon!
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column: Actions & Info */}
          <div>
            {/* Quick Actions */}
            <div className="card-vintage mb-6">
              <div className="font-bebas text-xl tracking-wider mb-4">QUICK ACTIONS</div>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/shop')}
                  className="btn-vintage-secondary w-full"
                >
                  VISIT LOCKER ROOM
                </button>
                
                <button
                  onClick={() => navigate('/leaderboard')}
                  className="btn-vintage-outline w-full"
                >
                  VIEW LEADERBOARD
                </button>
                
                <button
                  onClick={() => navigate('/court')}
                  className="btn-vintage-outline w-full"
                >
                  BACK TO COURT
                </button>
              </div>
            </div>
            
            {/* Account Info */}
            <div className="card-vintage mb-6">
              <div className="font-bebas text-xl tracking-wider mb-4">ACCOUNT INFO</div>
              
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-ink-black/40 mb-1">EMAIL</div>
                  <div className="font-roboto-slab text-sm truncate">{user?.email}</div>
                </div>
                
                <div>
                  <div className="text-xs text-ink-black/40 mb-1">MEMBER SINCE</div>
                  <div className="font-roboto-slab text-sm">
                    {stats?.join_date ? new Date(stats.join_date).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-ink-black/40 mb-1">PLAYER ID</div>
                  <div className="font-roboto-slab text-sm font-mono truncate">
                    {user?.id?.slice(0, 8)}...
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sign Out */}
            <div className="card-vintage bg-scoreboard-red/5 border-scoreboard-red/30">
              <div className="font-bebas text-xl tracking-wider mb-4">SESSION</div>
              
              <button
                onClick={signOut}
                className="btn-vintage w-full bg-scoreboard-red hover:bg-scoreboard-red/90"
              >
                SIGN OUT
              </button>
              
              <div className="text-xs text-ink-black/40 mt-3 font-roboto-slab">
                Sessions automatically expire after 24 hours
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Vintage Footer */}
      <footer className="mt-12 py-6 border-t-2 border-ink-black/20 bg-vintage-navy/5">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="font-bebas text-lg tracking-wider mb-2">
            BASKETDUBS PLAYER PROFILE
          </div>
          <div className="text-sm text-ink-black/60 font-roboto-slab">
            Build your legacy, track your stats, customize your player
          </div>
        </div>
      </footer>
    </div>
  )
}