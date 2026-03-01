import Head from 'next/head';
import WalletLogin from '../components/WalletLogin';

export default function Home() {
  return (
    <>
      <Head>
        <title>Crypto Factory Dashboard</title>
      </Head>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle, #0a001a 0%, #1a0033 100%)',
        color: '#fff',
        fontFamily: 'Montserrat, Arial, sans-serif',
      }}>
        <header style={{
          width: '100%',
          padding: '16px',
          textAlign: 'center',
          background: 'linear-gradient(90deg, #a020f0, #00ff99)',
          boxShadow: '0 0 20px #00ff99',
          fontSize: '1.5rem',
          fontWeight: 'bold',
        }}>
          Crypto Factory - Admin Dashboard
        </header>
        <nav style={{
          display: 'flex',
          justifyContent: 'space-around',
          width: '100%',
          padding: '16px',
          background: 'rgba(0, 0, 0, 0.8)',
          boxShadow: '0 0 20px #a020f0',
        }}>
          <a href="#" style={{color: '#00ff99', textDecoration: 'none'}}>Home</a>
          <a href="#" style={{color: '#00ff99', textDecoration: 'none'}}>Market</a>
          <a href="#" style={{color: '#00ff99', textDecoration: 'none'}}>Wallet</a>
          <a href="#" style={{color: '#00ff99', textDecoration: 'none'}}>Donations</a>
        </nav>
        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <WalletLogin />
          <div style={{
            marginTop: '32px',
            padding: '24px',
            borderRadius: '16px',
            background: 'rgba(30, 0, 60, 0.85)',
            boxShadow: '0 0 40px #a020f0, 0 0 80px #00ff99',
          }}>
            <h2 style={{color: '#00ff99', textShadow: '0 0 10px #a020f0'}}>Admin Wallet</h2>
            <p>Manage donations, interact with Solana, and monitor DeFi swaps.</p>
          </div>
        </main>
        <footer style={{
          width: '100%',
          padding: '16px',
          textAlign: 'center',
          background: 'linear-gradient(90deg, #00ff99, #a020f0)',
          boxShadow: '0 0 20px #a020f0',
        }}>
          © 2025 Crypto Factory
        </footer>
      </div>
    </>
  );
}
