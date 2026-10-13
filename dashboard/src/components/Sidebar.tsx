'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function SidebarNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Overview',
      href: '/',
      icon: '📊',
    },
    {
      label: 'Sessions',
      href: '/sessions',
      icon: '👤',
    },
    {
      label: 'Heatmap',
      href: '/heatmap',
      icon: '🔥',
    },
  ];

  return (
    <>
      <div className="sidebar-label">Navigation</div>

      {navItems.map((item) => {
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}

function SidebarNavFallback() {
  const navItems = [
    { label: 'Overview', icon: '📊' },
    { label: 'Sessions', icon: '👤' },
    { label: 'Heatmap', icon: '🔥' },
  ];

  return (
    <>
      <div className="sidebar-label">Navigation</div>
      {navItems.map((item) => (
        <div key={item.label} className="sidebar-link">
          <span className="icon">{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}
    </>
  );
}

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">CF</div>
        <div>
          <div className="sidebar-brand-text">CausalFunnel</div>
          <div className="sidebar-brand-sub">Analytics Dashboard</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <Suspense fallback={<SidebarNavFallback />}>
          <SidebarNav />
        </Suspense>

        <div className="sidebar-label" style={{ marginTop: '24px' }}>
          Resources
        </div>

        <a
          href="http://localhost:5000/tracking/demo.html"
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-link"
        >
          <span className="icon">🌐</span>
          <span>Demo Page</span>
          <span className="badge">Live</span>
        </a>

        <a
          href="http://localhost:5000/health"
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-link"
        >
          <span className="icon">💚</span>
          <span>API Health</span>
        </a>
      </nav>
    </aside>
  );
}
