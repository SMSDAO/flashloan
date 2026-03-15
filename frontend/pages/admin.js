import { useState, useRef } from 'react';
import CoreDashboardLayout from '../components/CoreDashboardLayout';

const glassCard = {
  background: 'rgba(10, 0, 30, 0.72)',
  border: '1px solid rgba(160, 32, 240, 0.20)',
  borderRadius: '18px',
  boxShadow: '0 0 32px 4px rgba(160,32,240,0.10), 0 0 64px 8px rgba(0,255,153,0.06)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  padding: '24px',
  marginBottom: '20px',
};

const neonPurple = { color: '#a020f0', textShadow: '0 0 8px #a020f0, 0 0 16px #00ff99' };
const labelStyle = { color: '#a0aec0', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' };
const valueStyle = { color: '#fff', fontSize: '1.4rem', fontWeight: 700 };

const SYSTEM_STATS = [
  { label: 'Total Users', value: '1,284', icon: '👥', delta: '+8 today' },
  { label: 'System Uptime', value: '99.97%', icon: '🟢', delta: '31 days' },
  { label: 'Total Volume', value: '14,230 SOL', icon: '📊', delta: '+340 SOL today' },
  { label: 'Active Bots', value: '7 / 10', icon: '🤖', delta: '3 idle' },
];

const USERS = [
  { id: 'u001', name: 'alice.sol', role: 'User', status: 'active', joined: '2025-01-12' },
  { id: 'u002', name: 'bob.sol', role: 'Developer', status: 'active', joined: '2025-02-03' },
  { id: 'u003', name: 'carol.sol', role: 'Auditor', status: 'suspended', joined: '2025-03-01' },
  { id: 'u004', name: 'admin.sol', role: 'Admin', status: 'active', joined: '2024-12-01' },
];

const AUDIT_LOGS = [
  { ts: '2026-03-14 22:51', user: 'admin.sol', action: 'Updated JITO tip settings', level: 'info' },
  { ts: '2026-03-14 21:30', user: 'bob.sol', action: 'Executed flashloan (0.8 SOL)', level: 'info' },
  { ts: '2026-03-14 20:12', user: 'carol.sol', action: 'Failed login attempt (×3)', level: 'warn' },
  { ts: '2026-03-14 18:05', user: 'alice.sol', action: 'Withdrew 2.0 SOL', level: 'info' },
];

const ROLE_COLORS = { Admin: '#a020f0', Developer: '#00ff99', User: '#63b3ed', Auditor: '#f6ad55' };

const widgets = [
  <div>🏊 Pool Monitor</div>,
  <div>💰 Wallet Monitor</div>,
  <div>🚀 Token Launcher</div>,
  <div>📡 On-chain Scoring</div>,
  <div>🔌 DAO-Fi Plugin Selector</div>,
  <div>🥷 Ninja Bot Control</div>,
  <div>🎯 Sniper Bot Control</div>,
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const tabRefs = useRef([]);

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'users', label: '👥 Users' },
    { id: 'audit', label: '📋 Audit Log' },
    { id: 'config', label: '⚙️ Config' },
  ];

  // Keyboard navigation: arrow keys move focus between tabs
  const handleTabKeyDown = (e, index) => {
    let next = index;
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    setActiveTab(tabs[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <CoreDashboardLayout title="Admin Dashboard" widgets={widgets} chat={<span style={neonPurple}>🛡️ Admin Console</span>}>
      <div style={{ color: '#e2e8f0', fontFamily: "'Montserrat', sans-serif" }}>

        {/* Tab Navigation - accessible tablist */}
        <div
          role="tablist"
          aria-label="Admin dashboard sections"
          style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}
        >
          {tabs.map((t, i) => (
            <button
              key={t.id}
              ref={el => { tabRefs.current[i] = el; }}
              role="tab"
              aria-selected={activeTab === t.id}
              aria-controls={`tabpanel-${t.id}`}
              id={`tab-${t.id}`}
              tabIndex={activeTab === t.id ? 0 : -1}
              onClick={() => setActiveTab(t.id)}
              onKeyDown={e => handleTabKeyDown(e, i)}
              style={{
                background: activeTab === t.id ? 'linear-gradient(135deg, #a020f0, #00ff99)' : 'rgba(255,255,255,0.05)',
                color: activeTab === t.id ? '#fff' : '#a0aec0',
                border: activeTab === t.id ? 'none' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', padding: '8px 18px', cursor: 'pointer',
                fontWeight: activeTab === t.id ? 700 : 400, fontSize: '0.88rem',
                boxShadow: activeTab === t.id ? '0 0 16px rgba(160,32,240,0.4)' : 'none',
                transition: 'all 0.2s',
              }}
            >{t.label}</button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div role="tabpanel" id="tabpanel-overview" aria-labelledby="tab-overview">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              {SYSTEM_STATS.map(s => (
                <div key={s.label} style={glassCard}>
                  <div style={{ fontSize: '1.6rem', marginBottom: '8px' }}>{s.icon}</div>
                  <div style={labelStyle}>{s.label}</div>
                  <div style={valueStyle}>{s.value}</div>
                  <div style={{ color: '#00ff99', fontSize: '0.78rem', marginTop: 4 }}>{s.delta}</div>
                </div>
              ))}
            </div>

            {/* System Status */}
            <div style={glassCard}>
              <div style={{ ...neonPurple, fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>🖥️ System Status</div>
              {[
                { name: 'Backend API', status: 'online', latency: '12ms' },
                { name: 'Solana RPC (Helius)', status: 'online', latency: '45ms' },
                { name: 'Jito Bundle Engine', status: 'online', latency: '88ms' },
                { name: 'Database (SQLite)', status: 'online', latency: '2ms' },
                { name: 'WebSocket Server', status: 'online', latency: '6ms' },
              ].map(svc => (
                <div key={svc.name} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <span style={{ color: '#e2e8f0' }}>{svc.name}</span>
                  <span>
                    <span style={{ color: '#00ff99', marginRight: 12 }}>● {svc.status}</span>
                    <span style={{ color: '#718096', fontSize: '0.8rem' }}>{svc.latency}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div role="tabpanel" id="tabpanel-users" aria-labelledby="tab-users" style={glassCard}>
            <div style={{ ...neonPurple, fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>👥 User Management</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ color: '#a0aec0', borderBottom: '1px solid rgba(160,32,240,0.15)' }}>
                  {['ID', 'Username', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {USERS.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 12px', color: '#718096' }}>{u.id}</td>
                    <td style={{ padding: '10px 12px', color: '#e2e8f0', fontWeight: 600 }}>{u.name}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        background: `${ROLE_COLORS[u.role]}22`,
                        color: ROLE_COLORS[u.role],
                        borderRadius: 6, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700,
                      }}>{u.role}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        background: u.status === 'active' ? 'rgba(0,255,153,0.12)' : 'rgba(245,101,101,0.12)',
                        color: u.status === 'active' ? '#00ff99' : '#fc8181',
                        borderRadius: 6, padding: '2px 8px', fontSize: '0.75rem',
                      }}>{u.status}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#718096' }}>{u.joined}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <button style={{
                        background: 'rgba(160,32,240,0.14)', color: '#a020f0',
                        border: '1px solid rgba(160,32,240,0.3)', borderRadius: 6,
                        padding: '3px 10px', cursor: 'pointer', fontSize: '0.78rem', marginRight: 4,
                      }}>Edit</button>
                      <button style={{
                        background: 'rgba(245,101,101,0.10)', color: '#fc8181',
                        border: '1px solid rgba(245,101,101,0.25)', borderRadius: 6,
                        padding: '3px 10px', cursor: 'pointer', fontSize: '0.78rem',
                      }}>Suspend</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Audit Log Tab */}
        {activeTab === 'audit' && (
          <div role="tabpanel" id="tabpanel-audit" aria-labelledby="tab-audit" style={glassCard}>
            <div style={{ ...neonPurple, fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>📋 Audit Trail</div>
            {AUDIT_LOGS.map((log, i) => (
              <div key={i} style={{
                display: 'flex', gap: '12px', alignItems: 'flex-start',
                padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <span style={{ color: log.level === 'warn' ? '#f6ad55' : '#00ff99', fontSize: '0.85rem', minWidth: 24 }}>
                  {log.level === 'warn' ? '⚠️' : 'ℹ️'}
                </span>
                <div>
                  <div style={{ color: '#e2e8f0', fontSize: '0.88rem' }}>
                    <span style={{ color: '#a020f0', fontWeight: 600 }}>{log.user}</span> — {log.action}
                  </div>
                  <div style={{ color: '#718096', fontSize: '0.75rem', marginTop: 2 }}>{log.ts}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Config Tab */}
        {activeTab === 'config' && (
          <div role="tabpanel" id="tabpanel-config" aria-labelledby="tab-config" style={glassCard}>
            <div style={{ ...neonPurple, fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>⚙️ System Configuration</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { key: 'Min Profit Threshold', val: '0.001 SOL' },
                { key: 'Max Slippage', val: '0.5%' },
                { key: 'Jito Tip (lamports)', val: '10,000' },
                { key: 'Rate Limit (req/min)', val: '100' },
                { key: 'Execution Timeout', val: '30s' },
                { key: 'RPC Fallback', val: 'Enabled' },
              ].map(cfg => (
                <div key={cfg.key} style={{
                  background: 'rgba(255,255,255,0.04)', borderRadius: '10px',
                  border: '1px solid rgba(160,32,240,0.12)', padding: '14px',
                }}>
                  <div style={labelStyle}>{cfg.key}</div>
                  <div style={{ color: '#00ff99', fontSize: '1.05rem', fontWeight: 600 }}>{cfg.val}</div>
                </div>
              ))}
            </div>
            <button style={{
              marginTop: '18px', background: 'linear-gradient(135deg, #a020f0, #00ff99)',
              color: '#fff', border: 'none', borderRadius: '10px',
              padding: '10px 28px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
              boxShadow: '0 0 20px rgba(160,32,240,0.4)',
            }}>Save Configuration</button>
          </div>
        )}

      </div>
    </CoreDashboardLayout>
  );
}
