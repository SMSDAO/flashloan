import { useState, useEffect } from 'react';
import CoreDashboardLayout from '../../src/dashboard/CoreDashboardLayout';

const widgets = [
  <div>Arbitrage Strategy Widget</div>,
  <div>Execution Result Widget</div>,
  <div>Wallet Scanner Widget</div>
];

export default function Arbitrage() {
  const [strategies, setStrategies] = useState([]);
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState('triangle');

  // Fetch available strategies
  useEffect(() => {
    fetch('/strategies')
      .then(res => res.json())
      .then(data => setStrategies(data.strategies));
  }, []);

  const execute = () => {
    fetch('/strategies/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategy: selected, wallet: 'DemoWallet', amount: 100, token: 'SOL', providers: ['Solana', 'Provider2', 'Provider3'] })
    })
      .then(res => res.json())
      .then(setResult);
  };

  return (
    <CoreDashboardLayout title="Advanced Arbitrage" widgets={widgets} chat={<span>Arbitrage Chat Placeholder</span>}>
      <select value={selected} onChange={e => setSelected(e.target.value)}>
        {strategies.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <button onClick={execute}>Execute</button>
      {result && <div>Result: {JSON.stringify(result)}</div>}
    </CoreDashboardLayout>
  );
}
