'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { fetchSessions, fetchPages, type Session, type PageInfo } from '@/lib/api';
import Link from 'next/link';

export default function OverviewPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [sessData, pageData] = await Promise.all([
          fetchSessions(),
          fetchPages(),
        ]);
        setSessions(sessData.sessions);
        setPages(pageData.pages);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load data. Is the backend running?');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalEvents = sessions.reduce((sum, s) => sum + s.total_events, 0);
  const totalClicks = sessions.reduce((sum, s) => sum + s.clicks, 0);
  const totalPageViews = sessions.reduce((sum, s) => sum + s.page_views, 0);
  const avgEventsPerSession = sessions.length > 0
    ? Math.round(totalEvents / sessions.length)
    : 0;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="topbar">
          <div>
            <h1 className="topbar-title">Dashboard Overview</h1>
            <p className="topbar-subtitle">Real-time user analytics at a glance</p>
          </div>
          <div className="topbar-actions">
            <Link href="/sessions" className="btn btn-secondary btn-sm">
              View Sessions →
            </Link>
            <Link href="/heatmap" className="btn btn-primary btn-sm">
              🔥 Heatmap
            </Link>
          </div>
        </div>

        <div className="page-content">
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner" />
            </div>
          ) : error ? (
            <div className="empty-state">
              <div className="icon">⚠️</div>
              <h3>Connection Error</h3>
              <p>{error}</p>
            </div>
          ) : (
            <>
              {/* ─── Stats Grid ──────────────────── */}
              <div className="stats-grid">
                <div className="stat-card accent">
                  <div className="stat-icon">👤</div>
                  <div className="stat-value">{sessions.length}</div>
                  <div className="stat-label">Total Sessions</div>
                </div>
                <div className="stat-card success">
                  <div className="stat-icon">⚡</div>
                  <div className="stat-value">{totalEvents.toLocaleString()}</div>
                  <div className="stat-label">Total Events</div>
                </div>
                <div className="stat-card warning">
                  <div className="stat-icon">👆</div>
                  <div className="stat-value">{totalClicks.toLocaleString()}</div>
                  <div className="stat-label">Total Clicks</div>
                </div>
                <div className="stat-card info">
                  <div className="stat-icon">📄</div>
                  <div className="stat-value">{totalPageViews.toLocaleString()}</div>
                  <div className="stat-label">Page Views</div>
                </div>
              </div>

              {/* ─── Quick Stats Row ────────────── */}
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                <div className="stat-card accent">
                  <div className="stat-value">{avgEventsPerSession}</div>
                  <div className="stat-label">Avg Events / Session</div>
                </div>
                <div className="stat-card success">
                  <div className="stat-value">{pages.length}</div>
                  <div className="stat-label">Unique Pages Tracked</div>
                </div>
              </div>

              {/* ─── Recent Sessions ─────────────── */}
              <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header">
                  <div>
                    <div className="card-title">Recent Sessions</div>
                    <div className="card-subtitle">Latest user sessions with activity</div>
                  </div>
                  <Link href="/sessions" className="btn btn-ghost btn-sm">
                    View All →
                  </Link>
                </div>
                <div className="table-wrapper">
                  {sessions.length > 0 ? (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Session ID</th>
                          <th>Events</th>
                          <th>Page Views</th>
                          <th>Clicks</th>
                          <th>Duration</th>
                          <th>Started</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.slice(0, 5).map((session) => (
                          <tr key={session.session_id}>
                            <td>
                              <Link href={`/sessions/${encodeURIComponent(session.session_id)}`}>
                                <span className="session-id">
                                  {session.session_id.length > 24
                                    ? session.session_id.substring(0, 24) + '…'
                                    : session.session_id}
                                </span>
                              </Link>
                            </td>
                            <td>
                              <span className="tag tag-accent">{session.total_events}</span>
                            </td>
                            <td>{session.page_views}</td>
                            <td>{session.clicks}</td>
                            <td>{formatDuration(session.duration_seconds)}</td>
                            <td>{formatDate(session.first_event)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-state">
                      <div className="icon">📭</div>
                      <h3>No Sessions Yet</h3>
                      <p>Open the demo page to start generating tracking data.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ─── Top Pages ────────────────────── */}
              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">Top Pages</div>
                    <div className="card-subtitle">Most visited pages by event count</div>
                  </div>
                  <Link href="/heatmap" className="btn btn-ghost btn-sm">
                    View Heatmap →
                  </Link>
                </div>
                <div className="table-wrapper">
                  {pages.length > 0 ? (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Page URL</th>
                          <th>Total Events</th>
                          <th>Clicks</th>
                          <th>Page Views</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pages.slice(0, 5).map((page) => (
                          <tr key={page.page_url}>
                            <td style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {page.page_url}
                            </td>
                            <td>
                              <span className="tag tag-accent">{page.total_events}</span>
                            </td>
                            <td>
                              <span className="tag tag-success">{page.total_clicks}</span>
                            </td>
                            <td>
                              <span className="tag tag-info">{page.total_page_views}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-state">
                      <div className="icon">📭</div>
                      <h3>No Page Data Yet</h3>
                      <p>Visit the demo page to generate tracking events.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 1) return '< 1s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
