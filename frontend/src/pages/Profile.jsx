/**
 * My Player - Profile & Avatar Editor
 */
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navigation from '../components/common/Navigation'

export default function Profile() {
  const { user, session } = useAuth()
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

  const handleEquipItem = async (item) => {
    const newConfig = { ...avatarConfig, [item.category]: item.id }
    setAvatarConfig(newConfig)
    await saveAvatarConfig(newConfig)
  }

  const handleUnequipItem = async (category) => {
    const newConfig = { ...avatarConfig }
    delete newConfig[category]
    setAvatarConfig(newConfig)
    await saveAvatarConfig(newConfig)
  }

  const saveAvatarConfig = async (config) => {
    try {
      setSaving(true)
      const token = session?.access_token
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/profile/avatar`,
        { avatar_config: config },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
    } catch (err) {
      console.error('Failed to save avatar:', err)
      alert('Failed to save avatar configuration')
    } finally {
      setSaving(false)
    }
  }

  const getEquippedItem = (category) => {
    const itemId = avatarConfig[category]
    return inventory.find(item => item.id === itemId)
  }

  const getItemsByCategory = (category) => {
    return inventory.filter(item => item.category === category)
  }

  const getAssetUrl = (category, assetRef) => {
    return `/assets/items/${category}/${assetRef}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl">Loading profile...</div>
      </div>
    )
  }

  const equippedBackground = getEquippedItem('background')
  const equippedHead = getEquippedItem('head')
  const equippedBody = getEquippedItem('body')
  const equippedShoes = getEquippedItem('shoes')

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-orange-600">👤 My Player</h1>
              
              {/* Username Display/Edit */}
              <div className="mt-2 flex items-center gap-2">
                {editingUsername ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm md:text-base"
                      maxLength={20}
                      autoFocus
                    />
                    <button
                      onClick={handleUsernameUpdate}
                      disabled={saving}
                      className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingUsername(false)
                        setNewUsername(username)
                        setUsernameError('')
                      }}
                      className="bg-gray-500 text-white px-3 py-1 rounded-lg hover:bg-gray-600 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-lg md:text-xl font-semibold text-gray-700">{username}</span>
                    <button
                      onClick={() => setEditingUsername(true)}
                      className="text-orange-500 hover:text-orange-600 text-sm"
                    >
                      ✏️ Edit
                    </button>
                  </div>
                )}
              </div>
              {usernameError && (
                <p className="text-red-500 text-sm mt-1">{usernameError}</p>
              )}
            </div>
            <div className="relative">
              <Navigation currentPage="Profile" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Avatar Display */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Your Avatar</h2>
            
            {/* Avatar Container */}
            <div className="relative w-full aspect-square max-w-md mx-auto rounded-lg overflow-hidden border-4 border-orange-500">
              {/* Background Layer */}
              <img
                src={equippedBackground ? getAssetUrl('background', equippedBackground.asset_ref) : '/assets/backgrounds/default-bg.png'}
                alt="Background"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ zIndex: 1 }}
              />
              
              {/* Avatar Base Layer */}
              <img
                src="/assets/avatar/default-avatar.png"
                alt="Avatar"
                className="absolute inset-0 w-full h-full object-contain"
                style={{ zIndex: 2 }}
              />
              
              {/* Items Layer */}
              {equippedBody && (
                <img
                  src={getAssetUrl('body', equippedBody.asset_ref)}
                  alt={equippedBody.name}
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{ zIndex: 3 }}
                />
              )}
              {equippedHead && (
                <img
                  src={getAssetUrl('head', equippedHead.asset_ref)}
                  alt={equippedHead.name}
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{ zIndex: 4 }}
                />
              )}
              {equippedShoes && (
                <img
                  src={getAssetUrl('shoes', equippedShoes.asset_ref)}
                  alt={equippedShoes.name}
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{ zIndex: 3 }}
                />
              )}
            </div>

            {/* Stats */}
            <div className="mt-6 space-y-4">
              {/* Points */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-500">Balance</div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats?.spendable_points || 0} pts
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-500">All-Time</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {stats?.all_time_points || 0} pts
                  </div>
                </div>
              </div>

              {/* Prediction Stats */}
              {stats && (
                <div className="bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-700 mb-3">📊 Prediction Stats</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-500">Total Predictions</div>
                      <div className="text-xl font-bold text-gray-800">
                        {stats.total_predictions}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-500">Win Rate</div>
                      <div className="text-xl font-bold text-blue-600">
                        {stats.win_rate}%
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-500">Wins</div>
                      <div className="text-xl font-bold text-green-600">
                        {stats.wins}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-500">Losses</div>
                      <div className="text-xl font-bold text-red-600">
                        {stats.losses}
                      </div>
                    </div>
                  </div>
                  
                  {/* Current Streak */}
                  {stats.current_streak > 0 && (
                    <div className="mt-3 bg-white rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-500">Current Streak</div>
                      <div className={`text-xl font-bold ${
                        stats.streak_type === 'win' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stats.current_streak} {stats.streak_type === 'win' ? '🔥' : '❄️'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {stats.streak_type === 'win' ? 'winning' : 'losing'} streak
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {saving && (
              <div className="mt-4 text-center text-sm text-gray-500">
                Saving...
              </div>
            )}
          </div>

          {/* Right: Inventory & Editor */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Your Locker</h2>
            
            {inventory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Your locker is empty!</p>
                <button
                  onClick={() => navigate('/shop')}
                  className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600"
                >
                  Visit Shop
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Head Items */}
                {getItemsByCategory('head').length > 0 && (
                  <div>
                    <h3 className="font-bold mb-2">🎩 Head</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {getItemsByCategory('head').map(item => (
                        <button
                          key={item.id}
                          onClick={() => 
                            avatarConfig.head === item.id 
                              ? handleUnequipItem('head')
                              : handleEquipItem(item)
                          }
                          className={`p-2 rounded-lg border-2 transition-all ${
                            avatarConfig.head === item.id
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-orange-300'
                          }`}
                        >
                          <div className="aspect-square bg-gray-100 rounded flex items-center justify-center text-2xl">
                            🎩
                          </div>
                          <div className="text-xs mt-1 truncate">{item.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Body Items */}
                {getItemsByCategory('body').length > 0 && (
                  <div>
                    <h3 className="font-bold mb-2">👕 Body</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {getItemsByCategory('body').map(item => (
                        <button
                          key={item.id}
                          onClick={() => 
                            avatarConfig.body === item.id 
                              ? handleUnequipItem('body')
                              : handleEquipItem(item)
                          }
                          className={`p-2 rounded-lg border-2 transition-all ${
                            avatarConfig.body === item.id
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-orange-300'
                          }`}
                        >
                          <div className="aspect-square bg-gray-100 rounded flex items-center justify-center text-2xl">
                            👕
                          </div>
                          <div className="text-xs mt-1 truncate">{item.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shoes */}
                {getItemsByCategory('shoes').length > 0 && (
                  <div>
                    <h3 className="font-bold mb-2">👟 Shoes</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {getItemsByCategory('shoes').map(item => (
                        <button
                          key={item.id}
                          onClick={() => 
                            avatarConfig.shoes === item.id 
                              ? handleUnequipItem('shoes')
                              : handleEquipItem(item)
                          }
                          className={`p-2 rounded-lg border-2 transition-all ${
                            avatarConfig.shoes === item.id
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-orange-300'
                          }`}
                        >
                          <div className="aspect-square bg-gray-100 rounded flex items-center justify-center text-2xl">
                            👟
                          </div>
                          <div className="text-xs mt-1 truncate">{item.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Backgrounds */}
                {getItemsByCategory('background').length > 0 && (
                  <div>
                    <h3 className="font-bold mb-2">🖼️ Background</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {getItemsByCategory('background').map(item => (
                        <button
                          key={item.id}
                          onClick={() => 
                            avatarConfig.background === item.id 
                              ? handleUnequipItem('background')
                              : handleEquipItem(item)
                          }
                          className={`p-2 rounded-lg border-2 transition-all ${
                            avatarConfig.background === item.id
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-orange-300'
                          }`}
                        >
                          <div className="aspect-square bg-gray-100 rounded flex items-center justify-center text-2xl">
                            🖼️
                          </div>
                          <div className="text-xs mt-1 truncate">{item.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
