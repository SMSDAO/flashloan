import React, { useEffect, useState } from 'react';
import CoreDashboardLayout from './CoreDashboardLayout';

export default function AdminDashboard() {
  const [prices, setPrices] = useState({});
  const [tokens, setTokens] = useState([]);
  const [analytics, setAnalytics] = useState({ users: 0, trades: 0, volume: 0 });

  useEffect(() => {
    fetch('/api/prices').then(r => r.json()).then(setPrices);
    fetch('/api/tokens').then(r => r.json()).then(setTokens);
    fetch('/api/analytics').then(r => r.json()).then(setAnalytics);
  }, []);

  return (
    <CoreDashboardLayout title="Admin Dashboard">
      <section>
        <h2>Analytics</h2>
        <ul>
          <li>Active users: {analytics.users}</li>
          <li>Total trades: {analytics.trades}</li>
          <li>Trade volume: {analytics.volume}</li>
        </ul>
      </section>
      <section>
        <h2>Aggregated Prices</h2>
        <pre>{JSON.stringify(prices, null, 2)}</pre>
      </section>
      <section>
        <h2>SPL Tokens</h2>
        <pre>{JSON.stringify(tokens, null, 2)}</pre>
      </section>
    </CoreDashboardLayout>
  );
}
