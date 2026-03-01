import React, { useState } from 'react';

export default function WalletLogin() {
  const [connected, setConnected] = useState(false);

  function handleConnect() {
    setConnected(true);
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      {connected ? (
        <div style={{ color: '#00ff99', fontWeight: 'bold' }}>
          Wallet Connected!
        </div>
      ) : (
        <button
          style={{
            background: 'linear-gradient(90deg,#a020f0,#00ff99)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 32px',
            fontSize: '1.2rem',
            cursor: 'pointer',
            boxShadow: '0 0 10px #a020f0, 0 0 20px #00ff99',
          }}
          onClick={handleConnect}
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}
