import { useState } from 'react';
import CoreDashboardLayout from '../../src/dashboard/CoreDashboardLayout';

const widgets = [
  <div>Scoring Widget</div>,
  <div>Wallet Scanner Widget</div>,
  <div>Pool Scanner Widget</div>,
  <div>Token Scanner Widget</div>
];

export default function Scoring() {
  const [wallet, setWallet] = useState('DemoWallet');
  const [pool, setPool] = useState('DemoPool');
  const [token, setToken] = useState('SOL');
  const [score, setScore] = useState(null);

  const getScore = () => {
    fetch(`/scoring/deep?wallet=${wallet}&pool=${pool}&token=${token}`)
      .then(res => res.json())
      .then(data => setScore(data.score));
  };

  return (
    <CoreDashboardLayout title="Deep Scoring" widgets={widgets} chat={<span>Scoring Chat Placeholder</span>}>
      <div style={{maxWidth:400,margin:'auto',padding:16}}>
        <h2>Deep Scoring</h2>
        <input value={wallet} onChange={e=>setWallet(e.target.value)} placeholder="Wallet" />
        <input value={pool} onChange={e=>setPool(e.target.value)} placeholder="Pool" />
        <input value={token} onChange={e=>setToken(e.target.value)} placeholder="Token" />
        <button onClick={getScore} style={{marginTop:8}}>Get Score</button>
        {score!==null && <div style={{marginTop:16,fontWeight:'bold'}}>Score: {score}</div>}
      </div>
    </CoreDashboardLayout>
  );
}
