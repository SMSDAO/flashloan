import React from 'react';
import CoreDashboardLayout from '../../src/dashboard/CoreDashboardLayout';

const widgets = [
  <div>Pool Monitor Widget</div>,
  <div>Wallet Monitor Widget</div>,
  <div>Token Launcher Widget</div>,
  <div>On-chain Scoring Widget</div>,
  <div>DAO-Fi Plugin Selector (Auto-update)</div>,
  <div>Ninja Bot Status & Control</div>,
  <div>Sniper Bot Status & Control</div>
];

export default function AdminPanel() {
  return (
    <CoreDashboardLayout title="Admin Panel" widgets={widgets} chat={<span>Admin Chat Placeholder</span>}>
      <div>Admin Panel - Manage flashloan strategies, users, and analytics.</div>
    </CoreDashboardLayout>
  );
}
