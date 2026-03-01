import '../styles/neo-glow.css';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Initialize socket connection
let socket;

function MyApp({ Component, pageProps }) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const socketUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    socket = io(socketUrl);

    socket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <>
      <div className="app-wrapper">
        {/* Connection Status Indicator */}
        <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
          <div className="status-dot"></div>
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>

        <Component {...pageProps} socket={socket} />
      </div>

      <style jsx>{`
        .app-wrapper {
          min-height: 100vh;
          position: relative;
        }

        .connection-status {
          position: fixed;
          top: 20px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(20, 20, 45, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          font-size: 0.875rem;
          z-index: 1000;
          transition: all 0.3s ease;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        .connected .status-dot {
          background: var(--color-success);
          box-shadow: 0 0 10px var(--color-success);
        }

        .disconnected .status-dot {
          background: var(--color-error);
          box-shadow: 0 0 10px var(--color-error);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
}
export default MyApp;
