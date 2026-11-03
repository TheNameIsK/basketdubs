import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function Navigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut, user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  const navItems = [
    { name: 'HOME', path: '/court', icon: 'H' },
    { name: 'COURT', path: '/court', icon: 'C' },
    { name: 'PICKS', path: '/court', icon: 'P' }, // Will link to predictions section
    { name: 'LEAGUE', path: '/leaderboard', icon: 'L' },
    { name: 'PROFILE', path: '/profile', icon: 'P' },
  ]

  const handleNavigation = (path) => {
    navigate(path)
    setIsMenuOpen(false)
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  // Vintage hamburger icon
  const HamburgerIcon = ({ isOpen }) => (
    <div className="relative w-6 h-5">
      <span className={`absolute left-0 w-6 h-0.5 bg-ink-black transition-all duration-200 ${isOpen ? 'rotate-45 top-2' : 'top-0'}`} />
      <span className={`absolute left-0 top-2 w-6 h-0.5 bg-ink-black transition-all duration-200 ${isOpen ? 'opacity-0' : 'opacity-100'}`} />
      <span className={`absolute left-0 w-6 h-0.5 bg-ink-black transition-all duration-200 ${isOpen ? '-rotate-45 top-2' : 'top-4'}`} />
    </div>
  )

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between bg-vintage-cream border-b-3 border-ink-black px-6 py-3">
          {/* Logo / Masthead */}
          <div className="flex items-center gap-3">
            <div className="scoreboard-panel px-4 py-2">
              <span className="text-2xl tracking-widest">BASKETDUBS</span>
              <div className="text-xs text-vintage-cream/80 mt-1">EST. 2026</div>
            </div>
            <div className="text-sm text-ink-black/60 font-roboto-slab italic">
              THE HOME OF YOUR NBA PREDICTIONS
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center gap-1">
            {navItems.map(item => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.path)}
                className={`
                  relative px-4 py-2 font-bebas uppercase tracking-wider text-lg
                  border-2 border-transparent transition-all duration-200
                  hover:border-ink-black hover:shadow-hard-sm
                  ${isActive(item.path) 
                    ? 'bg-burnt-orange text-vintage-cream border-ink-black shadow-hard-sm' 
                    : 'text-ink-black hover:bg-forest-green/10'
                  }
                `}
              >
                <span className="relative z-10">{item.name}</span>
                {isActive(item.path) && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-0.5 bg-ink-black" />
                )}
              </button>
            ))}
            
            {/* LeBot Button */}
            <button
              onClick={() => navigate('/court')} // Will open LeBot modal
              className="ml-4 px-4 py-2 font-bebas uppercase tracking-wider text-lg
                         bg-forest-green text-vintage-cream border-2 border-ink-black
                         shadow-hard-sm hover:shadow-hard transition-all duration-200"
            >
              LEBOT
            </button>
            
            {/* Logout Button */}
            <button
              onClick={signOut}
              className="ml-2 px-4 py-2 font-bebas uppercase tracking-wider text-lg
                         bg-scoreboard-red text-vintage-cream border-2 border-ink-black
                         shadow-hard-sm hover:shadow-hard transition-all duration-200"
            >
              EXIT
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden" ref={menuRef}>
        <div className="flex items-center justify-between bg-vintage-cream border-b-3 border-ink-black px-4 py-3">
          {/* Mobile Logo */}
          <div className="scoreboard-panel px-3 py-1">
            <span className="text-xl tracking-widest">BD</span>
          </div>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 border-2 border-ink-black bg-vintage-cream shadow-hard-sm"
            aria-label="Toggle menu"
          >
            <HamburgerIcon isOpen={isMenuOpen} />
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-vintage-cream border-b-3 border-ink-black shadow-hard-lg z-50">
            <div className="px-4 py-3 border-b border-ink-black/20">
              <div className="font-roboto-slab text-sm text-ink-black/60 mb-2">
                NAVIGATION
              </div>
              {navItems.map(item => (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.path)}
                  className={`
                    w-full text-left px-4 py-3 font-bebas uppercase tracking-wider text-lg
                    border-l-2 transition-all duration-200
                    ${isActive(item.path) 
                      ? 'border-l-ink-black bg-burnt-orange/20 text-ink-black' 
                      : 'border-l-transparent hover:border-l-forest-green hover:bg-forest-green/5'
                    }
                  `}
                >
                  {item.name}
                </button>
              ))}
            </div>
            
            <div className="px-4 py-3">
              <button
                onClick={() => {
                  navigate('/court')
                  setIsMenuOpen(false)
                }}
                className="w-full mb-2 btn-vintage-secondary"
              >
                LEBOT
              </button>
              <button
                onClick={() => {
                  signOut()
                  setIsMenuOpen(false)
                }}
                className="w-full btn-vintage"
              >
                EXIT
              </button>
            </div>
            
            {/* User info */}
            {user && (
              <div className="px-4 py-3 border-t border-ink-black/20 bg-vintage-navy/5">
                <div className="text-xs text-ink-black/40 font-roboto-slab uppercase tracking-wider mb-1">
                  PLAYER
                </div>
                <div className="font-bebas text-lg text-ink-black">
                  {user.email?.split('@')[0] || 'PLAYER'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
