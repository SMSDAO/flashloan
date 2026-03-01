import { useState } from 'react';
import CoreDashboardLayout from '../../src/dashboard/CoreDashboardLayout';

const widgets = [
  <div>Pool LP Monitor Widget</div>,
  <div>Bot Status Widget</div>,
  <div>Wallet Scanner Widget</div>,
  <div>Scoring Widget</div>,
  <div>Quest Poster Widget</div>,
  <div>Ranking Widget</div>,
  <div>Donation Widget</div>,
  <div>Flash Loan Opportunity Widget</div>
];

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
    <CoreDashboardLayout title="Execution Bot Dashboard" widgets={widgets} chat={<span>AI Chat Placeholder</span>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <select value={strategy} onChange={e => setStrategy(e.target.value)}>
          <option value="turbo">Turbo</option>
          <option value="ninja">Ninja</option>
          <option value="sniper">Sniper</option>
        </select>
        <input value={wallet} onChange={e => setWallet(e.target.value)} placeholder="Wallet" />
        <input value={pool} onChange={e => setPool(e.target.value)} placeholder="Pool" />
        <input value={token} onChange={e => setToken(e.target.value)} placeholder="Token" />
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" />
        <button onClick={executeBot} style={{ padding: 8, fontWeight: 'bold' }}>Execute</button>
      </div>
      {result && (
        <div style={{ marginTop: 24, background: '#f9f9f9', borderRadius: 8, padding: 16 }}>
          <h3>Status: {result.status}</h3>
          <div>Strategy: {result.strategy}</div>
          <div>Wallet: {result.wallet}</div>
        </div>
      )}
    </CoreDashboardLayout>
  );
}
