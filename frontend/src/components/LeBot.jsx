/**
 * LeBot - NBA AI Assistant
 * Floating chat button with modal interface
 */
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'

export default function LeBot() {
  const { session } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: "Hey there! 🏀 I'm LeBot, your NBA assistant. Ask me anything about basketball, players, teams, or get help with your predictions!",
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [usage, setUsage] = useState({ used: 0, remaining: 10, limit: 10 })
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      fetchUsage()
      fetchHistory()
      scrollToBottom()
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchUsage = async () => {
    try {
      const token = session?.access_token
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/chat/usage`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setUsage(response.data)
    } catch (err) {
      console.error('Failed to fetch usage:', err)
    }
  }

  const fetchHistory = async () => {
    try {
      const token = session?.access_token
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/chat/history`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      
      // If there's history, replace the welcome message with actual history
      if (response.data.messages && response.data.messages.length > 0) {
        const historyMessages = response.data.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp)
        }))
        setMessages(historyMessages)
      }
    } catch (err) {
      console.error('Failed to fetch history:', err)
      // Keep welcome message if history fetch fails
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!inputMessage.trim() || sending) return
    
    if (usage.remaining <= 0) {
      alert('You\'ve reached your daily limit of 10 messages. Come back tomorrow! 🏀')
      return
    }

    // Add user message to chat
    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setSending(true)

    try {
      const token = session?.access_token
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/chat/message`,
        { message: inputMessage },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      // Add bot response to chat
      const botMessage = {
        role: 'bot',
        content: response.data.message,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
      
      // Update usage
      setUsage({
        used: response.data.used,
        remaining: response.data.remaining,
        limit: 10
      })
    } catch (err) {
      console.error('Failed to send message:', err)
      
      let errorMessage = 'Sorry, I\'m having trouble right now. Try again in a moment! 🏀'
      
      if (err.response?.status === 429) {
        errorMessage = err.response.data.message || 'Daily limit reached. Come back tomorrow! 🏀'
      }
      
      const errorBotMessage = {
        role: 'bot',
        content: errorMessage,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorBotMessage])
    } finally {
      setSending(false)
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg transition-all hover:scale-110 z-50"
        aria-label="Open LeBot Chat"
      >
        <span className="text-3xl">🏀</span>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">🏀 LeBot</h3>
              <p className="text-xs opacity-90">
                {usage.remaining} messages left today
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-orange-500 text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.role === 'user' ? 'text-orange-100' : 'text-gray-400'
                    }`}
                  >
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about NBA..."
                maxLength={500}
                disabled={sending || usage.remaining <= 0}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={sending || !inputMessage.trim() || usage.remaining <= 0}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? '...' : '→'}
              </button>
            </div>
            {usage.remaining <= 0 && (
              <p className="text-xs text-red-500 mt-2">
                Daily limit reached. Come back tomorrow! 🏀
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {inputMessage.length}/500 characters
            </p>
          </form>
        </div>
      )}
    </>
  )
}
