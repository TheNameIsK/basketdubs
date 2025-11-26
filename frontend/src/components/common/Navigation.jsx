import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function Navigation({ currentPage }) {
  const navigate = useNavigate()
  const { signOut } = useAuth()
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
    { name: 'Court', path: '/court', icon: '🏀', color: 'orange' },
    { name: 'Leaderboard', path: '/leaderboard', icon: '🏆', color: 'yellow' },
    { name: 'Shop', path: '/shop', icon: '🛍️', color: 'purple' },
    { name: 'Profile', path: '/profile', icon: '👤', color: 'blue' },
  ]

  const colorClasses = {
    orange: 'bg-orange-500 hover:bg-orange-600',
    yellow: 'bg-yellow-500 hover:bg-yellow-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
  }

  const handleNavigation = (path) => {
    navigate(path)
    setIsMenuOpen(false)
  }

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-2 lg:gap-4">
        {navItems
          .filter(item => item.name !== currentPage)
          .map(item => (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.path)}
              className={`${colorClasses[item.color]} text-white px-3 lg:px-4 py-2 rounded-lg transition-colors text-sm lg:text-base whitespace-nowrap`}
            >
              <span className="hidden lg:inline">{item.icon} </span>
              {item.name}
            </button>
          ))}
        <button
          onClick={signOut}
          className="bg-red-500 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm lg:text-base"
        >
          Logout
        </button>
      </div>

      {/* Mobile Hamburger Button */}
      <div className="md:hidden" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isMenuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {navItems
            .filter(item => item.name !== currentPage)
            .map(item => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.path)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </button>
            ))}
          <hr className="my-2 border-gray-200" />
            <button
              onClick={() => {
                signOut()
                setIsMenuOpen(false)
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-red-600 font-medium"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </>
  )
}
