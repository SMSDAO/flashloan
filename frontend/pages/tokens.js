import { useState, useEffect } from 'react';
import CoreDashboardLayout from '../../src/dashboard/CoreDashboardLayout';

const widgets = [
  <div>Token List Widget</div>,
  <div>Provider Sync Widget</div>,
  <div>Wallet Scanner Widget</div>
];

export default function Tokens() {
  const [tokens, setTokens] = useState({});
  useEffect(() => {
    fetch('/tokens/sync')
      .then(res => res.json())
      .then(setTokens);
  }, []);
  return (
    <CoreDashboardLayout title="Live Token List Sync" widgets={widgets} chat={<span>Tokens Chat Placeholder</span>}>
      {Object.entries(tokens).map(([provider, list]) => (
        <div key={provider}>
          <h3>{provider}</h3>
          <pre>{JSON.stringify(list, null, 2)}</pre>
        </div>
      ))}
    </CoreDashboardLayout>
  );
}
