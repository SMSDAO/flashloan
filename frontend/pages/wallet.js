import { useState, useEffect } from 'react';
import CoreDashboardLayout from '../../src/dashboard/CoreDashboardLayout';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

const widgets = [
  <div>Wallet Balance Widget</div>,
  <div>Deposit History Widget</div>,
  <div>Withdraw History Widget</div>,
  <div>Transaction Feed Widget</div>,
];

export default function WalletPage({ socket }) {
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState(null);
  const [history, setHistory] = useState([]);
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [token, setToken] = useState('SOL');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchWallet = async (address) => {
    if (!address) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/wallet/${encodeURIComponent(address)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBalance(data.balance);
      setHistory(data.history || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      if (data.wallet === walletAddress) {
        fetchWallet(walletAddress);
      }
    };
    socket.on('walletUpdate', handler);
    return () => socket.off('walletUpdate', handler);
  }, [socket, walletAddress]);

  const handleDeposit = async () => {
    if (!walletAddress || !amount) {
      setMessage({ type: 'error', text: 'Wallet address and amount are required.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/wallet/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: walletAddress, amount: parseFloat(amount), token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Deposit failed');
      setMessage({ type: 'success', text: `Deposited ${amount} ${token}. New balance: ${data.balanceAfter.toFixed(4)} ${token}` });
      setBalance(data.balanceAfter);
      setAmount('');
      fetchWallet(walletAddress);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!walletAddress || !amount) {
      setMessage({ type: 'error', text: 'Wallet address and amount are required.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/wallet/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: walletAddress,
          amount: parseFloat(amount),
          token,
          destination: destination || walletAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Withdraw failed');
      setMessage({ type: 'success', text: `Withdrew ${amount} ${token}. New balance: ${data.balanceAfter.toFixed(4)} ${token}` });
      setBalance(data.balanceAfter);
      setAmount('');
      fetchWallet(walletAddress);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const neonStyle = {
    background: 'rgba(20, 0, 40, 0.85)',
    border: '1px solid #a020f0',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0 0 20px rgba(160, 32, 240, 0.3)',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(0, 0, 0, 0.5)',
    border: '1px solid #a020f0',
    borderRadius: 8,
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    marginBottom: 8,
    boxSizing: 'border-box',
  };

  const btnStyle = (color = '#a020f0') => ({
    padding: '10px 24px',
    background: `linear-gradient(90deg, ${color}, #00ff99)`,
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontWeight: 'bold',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1,
    marginRight: 8,
    fontSize: '0.95rem',
  });

  return (
    <CoreDashboardLayout title="Wallet — Deposit &amp; Withdraw" widgets={widgets} chat={<span>Wallet Support</span>}>
      <div style={{ color: '#fff', fontFamily: 'Montserrat, Arial, sans-serif', padding: 8 }}>

        {/* Wallet Address Input */}
        <div style={neonStyle}>
          <h3 style={{ color: '#00ff99', marginBottom: 12 }}>🔑 Wallet Address</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
              placeholder="Enter Solana wallet address..."
              value={walletAddress}
              onChange={e => setWalletAddress(e.target.value)}
            />
            <button style={btnStyle()} onClick={() => fetchWallet(walletAddress)} disabled={loading}>
              Load
            </button>
          </div>
        </div>

        {/* Balance Display */}
        {balance !== null && (
          <div style={{ ...neonStyle, textAlign: 'center', border: '1px solid #00ff99' }}>
            <div style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: 4 }}>Available Balance</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#00ff99', textShadow: '0 0 20px #00ff99' }}>
              {balance.toFixed(4)} <span style={{ fontSize: '1.2rem', color: '#a020f0' }}>{token}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: 4 }}>{walletAddress}</div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 16,
            background: message.type === 'success' ? 'rgba(0, 255, 153, 0.1)' : 'rgba(255, 80, 80, 0.1)',
            border: `1px solid ${message.type === 'success' ? '#00ff99' : '#ff5050'}`,
            color: message.type === 'success' ? '#00ff99' : '#ff5050',
          }}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}

        {/* Deposit / Withdraw Form */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {/* Deposit */}
          <div style={{ ...neonStyle, flex: 1, minWidth: 260 }}>
            <h3 style={{ color: '#00ff99', marginBottom: 12 }}>⬇️ Deposit</h3>
            <input
              style={inputStyle}
              type="number"
              min="0"
              placeholder="Amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            <select
              style={{ ...inputStyle }}
              value={token}
              onChange={e => setToken(e.target.value)}
            >
              <option value="SOL">SOL</option>
              <option value="USDC">USDC</option>
              <option value="USDT">USDT</option>
              <option value="RAY">RAY</option>
            </select>
            <button style={btnStyle('#00aa55')} onClick={handleDeposit} disabled={loading}>
              {loading ? 'Processing...' : 'Deposit'}
            </button>
          </div>

          {/* Withdraw */}
          <div style={{ ...neonStyle, flex: 1, minWidth: 260 }}>
            <h3 style={{ color: '#f0a020', marginBottom: 12 }}>⬆️ Withdraw</h3>
            <input
              style={inputStyle}
              type="number"
              min="0"
              placeholder="Amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            <input
              style={inputStyle}
              placeholder="Destination address (optional)"
              value={destination}
              onChange={e => setDestination(e.target.value)}
            />
            <select
              style={{ ...inputStyle }}
              value={token}
              onChange={e => setToken(e.target.value)}
            >
              <option value="SOL">SOL</option>
              <option value="USDC">USDC</option>
              <option value="USDT">USDT</option>
              <option value="RAY">RAY</option>
            </select>
            <button style={btnStyle('#cc6600')} onClick={handleWithdraw} disabled={loading}>
              {loading ? 'Processing...' : 'Withdraw'}
            </button>
          </div>
        </div>

        {/* Transaction History */}
        {history.length > 0 && (
          <div style={neonStyle}>
            <h3 style={{ color: '#a020f0', marginBottom: 12 }}>📋 Transaction History</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ color: '#a020f0', borderBottom: '1px solid #333' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Type</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Token</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Balance After</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Status</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((op, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #222', color: '#ccc' }}>
                      <td style={{ padding: '8px' }}>
                        <span style={{ color: op.operation === 'deposit' ? '#00ff99' : '#f0a020' }}>
                          {op.operation === 'deposit' ? '⬇️ Deposit' : '⬆️ Withdraw'}
                        </span>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{op.amount?.toFixed(4)}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{op.token}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{op.balance_after?.toFixed(4)}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        <span style={{ color: op.status === 'completed' ? '#00ff99' : '#ff5050' }}>
                          {op.status}
                        </span>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#666' }}>
                        {new Date(op.created_at * 1000).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </CoreDashboardLayout>
  );
}
