'use client';

import { Suspense } from 'react';
import SessionDetailContent from './SessionDetailContent';
import Sidebar from '@/components/Sidebar';

export default function SessionDetailPage() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="topbar">
          <div>
            <h1 className="topbar-title">Session Detail</h1>
            <p className="topbar-subtitle">User journey timeline</p>
          </div>
        </div>
        <div className="page-content">
          <Suspense
            fallback={
              <div className="loading-spinner">
                <div className="spinner" />
              </div>
            }
          >
            <SessionDetailContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
