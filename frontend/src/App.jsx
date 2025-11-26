import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useState, useEffect } from 'react'
import axios from 'axios'
import Login from './pages/Login'
import Welcome from './pages/Welcome'
import Court from './pages/Court'
import Shop from './pages/Shop'
import Profile from './pages/Profile'
import Leaderboard from './pages/Leaderboard'

// Protected Route wrapper with first-login check
function ProtectedRoute({ children, skipWelcomeCheck = false }) {
  const { user, session, loading } = useAuth()
  const [checkingFirstLogin, setCheckingFirstLogin] = useState(!skipWelcomeCheck)
  const [isFirstLogin, setIsFirstLogin] = useState(false)

  useEffect(() => {
    if (user && session && !skipWelcomeCheck) {
      checkFirstLogin()
    } else if (skipWelcomeCheck) {
      setCheckingFirstLogin(false)
    }
  }, [user, session, skipWelcomeCheck])

  const checkFirstLogin = async () => {
    try {
      const token = session?.access_token
      if (!token) {
        setCheckingFirstLogin(false)
        return
      }

      // Check sessionStorage first to avoid redundant API calls
      const sessionKey = `first_login_checked_${user.id}`
      const alreadyChecked = sessionStorage.getItem(sessionKey)
      
      if (alreadyChecked) {
        console.log('First login already checked this session, skipping...')
        setIsFirstLogin(false)
        setCheckingFirstLogin(false)
        return
      }

      console.log('Checking first login status...')
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/profile/check-first-login`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      console.log('First login check result:', response.data)
      
      // Mark as checked in sessionStorage (persists until browser tab closes)
      sessionStorage.setItem(sessionKey, 'true')
      
      setIsFirstLogin(response.data.is_first_login)
    } catch (err) {
      console.error('Failed to check first login:', err)
      // On error, assume not first login to avoid blocking
      setIsFirstLogin(false)
    } finally {
      setCheckingFirstLogin(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    )
  }

  if (!user || !session) {
    console.log('No user or session, redirecting to login')
    return <Navigate to="/login" replace />
  }

  if (checkingFirstLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Checking profile...</div>
      </div>
    )
  }

  if (isFirstLogin && !skipWelcomeCheck) {
    console.log('Redirecting to welcome page...')
    return <Navigate to="/welcome" replace />
  }

  return children
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/welcome"
            element={
              <ProtectedRoute skipWelcomeCheck={true}>
                <Welcome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/court"
            element={
              <ProtectedRoute>
                <Court />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shop"
            element={
              <ProtectedRoute>
                <Shop />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
