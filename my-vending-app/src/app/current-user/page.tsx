'use client'
import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Loader2, WifiOff, CreditCard, User } from 'lucide-react'

export default function CurrentUserPage() {
  const [uid, setUid] = useState('—')
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('connecting')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const evtSource = new EventSource('/api/fetch-details')
    
    evtSource.onopen = () => {
      console.log('SSE connection opened')
      setStatus('connected')
    }
    
    evtSource.onmessage = async (e) => {
      setUid(e.data)
      setError(null)
      setLoading(true)
      
      // Search for user when new UID is received
      try { 
        const response = await fetch(`/api/users/find?rfidTag=${encodeURIComponent(e.data)}`)
        if (!response.ok) throw new Error('User not found')
        const userData = await response.json()
        setUser(userData)
      } catch (err) {
        setUser(null)
        console.error('Error finding user:', err)
      } finally {
        setLoading(false)
      }
    }
    
    evtSource.onerror = (err) => {
      console.error('EventSource error:', err)
      setError('Connection lost. Retrying...')
      setStatus('closed')
      evtSource.close()
    }
    
    return () => {
      console.log('Closing SSE connection')
      evtSource.close()
      setStatus('closed')
    }
  }, [])

  // Status badge component
  const StatusBadge = () => {
    switch(status) {
      case 'connecting':
        return (
          <div className="flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Connecting...
          </div>
        )
      case 'connected':
        return (
          <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
            <CheckCircle className="w-4 h-4 mr-2" />
            Connected
          </div>
        )
      case 'closed':
        return (
          <div className="flex items-center bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
            <WifiOff className="w-4 h-4 mr-2" />
            Disconnected
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto p-6">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Vending Machine Reader</h1>
          <StatusBadge />
        </header>
        
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-700">RFID Card Details</h2>
          </div>
          
          <div className="mb-4 flex items-center">
            <p className="text-gray-600 mr-2">Last scanned UID:</p>
            <span className="font-mono bg-gray-100 px-3 py-1 rounded text-gray-800">{uid}</span>
          </div>
          
          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          )}
        </div>
        
        {user && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center mb-4">
              <User className="w-5 h-5 text-green-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-700">User Found</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex">
                <span className="text-gray-500 w-20">Name:</span>
                <span className="font-medium text-gray-800">{user.name || 'Not specified'}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-20">Email:</span>
                <span className="font-medium text-gray-800">{user.email}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-20">User ID:</span>
                <span className="font-medium text-gray-800">{user.id}</span>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-600 font-medium">Error: {error}</span>
            </div>
          </div>
        )}
        
        {!user && !loading && uid !== '—' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
              <span className="text-yellow-700 font-medium">No user found with this RFID tag</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}