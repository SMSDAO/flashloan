import { useState, useEffect } from 'react';
import CoreDashboardLayout from '../../src/dashboard/CoreDashboardLayout';

const widgets = [
  <div>Quest Widget</div>,
  <div>Airdrop Widget</div>,
  <div>Wallet Scanner Widget</div>,
  <div>Token Scanner Widget</div>,
  <div>Deep Monitoring Widget</div>,
  <div>Analytics Widget</div>
];

export default function Analytics() {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/analytics/history')
      .then(res => res.json())
      .then(setHistory);
  }, []);

  return (
    <CoreDashboardLayout title="Live Analytics" widgets={widgets} chat={<span>Analytics Chat Placeholder</span>}>
      <ul>
        {history.map((h, i) => (
          <li key={i}>
            {h.strategy} | Profit: {h.total_profit} | Cycle: {h.cycle_map.join(' → ')}
          </li>
        ))}
      </ul>
    </CoreDashboardLayout>
  );
}
