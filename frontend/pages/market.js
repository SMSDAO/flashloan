import { useEffect, useState } from 'react';
import CoreDashboardLayout from '../../src/dashboard/CoreDashboardLayout';

const widgets = [
  <div>Market Price Widget</div>,
  <div>Gas Estimate Widget</div>,
  <div>Slippage Monitor Widget</div>,
  <div>Wallet Scanner Widget</div>
];

export default function Market() {
  const [prices, setPrices] = useState(null);
  const [estimate, setEstimate] = useState(null);
  useEffect(() => {
    fetch('/market/prices')
      .then(res => res.json())
      .then(setPrices);
    fetch('/market/estimate')
      .then(res => res.json())
      .then(setEstimate);
  }, []);
  return (
    <CoreDashboardLayout title="Live Market Data" widgets={widgets} chat={<span>Market Chat Placeholder</span>}>
      <div>Prices: {prices && JSON.stringify(prices)}</div>
      <div>Gas: {estimate && estimate.gas}</div>
      <div>Slippage: {estimate && estimate.slippage}</div>
    </CoreDashboardLayout>
  );
}
