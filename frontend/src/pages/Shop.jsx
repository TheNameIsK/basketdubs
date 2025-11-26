/**
 * The Locker Room - Shop Page
 */
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navigation from '../components/common/Navigation'

export default function Shop() {
  const { user, session } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState({})
  const [inventory, setInventory] = useState([])
  const [userPoints, setUserPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(null)

  useEffect(() => {
    fetchShopItems()
    fetchInventory()
    fetchUserPoints()
  }, [])

  const fetchShopItems = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/shop/items`)
      setItems(response.data)
    } catch (err) {
      console.error('Failed to fetch shop items:', err)
    } finally {
      setLoading(false)
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

  const fetchUserPoints = async () => {
    try {
      const token = session?.access_token
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/results`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setUserPoints(response.data.points.spendable)
    } catch (err) {
      console.error('Failed to fetch points:', err)
    }
  }

  const handlePurchase = async (itemId, itemCost) => {
    if (userPoints < itemCost) {
      alert(`Not enough points! You need ${itemCost} but have ${userPoints}`)
      return
    }

    try {
      setPurchasing(itemId)
      const token = session?.access_token
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/shop/purchase`,
        { item_id: itemId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      alert(`Purchase successful! New balance: ${response.data.new_balance} pts`)
      
      // Refresh data
      await fetchInventory()
      await fetchUserPoints()
    } catch (err) {
      console.error('Purchase failed:', err)
      alert(err.response?.data?.error || 'Purchase failed')
    } finally {
      setPurchasing(null)
    }
  }

  const isOwned = (itemId) => {
    return inventory.some(item => item.id === itemId)
  }

  const categoryEmojis = {
    head: '🎩',
    body: '👕',
    shoes: '👟',
    background: '🖼️'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl">Loading shop...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-orange-600">🛍️ The Locker Room</h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">Customize your player</p>
            </div>
            <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4">
              <div className="text-left md:text-right md:border-r md:pr-4">
                <div className="text-xs md:text-sm text-gray-500">Your Balance</div>
                <div className="text-xl md:text-2xl font-bold text-green-600">{userPoints} pts</div>
              </div>
              <div className="relative">
                <Navigation currentPage="Shop" />
              </div>
            </div>
          </div>
        </div>

        {/* Shop Items by Category */}
        {Object.keys(items).length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No items available yet</p>
          </div>
        ) : (
          Object.entries(items).map(([category, categoryItems]) => (
            <div key={category} className="mb-6">
              <h2 className="text-2xl font-bold mb-4 capitalize">
                {categoryEmojis[category] || '📦'} {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryItems.map((item) => {
                  const owned = isOwned(item.id)
                  const canAfford = userPoints >= item.cost
                  const isPurchasing = purchasing === item.id

                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-lg shadow p-6 ${
                        owned ? 'border-2 border-green-500' : ''
                      }`}
                    >
                      {/* Item Preview */}
                      <div className="bg-gray-100 rounded-lg h-32 flex items-center justify-center mb-4">
                        <div className="text-4xl">{categoryEmojis[category] || '📦'}</div>
                      </div>

                      {/* Item Info */}
                      <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                      <div className="flex justify-between items-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {item.cost} pts
                        </div>
                        {owned ? (
                          <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                            ✓ Owned
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePurchase(item.id, item.cost)}
                            disabled={!canAfford || isPurchasing}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                              canAfford
                                ? 'bg-orange-500 text-white hover:bg-orange-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            } ${isPurchasing ? 'opacity-50' : ''}`}
                          >
                            {isPurchasing ? 'Buying...' : 'Buy'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
