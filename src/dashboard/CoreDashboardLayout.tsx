import React from 'react';
import './CoreDashboardLayout.css';
import Link from 'next/link';

export default function CoreDashboardLayout({ title, children, widgets, chat }) {
  return (
    <div className="core-dashboard">
      <aside className="core-dashboard-sidebar">
        <nav>
          <ul className="core-dashboard-menu">
            <li><Link href="/dashboard">Dashboard</Link></li>
            <li><Link href="/admin">Admin</Link></li>
            <li><Link href="/arbitrage">Arbitrage</Link></li>
            <li><Link href="/analytics">Analytics</Link></li>
            <li><Link href="/tokens">Tokens</Link></li>
            <li><Link href="/market">Market</Link></li>
            <li><Link href="/profile">Profile</Link></li>
            <li><Link href="/user">User</Link></li>
          </ul>
        </nav>
      </aside>
      <div className="core-dashboard-main">
        <header className="core-dashboard-header">{title}</header>
        {widgets && (
          <div className="core-dashboard-widgets">
            {widgets.map((widget, i) => (
              <div className="core-dashboard-widget" key={i}>{widget}</div>
            ))}
          </div>
        )}
        <main>{children}</main>
        <div className="core-dashboard-chat">
          {chat || <span>Chat placeholder: Integrate chat here.</span>}
        </div>
      </div>
    </div>
  );
}
