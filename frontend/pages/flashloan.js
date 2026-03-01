import { useState } from 'react';
import io from 'socket.io-client';
import CoreDashboardLayout from '../../src/dashboard/CoreDashboardLayout';

const widgets = [
  <div>Flashloan Opportunity Widget</div>,
  <div>Auto-Calculation Widget</div>,
  <div>Wallet Scanner Widget</div>,
  <div>Token Scanner Widget</div>,
];

export default function Flashloan() {
  const [result, setResult] = useState(null);
  const socket = io('http://localhost:4000');

  const executeFlashloan = () => {
    socket.emit('flashloan', { amount: 100, token: 'SOL' });
    socket.on('flashloanResult', (data) => {
      setResult(data);
    });
  };

  return (
    <CoreDashboardLayout
      title="Execute Flashloan"
      widgets={widgets}
      chat={<span>Flashloan Chat Placeholder</span>}
    >
      <button onClick={executeFlashloan}>Run Flashloan</button>
      {result && <div>Result: {JSON.stringify(result)}</div>}
    </CoreDashboardLayout>
  );
}
