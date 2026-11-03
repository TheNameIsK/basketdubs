/**
 * The Locker Room - Shop Page
 * VINTAGE REDESIGN: Trading Card Style Shop
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
  const [activeCategory, setActiveCategory] = useState('all')

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

  const categoryTitles = {
    head: 'HEAD GEAR',
    body: 'JERSEYS',
    shoes: 'SNEAKERS',
    background: 'COURT BACKGROUNDS'
  }

  const categoryColors = {
    head: 'bg-burnt-orange',
    body: 'bg-forest-green',
    shoes: 'bg-vintage-navy',
    background: 'bg-scoreboard-red'
  }

  // Vintage Item Card Component
  const ItemCard = ({ item, category, owned, canAfford, isPurchasing }) => {
    return (
      <div className={`trading-card ${owned ? 'ring-2 ring-burnt-orange' : ''}`}>
        {/* Item Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={`${categoryColors[category]} text-vintage-cream px-3 py-1 font-bebas uppercase text-sm`}>
            {category}
          </div>
          {owned && (
            <div className="vintage-stamp text-xs bg-forest-green">OWNED</div>
          )}
        </div>
        
        {/* Item Preview */}
        <div className="bg-vintage-cream/50 border-2 border-ink-black/30 h-48 flex items-center justify-center mb-4">
          <div className="text-5xl opacity-60">
            {category === 'head' && '🎩'}
            {category === 'body' && '👕'}
            {category === 'shoes' && '👟'}
            {category === 'background' && '🖼️'}
          </div>
        </div>
        
        {/* Item Details */}
        <div className="mb-4">
          <div className="font-bebas text-xl mb-2">{item.name}</div>
          <div className="text-sm text-ink-black/60 font-roboto-slab">
            Vintage collectible item for your avatar
          </div>
        </div>
        
        {/* Price & Action */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-ink-black/40 font-roboto-slab">PRICE</div>
            <div className="font-bebas text-2xl text-burnt-orange">{item.cost} PTS</div>
          </div>
          
          {owned ? (
            <div className="font-bebas text-sm text-forest-green">IN COLLECTION</div>
          ) : (
            <button
              onClick={() => handlePurchase(item.id, item.cost)}
              disabled={!canAfford || isPurchasing}
              className={`btn-vintage px-4 py-2 text-sm ${!canAfford ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isPurchasing ? 'PURCHASING...' : 'ADD TO COLLECTION'}
            </button>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-vintage-cream flex items-center justify-center">
        <div className="text-center">
          <div className="scoreboard-panel inline-block px-8 py-6">
            <div className="font-bebas text-2xl animate-pulse">LOADING LOCKER ROOM...</div>
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="scoreboard-text text-ink-black mb-2">THE LOCKER ROOM</h1>
              <div className="font-roboto-slab text-lg text-ink-black/60">
                VINTAGE GEAR • COLLECTIBLE ITEMS • CUSTOMIZATION
              </div>
            </div>
            <div className="scoreboard-panel text-center px-6 py-4">
              <div className="text-sm text-vintage-cream/80 mb-1">YOUR BALANCE</div>
              <div className="font-bebas text-3xl text-vintage-cream">{userPoints}</div>
              <div className="text-xs text-vintage-cream/60 mt-1">POINTS AVAILABLE</div>
            </div>
          </div>
          
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 font-bebas uppercase tracking-wider border-2 ${
                activeCategory === 'all' 
                  ? 'border-ink-black bg-burnt-orange text-vintage-cream' 
                  : 'border-ink-black/30 text-ink-black hover:bg-ink-black/5'
              }`}
            >
              ALL GEAR
            </button>
            {Object.keys(categoryTitles).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 font-bebas uppercase tracking-wider border-2 ${
                  activeCategory === cat 
                    ? 'border-ink-black bg-burnt-orange text-vintage-cream' 
                    : 'border-ink-black/30 text-ink-black hover:bg-ink-black/5'
                }`}
              >
                {categoryTitles[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Shop Items Grid */}
        {Object.keys(items).length === 0 ? (
          <div className="card-vintage text-center py-12">
            <div className="font-bebas text-2xl mb-2">NO GEAR AVAILABLE</div>
            <div className="text-ink-black/60 font-roboto-slab">
              Check back soon for vintage collectibles
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.entries(items)
              .filter(([category]) => activeCategory === 'all' || activeCategory === category)
              .flatMap(([category, categoryItems]) => 
                categoryItems.map((item) => {
                  const owned = isOwned(item.id)
                  const canAfford = userPoints >= item.cost
                  const isPurchasing = purchasing === item.id

                  return (
                    <ItemCard
                      key={item.id}
                      item={item}
                      category={category}
                      owned={owned}
                      canAfford={canAfford}
                      isPurchasing={isPurchasing}
                    />
                  )
                })
              )
            }
          </div>
        )}
        
        {/* Collection Stats */}
        <div className="card-vintage mt-8">
          <div className="font-bebas text-xl tracking-wider mb-4">YOUR COLLECTION</div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(items).map(([category, categoryItems]) => {
              const ownedCount = categoryItems.filter(item => isOwned(item.id)).length
              const totalCount = categoryItems.length
              
              return (
                <div key={category} className="text-center p-4 border-2 border-ink-black/20">
                  <div className="text-3xl font-bebas text-burnt-orange">
                    {ownedCount}/{totalCount}
                  </div>
                  <div className="text-xs text-ink-black/60 mt-1 uppercase">
                    {categoryTitles[category]}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
      
      {/* Vintage Footer */}
      <footer className="mt-12 py-6 border-t-2 border-ink-black/20 bg-vintage-navy/5">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="font-bebas text-lg tracking-wider mb-2">
            BASKETDUBS LOCKER ROOM
          </div>
          <div className="text-sm text-ink-black/60 font-roboto-slab">
            Collect vintage gear, customize your player, build your legacy
          </div>
        </div>
      </footer>
    </div>
  )
}