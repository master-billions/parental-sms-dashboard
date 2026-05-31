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
      <div className="absolute bottom-[-80px] right-[-100px] w-[500px] h-[500px] opacity-15 md:opacity-20">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <ellipse cx="100" cy="105" rx="65" ry="70" fill="#b91c1c" />
          <path d="M55 55 Q35 25 50 5" fill="none" stroke="#7f1d1d" strokeWidth="14" strokeLinecap="round" />
          <path d="M145 55 Q165 25 150 5" fill="none" stroke="#7f1d1d" strokeWidth="14" strokeLinecap="round" />
          <ellipse cx="68" cy="90" rx="16" ry="20" fill="#450a0a" />
          <circle cx="68" cy="90" r="9" fill="#ef4444" />
          <circle cx="68" cy="90" r="4" fill="#ffffff" />
          <ellipse cx="132" cy="90" rx="16" ry="20" fill="#450a0a" />
          <circle cx="132" cy="90" r="9" fill="#ef4444" />
          <circle cx="132" cy="90" r="4" fill="#ffffff" />
          <path d="M52 72 Q68 62 84 72" fill="none" stroke="#450a0a" strokeWidth="4" strokeLinecap="round" />
          <path d="M116 72 Q132 62 148 72" fill="none" stroke="#450a0a" strokeWidth="4" strokeLinecap="round" />
          <path d="M75 125 Q100 145 125 125" fill="none" stroke="#450a0a" strokeWidth="5" strokeLinecap="round" />
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

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4 relative">
      <RedDemonBackground />
      
      <div className="bg-[#1a1a1a] p-8 rounded-3xl w-full max-w-md border border-gray-800 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-700 rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-lg">
            <span className="text-white text-5xl">🛡️</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">HELLO MASTER👹</h1>
          <p className="text-gray-400 mt-2 text-sm">ENTER DASHBOARD</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 bg-[#111111] border border-gray-700 rounded-2xl text-white focus:outline-none focus:border-red-600 text-base"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 bg-[#111111] border border-gray-700 rounded-2xl text-white focus:outline-none focus:border-red-600 text-base"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-950 p-3.5 rounded-2xl border border-red-900">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-red-700 text-white rounded-2xl font-semibold text-base hover:bg-red-800 active:bg-red-900 transition-all disabled:bg-red-900 shadow-lg"
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

  // ==================== BOTTOM NAV (Android Style) ====================
  const BottomNav = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-gray-800 z-40 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${activeTab === 'messages' ? 'text-red-500' : 'text-gray-400'}`}
        >
          <span className="text-2xl mb-0.5">💬</span>
          <span className="text-[10px] font-medium">Messages</span>
        </button>

        <button
          onClick={() => setActiveTab('devices')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${activeTab === 'devices' ? 'text-red-500' : 'text-gray-400'}`}
        >
          <span className="text-2xl mb-0.5">📱</span>
          <span className="text-[10px] font-medium">Devices</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0f0f0f] text-white overflow-hidden">
      <RedDemonBackground />

      {/* ==================== SIDEBAR (Desktop Only) ==================== */}
      <div className="hidden md:flex md:w-72 bg-[#1a1a1a] border-r border-gray-800 flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 bg-red-700 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white text-3xl">🛡️</span>
            </div>
            <div>
              <h1 className="font-bold text-2xl tracking-tight">Master 👹👺</h1>
              <p className="text-xs text-gray-400 -mt-1">Device Dashboard</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('messages')}
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-left transition-all text-base ${activeTab === 'messages' ? 'bg-red-900/60 text-red-400 font-semibold' : 'hover:bg-[#111111] text-gray-300'}`}
            >
              <span className="text-xl">💬</span>
              <span>All Messages ({messages.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('devices')}
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-left transition-all text-base ${activeTab === 'devices' ? 'bg-red-900/60 text-red-400 font-semibold' : 'hover:bg-[#111111] text-gray-300'}`}
            >
              <span className="text-xl">📱</span>
              <span>Devices ({devices.length})</span>
            </button>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-gray-700 rounded-full flex-shrink-0"></div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{userEmail}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="text-red-400 text-sm hover:text-red-500 font-medium px-3 py-1"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* ==================== MAIN CONTENT ==================== */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top Header */}
        <div className="h-14 md:h-16 bg-[#1a1a1a] border-b border-gray-800 px-4 md:px-8 flex items-center justify-between z-30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="md:hidden w-9 h-9 bg-red-700 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🛡️</span>
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-semibold tracking-tight">
                {activeTab === 'messages' ? 'All Messages' : 'Child Devices'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {activeTab === 'messages' && (
              <input
                type="text"
                placeholder="Search messages..."
                className="px-4 py-2 bg-[#111111] border border-gray-700 rounded-2xl text-sm w-40 md:w-72 text-white placeholder:text-gray-500 focus:outline-none focus:border-red-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            )}
            
            {/* Desktop Send Button */}
            <button 
              onClick={() => setShowSendModal(true)}
              className="hidden md:flex px-5 py-2.5 bg-red-700 text-white rounded-2xl text-sm font-semibold hover:bg-red-800 active:bg-red-900 items-center gap-2 shadow-lg transition-all"
            >
              ✉️ Send SMS
            </button>

            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white rounded-2xl text-sm font-medium flex items-center gap-2 transition-colors"
              title="Refresh"
            >
              🔄 <span className="hidden md:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 md:p-8 overflow-auto pb-20 md:pb-8"> {/* Extra bottom padding for mobile nav */}
          {activeTab === 'messages' ? (
            loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
            ) : filteredMessages.length > 0 ? (
              <div className="space-y-4 max-w-4xl mx-auto">
                {filteredMessages.map((msg) => (
                  <div key={msg.id} className="bg-[#1a1a1a] p-5 md:p-6 rounded-3xl border border-gray-800 shadow-sm">
                    <div className="flex flex-col md:flex-row md:justify-between gap-2 mb-3">
                      <div className="font-semibold text-base break-all">{msg.from} → {msg.to}</div>
                      <div className="text-xs text-right flex-shrink-0">
                        <span className="px-3 py-1 bg-gray-800 rounded-full text-gray-300">{msg.type}</span>
                        <div className="text-gray-500 mt-1.5">{new Date(msg.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                    <p className="text-gray-300 text-[15px] leading-relaxed break-words">{msg.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-7xl mb-6">📭</div>
                <h3 className="text-2xl font-semibold">No messages found</h3>
              </div>
            )
          ) : (
            loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
            ) : devices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-7xl mx-auto">
                {devices.map((device, index) => (
                  <div key={index} className="bg-[#1a1a1a] p-5 md:p-6 rounded-3xl border border-gray-800 shadow-sm hover:border-gray-700 transition-colors">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-12 h-12 bg-red-900/60 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">📱</div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-lg">Child Device</h3>
                        <p className="text-xs text-gray-500 font-mono truncate mt-0.5">{device.device_id}</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Messages</span>
                        <span className="font-semibold text-lg">{device.messageCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Last Active</span>
                        <span className="font-medium">{new Date(device.lastSeen).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => openDeviceMessages(device.device_id)}
                      className="w-full py-3.5 bg-red-700 hover:bg-red-800 active:bg-red-900 text-white rounded-2xl text-sm font-semibold transition-all shadow-lg"
                    >
                      View Device SMS
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-7xl mb-6">📱</div>
                <h3 className="text-2xl font-semibold">No devices found</h3>
              </div>
            )
          )}
        </div>
      </div>

      {/* ==================== FLOATING ACTION BUTTON (Mobile) ==================== */}
      <button 
        onClick={() => setShowSendModal(true)}
        className="md:hidden fixed bottom-20 right-5 w-14 h-14 bg-red-700 hover:bg-red-800 active:bg-red-900 text-white rounded-full shadow-2xl flex items-center justify-center z-50 transition-all active:scale-95"
      >
        <span className="text-3xl">✉️</span>
      </button>

      {/* ==================== BOTTOM NAV (Mobile) ==================== */}
      <BottomNav />

      {/* ==================== SEND SMS MODAL ==================== */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-[60] p-0 md:p-4">
          <div className="bg-[#1a1a1a] w-full md:w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-6 md:p-8 border-t md:border border-gray-700 max-h-[92vh] overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Send SMS to Child</h2>
              <button onClick={() => setShowSendModal(false)} className="text-3xl text-gray-400 hover:text-white">×</button>
            </div>

            {sendSuccess ? (
              <div className="text-center py-10">
                <div className="text-7xl mb-5">✅</div>
                <h3 className="text-2xl font-semibold text-green-400">Command Sent!</h3>
              </div>
            ) : (
              <>
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Choose Device</label>
                  <select 
                    value={selectedDevice} 
                    onChange={(e) => setSelectedDevice(e.target.value)} 
                    className="w-full bg-[#111111] border border-gray-700 rounded-2xl px-4 py-3.5 text-white text-base"
                  >
                    <option value="">Select a device...</option>
                    {devices.map((device, index) => (
                      <option key={index} value={device.device_id}>
                        {device.device_id} ({device.messageCount} messages)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Or enter phone number</label>
                  <input 
                    type="text" 
                    placeholder="+234XXXXXXXXXX" 
                    value={phoneNumber} 
                    onChange={(e) => setPhoneNumber(e.target.value)} 
                    className="w-full bg-[#111111] border border-gray-700 rounded-2xl px-4 py-3.5 text-white text-base" 
                  />
                </div>

                <div className="mb-7">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                  <textarea 
                    placeholder="Type your message..." 
                    value={smsBody} 
                    onChange={(e) => setSmsBody(e.target.value)} 
                    rows={5} 
                    className="w-full bg-[#111111] border border-gray-700 rounded-2xl px-4 py-3.5 resize-y min-h-[120px] text-white text-base" 
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowSendModal(false)} 
                    className="flex-1 py-3.5 border border-gray-700 rounded-2xl font-semibold text-base active:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSendSMS} 
                    disabled={sending || !smsBody.trim()} 
                    className="flex-1 py-3.5 bg-red-700 text-white rounded-2xl font-semibold text-base disabled:bg-red-900 active:bg-red-800 transition-all"
                  >
                    {sending ? 'Sending...' : 'Send SMS'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ==================== DEVICE MESSAGES MODAL ==================== */}
      {showDeviceMessagesModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-[60] p-0 md:p-4">
          <div className="bg-[#1a1a1a] w-full md:w-full md:max-w-2xl rounded-t-3xl md:rounded-3xl flex flex-col border-t md:border border-gray-700 max-h-[92vh]">
            <div className="p-6 border-b border-gray-700 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">Device Messages</h2>
                <p className="text-sm text-gray-500 font-mono mt-1">{selectedDeviceForModal}</p>
              </div>
              <button 
                onClick={() => setShowDeviceMessagesModal(false)} 
                className="text-4xl leading-none text-gray-400 hover:text-white -mt-1"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-4">
              {deviceMessages.length > 0 ? (
                deviceMessages.map((msg) => (
                  <div key={msg.id} className="bg-[#111111] p-4 rounded-2xl border border-gray-800">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">{msg.from} → {msg.to}</span>
                      <span className="text-gray-500 text-xs">{new Date(msg.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-300 text-[15px] break-words leading-relaxed">{msg.body}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-5">📭</div>
                  <p className="text-gray-400">No messages from this device</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-700">
              <button 
                onClick={() => setShowDeviceMessagesModal(false)}
                className="w-full py-3.5 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 rounded-2xl font-semibold text-base transition-colors"
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

// ==================== MAIN APP ====================
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
        <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={session ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App