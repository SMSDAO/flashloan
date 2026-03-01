import { useState, useEffect } from 'react';

export default function Dashboard({ socket }) {
  const [result, setResult] = useState(null);
  const [strategy, setStrategy] = useState('turbo');
  const [wallet, setWallet] = useState('');
  const [pool, setPool] = useState('SOL-USDC');
  const [token, setToken] = useState('SOL');
  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalVolume: 0,
    totalProfit: 0,
    executionCount: 0,
    successRate: 0,
  });
  const [recentExecutions, setRecentExecutions] = useState([]);

  useEffect(() => {
    // Fetch initial stats
    fetch('/api/status')
      .then(res => res.json())
      .then(data => console.log('Backend status:', data))
      .catch(err => console.error('Error:', err));

    // Listen for real-time updates
    if (socket) {
      socket.on('flashloanExecuted', (data) => {
        console.log('Flashloan executed:', data);
        setRecentExecutions(prev => [data, ...prev].slice(0, 5));
      });

      socket.on('botExecuted', (data) => {
        console.log('Bot executed:', data);
        setResult(data);
        setLoading(false);
      });
    }

    return () => {
      if (socket) {
        socket.off('flashloanExecuted');
        socket.off('botExecuted');
      }
    };
  }, [socket]);

  const executeBot = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Use environment variable or fallback to relative path (works with Vercel rewrites)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/bots/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy, wallet, pool, token, amount })
      });
      
      const data = await response.json();
      setResult(data);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        executionCount: prev.executionCount + 1,
        totalVolume: prev.totalVolume + amount,
        totalProfit: prev.totalProfit + (data.profit || 0),
      }));
    } catch (error) {
      console.error('Execution error:', error);
      setResult({ status: 'error', error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="dashboard">
        {/* Header */}
        <header className="dashboard-header">
          <h1 className="glow-text">⚡ Solana Flashloan Arbitrage</h1>
          <p className="subtitle">Production-Grade 2026 Trading System</p>
        </header>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stats-card glass-card">
            <div className="value">${stats.totalVolume.toLocaleString()}</div>
            <div className="label">Total Volume</div>
          </div>
          <div className="stats-card glass-card">
            <div className="value">${stats.totalProfit.toFixed(2)}</div>
            <div className="label">Total Profit</div>
          </div>
          <div className="stats-card glass-card">
            <div className="value">{stats.executionCount}</div>
            <div className="label">Executions</div>
          </div>
          <div className="stats-card glass-card">
            <div className="value">{stats.successRate.toFixed(1)}%</div>
            <div className="label">Success Rate</div>
          </div>
        </div>

        {/* Execution Panel */}
        <div className="execution-panel glass-card">
          <h2>Execute Arbitrage Bot</h2>
          
          <div className="form-grid">
            <div className="form-field">
              <label>Strategy</label>
              <select 
                className="neo-select" 
                value={strategy} 
                onChange={e => setStrategy(e.target.value)}
              >
                <option value="turbo">🚀 Turbo - High Speed</option>
                <option value="ninja">🥷 Ninja - Stealth Mode</option>
                <option value="sniper">🎯 Sniper - Precision</option>
              </select>
            </div>

            <div className="form-field">
              <label>Pool</label>
              <select 
                className="neo-select" 
                value={pool} 
                onChange={e => setPool(e.target.value)}
              >
                <option value="SOL-USDC">SOL-USDC</option>
                <option value="SOL-USDT">SOL-USDT</option>
                <option value="RAY-USDC">RAY-USDC</option>
                <option value="ORCA-USDC">ORCA-USDC</option>
              </select>
            </div>

            <div className="form-field">
              <label>Token</label>
              <input 
                className="neo-input" 
                value={token} 
                onChange={e => setToken(e.target.value)} 
                placeholder="Token symbol"
              />
            </div>

            <div className="form-field">
              <label>Amount</label>
              <input 
                className="neo-input" 
                type="number" 
                value={amount} 
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  setAmount(isNaN(val) || val < 0 ? 0 : val);
                }}
                min="0"
                step="0.01"
                placeholder="Amount"
              />
            </div>

            <div className="form-field">
              <label>Wallet Address</label>
              <input 
                className="neo-input" 
                value={wallet} 
                onChange={e => setWallet(e.target.value)} 
                placeholder="Your Solana wallet address"
              />
            </div>
          </div>

          <button 
            className="neo-button" 
            onClick={executeBot} 
            disabled={loading}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {loading ? (
              <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
            ) : (
              '⚡ Execute Arbitrage'
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="results-panel glass-card">
            <h3>
              Execution Result 
              <span className={`status-badge ${result.status}`}>
                {result.status}
              </span>
            </h3>
            <div className="result-details">
              <div className="detail-row">
                <span>Strategy:</span>
                <span className="glow-text">{result.strategy}</span>
              </div>
              <div className="detail-row">
                <span>Pool:</span>
                <span>{result.pool}</span>
              </div>
              <div className="detail-row">
                <span>Token:</span>
                <span>{result.token}</span>
              </div>
              <div className="detail-row">
                <span>Amount:</span>
                <span>{result.amount} {result.token}</span>
              </div>
              <div className="detail-row">
                <span>Score:</span>
                <span>{result.score?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="detail-row">
                <span>Profit:</span>
                <span className="glow-text">
                  +${result.profit?.toFixed(4) || '0.0000'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Recent Executions */}
        {recentExecutions.length > 0 && (
          <div className="recent-panel glass-card">
            <h3>📊 Recent Executions</h3>
            <div className="executions-list">
              {recentExecutions.map((exec, idx) => (
                <div key={idx} className="execution-item">
                  <div className="exec-info">
                    <span className="status-badge success">{exec.status}</span>
                    <span>{new Date(exec.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="exec-details">
                    Amount: {exec.amount} | Profit: +${exec.profit?.toFixed(4) || '0.0000'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .dashboard {
          padding: 2rem 0;
          max-width: 1400px;
          margin: 0 auto;
        }

        .dashboard-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .dashboard-header h1 {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }

        .subtitle {
          color: rgba(255, 255, 255, 0.6);
          font-size: 1.125rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .execution-panel {
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .execution-panel h2 {
          margin-bottom: 1.5rem;
          color: var(--color-primary);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .form-field label {
          display: block;
          margin-bottom: 0.5rem;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.875rem;
          font-weight: 500;
        }

        .results-panel {
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .results-panel h3 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .result-details {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .detail-row span:first-child {
          color: rgba(255, 255, 255, 0.6);
        }

        .detail-row span:last-child {
          font-weight: 600;
        }

        .recent-panel {
          padding: 2rem;
        }

        .recent-panel h3 {
          margin-bottom: 1.5rem;
        }

        .executions-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .execution-item {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .exec-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .exec-details {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .dashboard-header h1 {
            font-size: 2rem;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
