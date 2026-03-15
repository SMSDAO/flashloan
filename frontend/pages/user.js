import { useState } from 'react';
import CoreDashboardLayout from '../components/CoreDashboardLayout';

const glassCard = {
  background: 'rgba(10, 0, 30, 0.72)',
  border: '1px solid rgba(0, 255, 180, 0.18)',
  borderRadius: '18px',
  boxShadow: '0 0 32px 4px rgba(0,255,153,0.13), 0 0 64px 8px rgba(124,58,237,0.10)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  padding: '24px',
  marginBottom: '20px',
};

const neonText = { color: '#00ff99', textShadow: '0 0 8px #00ff99, 0 0 16px #a020f0' };
const labelStyle = { color: '#a0aec0', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' };
const valueStyle = { color: '#fff', fontSize: '1.4rem', fontWeight: 700 };

const DEMO_STATS = [
  { label: 'Total Profit', value: '4.312 SOL', sub: '+12.4% this week' },
  { label: 'Executions', value: '147', sub: '98.6% success rate' },
  { label: 'Wallet Balance', value: '23.87 SOL', sub: '≈ $3,812 USD' },
  { label: 'Active Bots', value: '3', sub: 'Turbo · Ninja · Sniper' },
];

const DEMO_ACTIVITY = [
  { id: 'exec_001', time: '2 min ago', type: 'Flashloan', profit: '+0.042 SOL', status: 'success', provider: 'Raydium' },
  { id: 'exec_002', time: '11 min ago', type: 'Arbitrage', profit: '+0.018 SOL', status: 'success', provider: 'Orca' },
  { id: 'exec_003', time: '34 min ago', type: 'Flashloan', profit: '-', status: 'skipped', provider: 'Jupiter' },
  { id: 'exec_004', time: '1 hr ago', type: 'Flashloan', profit: '+0.097 SOL', status: 'success', provider: 'Raydium' },
  { id: 'exec_005', time: '3 hr ago', type: 'Arbitrage', profit: '+0.034 SOL', status: 'success', provider: 'Meteora' },
];

const widgets = [
  <div>💼 Portfolio Widget</div>,
  <div>📈 Profit Chart</div>,
  <div>🔔 Notifications</div>,
  <div>⚡ Quick Execute</div>,
];

export default function UserPanel() {
  const [address] = useState('4xK8...m9Pq');
  const notifications = [
    { id: 1, msg: 'New arbitrage opportunity detected on Raydium', time: '1 min ago' },
    { id: 2, msg: 'Daily profit milestone reached: 0.5 SOL', time: '2 hr ago' },
  ];

  return (
    <CoreDashboardLayout title="User Dashboard" widgets={widgets} chat={<span style={neonText}>💬 AI Assistant</span>}>
      <div style={{ color: '#e2e8f0', fontFamily: "'Montserrat', sans-serif" }}>

        {/* Profile Banner */}
        <div style={{ ...glassCard, display: 'flex', alignItems: 'center', gap: '20px', background: 'linear-gradient(135deg, rgba(10,0,30,0.85) 0%, rgba(30,0,60,0.85) 100%)' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'linear-gradient(135deg, #a020f0, #00ff99)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', boxShadow: '0 0 20px #a020f0',
          }}>👤</div>
          <div>
            <div style={{ ...neonText, fontSize: '1.2rem', fontWeight: 700 }}>Solana Trader</div>
            <div style={{ color: '#a0aec0', fontSize: '0.85rem', marginTop: 4 }}>
              🔗 {address} <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(address)}
                style={{ marginLeft: 8, color: '#00ff99', cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontSize: 'inherit' }}
                aria-label="Copy wallet address"
              >📋 Copy</button>
            </div>
            <div style={{ marginTop: 6 }}>
              <span style={{ background: 'rgba(0,255,153,0.15)', color: '#00ff99', borderRadius: 6, padding: '2px 10px', fontSize: '0.75rem' }}>✅ Verified</span>
              <span style={{ background: 'rgba(160,32,240,0.15)', color: '#a020f0', borderRadius: 6, padding: '2px 10px', fontSize: '0.75rem', marginLeft: 6 }}>⭐ Pro Plan</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          {DEMO_STATS.map((s) => (
            <div key={s.label} style={glassCard}>
              <div style={labelStyle}>{s.label}</div>
              <div style={valueStyle}>{s.value}</div>
              <div style={{ color: '#00ff99', fontSize: '0.78rem', marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div style={glassCard}>
          <div style={{ ...neonText, fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>⚡ Recent Activity</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ color: '#a0aec0', borderBottom: '1px solid rgba(0,255,153,0.12)' }}>
                {['ID', 'Time', 'Type', 'Provider', 'Profit', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEMO_ACTIVITY.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px 10px', color: '#a0aec0' }}>{row.id}</td>
                  <td style={{ padding: '8px 10px', color: '#718096' }}>{row.time}</td>
                  <td style={{ padding: '8px 10px', color: '#e2e8f0' }}>{row.type}</td>
                  <td style={{ padding: '8px 10px', color: '#a020f0' }}>{row.provider}</td>
                  <td style={{ padding: '8px 10px', color: row.profit.startsWith('+') ? '#00ff99' : '#718096', fontWeight: 600 }}>{row.profit}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{
                      background: row.status === 'success' ? 'rgba(0,255,153,0.12)' : 'rgba(113,128,150,0.12)',
                      color: row.status === 'success' ? '#00ff99' : '#718096',
                      borderRadius: 6, padding: '2px 8px', fontSize: '0.75rem',
                    }}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Notifications */}
        <div style={glassCard}>
          <div style={{ ...neonText, fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>🔔 Notifications</div>
          {notifications.length === 0 && <div style={{ color: '#718096' }}>No new notifications</div>}
          {notifications.map((n) => (
            <div key={n.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', marginBottom: '8px',
              background: 'rgba(255,255,255,0.04)', borderRadius: '10px',
              border: '1px solid rgba(0,255,153,0.08)',
            }}>
              <span style={{ color: '#e2e8f0', fontSize: '0.88rem' }}>{n.msg}</span>
              <span style={{ color: '#718096', fontSize: '0.75rem', marginLeft: 16 }}>{n.time}</span>
            </div>
          ))}
        </div>

        {/* Account Settings */}
        <div style={glassCard}>
          <div style={{ ...neonText, fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>⚙️ Account Settings</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {['Change Password', 'Export History', 'API Access', 'Disconnect Wallet'].map(action => (
              <button key={action} style={{
                background: 'rgba(160,32,240,0.12)', color: '#e2e8f0',
                border: '1px solid rgba(160,32,240,0.25)', borderRadius: '10px',
                padding: '10px 16px', cursor: 'pointer', fontSize: '0.88rem',
                transition: 'all 0.2s',
              }}>{action}</button>
            ))}
          </div>
        </div>

      </div>
    </CoreDashboardLayout>
  );
}
