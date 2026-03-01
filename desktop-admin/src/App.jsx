import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { io } from 'socket.io-client'
import './App.css'

// Initialize socket connection to backend
let socket;

function App() {
  const [bots, setBots] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [logs, setLogs] = useState([])
  const [connected, setConnected] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // Bot management state
  const [newBotName, setNewBotName] = useState('')
  const [gasSettings, setGasSettings] = useState({
    maxFee: 100000,
    priorityMultiplier: 1.5
  })

  useEffect(() => {
    // Load initial data
    loadBots()
    loadMetrics()
    loadLogs()

    // Connect to backend
    socket = io('http://localhost:4000')
    
    socket.on('connect', () => {
      console.log('Connected to backend')
      setConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from backend')
      setConnected(false)
    })

    socket.on('botExecuted', (data) => {
      console.log('Bot executed:', data)
      setLogs(prev => [`Bot executed: ${JSON.stringify(data)}`, ...prev].slice(0, 50))
    })

    return () => {
      if (socket) socket.disconnect()
    }
  }, [])

  const loadBots = async () => {
    try {
      const result = await invoke('get_bots')
      setBots(result)
    } catch (error) {
      console.error('Failed to load bots:', error)
    }
  }

  const loadMetrics = async () => {
    try {
      const result = await invoke('get_profitability_metrics')
      setMetrics(JSON.parse(result))
    } catch (error) {
      console.error('Failed to load metrics:', error)
    }
  }

  const loadLogs = async () => {
    try {
      const result = await invoke('get_execution_logs')
      setLogs(result)
    } catch (error) {
      console.error('Failed to load logs:', error)
    }
  }

  const handleExecuteBot = async (botId) => {
    try {
      const config = JSON.stringify({ strategy: 'turbo', amount: 100 })
      await invoke('execute_bot', { botId, config })
      setLogs(prev => [`Executed bot: ${botId}`, ...prev].slice(0, 50))
      loadMetrics()
    } catch (error) {
      console.error('Failed to execute bot:', error)
      setLogs(prev => [`Error executing bot: ${error}`, ...prev].slice(0, 50))
    }
  }

  const handleAddBot = async () => {
    if (!newBotName.trim()) return
    
    try {
      await invoke('add_bot', { botId: newBotName })
      setNewBotName('')
      loadBots()
      setLogs(prev => [`Added bot: ${newBotName}`, ...prev].slice(0, 50))
    } catch (error) {
      console.error('Failed to add bot:', error)
    }
  }

  const handleRemoveBot = async (botId) => {
    try {
      await invoke('remove_bot', { botId })
      loadBots()
      setLogs(prev => [`Removed bot: ${botId}`, ...prev].slice(0, 50))
    } catch (error) {
      console.error('Failed to remove bot:', error)
    }
  }

  const handleUpdateGasFees = async () => {
    try {
      await invoke('update_gas_fees', {
        maxFee: parseInt(gasSettings.maxFee),
        priorityMultiplier: parseFloat(gasSettings.priorityMultiplier)
      })
      setLogs(prev => [`Updated gas fees: max=${gasSettings.maxFee}, multiplier=${gasSettings.priorityMultiplier}`, ...prev].slice(0, 50))
    } catch (error) {
      console.error('Failed to update gas fees:', error)
    }
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <h1>⚡ Flashloan Admin</h1>
          <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
            <div className="status-dot"></div>
            <span>{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        <div className="header-right">
          <button onClick={loadMetrics} className="btn-refresh">🔄 Refresh</button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav-tabs">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''} 
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={activeTab === 'bots' ? 'active' : ''} 
          onClick={() => setActiveTab('bots')}
        >
          🤖 Bots
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''} 
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
        <button 
          className={activeTab === 'logs' ? 'active' : ''} 
          onClick={() => setActiveTab('logs')}
        >
          📝 Logs
        </button>
      </nav>

      {/* Content */}
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <h2>Profitability Metrics</h2>
            {metrics && (
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-value">${metrics.totalProfit?.toFixed(2)}</div>
                  <div className="metric-label">Total Profit</div>
                </div>
                <div className="metric-card">
                  <div className="metric-value">${metrics.totalVolume?.toLocaleString()}</div>
                  <div className="metric-label">Total Volume</div>
                </div>
                <div className="metric-card">
                  <div className="metric-value">{metrics.executionCount}</div>
                  <div className="metric-label">Executions</div>
                </div>
                <div className="metric-card">
                  <div className="metric-value">{metrics.successRate}%</div>
                  <div className="metric-label">Success Rate</div>
                </div>
                <div className="metric-card">
                  <div className="metric-value">${metrics.avgProfitPerTx?.toFixed(2)}</div>
                  <div className="metric-label">Avg Profit/Tx</div>
                </div>
                <div className="metric-card">
                  <div className="metric-value">{metrics.topStrategy}</div>
                  <div className="metric-label">Top Strategy</div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bots' && (
          <div className="bots">
            <h2>Bot Management</h2>
            
            <div className="add-bot-section">
              <input
                type="text"
                placeholder="Bot name"
                value={newBotName}
                onChange={(e) => setNewBotName(e.target.value)}
                className="input"
              />
              <button onClick={handleAddBot} className="btn-primary">Add Bot</button>
            </div>

            <div className="bots-list">
              {bots.map((bot, idx) => (
                <div key={idx} className="bot-card">
                  <div className="bot-info">
                    <h3>🤖 {bot}</h3>
                    <span className="status-badge success">Active</span>
                  </div>
                  <div className="bot-actions">
                    <button onClick={() => handleExecuteBot(bot)} className="btn-execute">
                      Execute
                    </button>
                    <button onClick={() => handleRemoveBot(bot)} className="btn-danger">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings">
            <h2>Gas Fee Configuration</h2>
            
            <div className="settings-form">
              <div className="form-group">
                <label>Max Fee (lamports)</label>
                <input
                  type="number"
                  value={gasSettings.maxFee}
                  onChange={(e) => setGasSettings({ ...gasSettings, maxFee: e.target.value })}
                  className="input"
                />
              </div>

              <div className="form-group">
                <label>Priority Multiplier</label>
                <input
                  type="number"
                  step="0.1"
                  value={gasSettings.priorityMultiplier}
                  onChange={(e) => setGasSettings({ ...gasSettings, priorityMultiplier: e.target.value })}
                  className="input"
                />
              </div>

              <button onClick={handleUpdateGasFees} className="btn-primary">
                Update Gas Fees
              </button>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="logs">
            <h2>Execution Logs</h2>
            <div className="logs-container">
              {logs.length === 0 ? (
                <div className="no-logs">No logs yet</div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="log-entry">
                    <span className="log-time">{new Date().toLocaleTimeString()}</span>
                    <span className="log-message">{log}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
