'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { fetchSessions, type Session } from '@/lib/api';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadSessions() {
      try {
        const data = await fetchSessions();
        setSessions(data.sessions);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load sessions');
      } finally {
        setLoading(false);
      }
    }
    loadSessions();
  }, []);

  const filteredSessions = sessions.filter((s) =>
    s.session_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="topbar">
          <div>
            <h1 className="topbar-title">Sessions</h1>
            <p className="topbar-subtitle">
              {sessions.length} total sessions tracked
            </p>
          </div>
          <div className="topbar-actions">
            <input
              type="text"
              className="custom-select"
              placeholder="🔍 Search session ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '260px' }}
            />
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
          ) : filteredSessions.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📭</div>
              <h3>{searchTerm ? 'No Matching Sessions' : 'No Sessions Yet'}</h3>
              <p>
                {searchTerm
                  ? 'Try a different search term.'
                  : 'Open the demo page and interact with it to generate session data.'}
              </p>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">All Sessions</div>
                  <div className="card-subtitle">
                    Click a session to view the user journey
                  </div>
                </div>
                <span className="tag tag-accent">
                  {filteredSessions.length} sessions
                </span>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Session ID</th>
                      <th>Total Events</th>
                      <th>Page Views</th>
                      <th>Clicks</th>
                      <th>Pages</th>
                      <th>Duration</th>
                      <th>Started</th>
                      <th>Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.map((session) => (
                      <tr key={session.session_id}>
                        <td>
                          <Link
                            href={`/sessions/${encodeURIComponent(session.session_id)}`}
                          >
                            <span className="session-id">
                              {session.session_id.length > 28
                                ? session.session_id.substring(0, 28) + '…'
                                : session.session_id}
                            </span>
                          </Link>
                        </td>
                        <td>
                          <span className="tag tag-accent">
                            {session.total_events}
                          </span>
                        </td>
                        <td>
                          <span className="tag tag-info">
                            {session.page_views}
                          </span>
                        </td>
                        <td>
                          <span className="tag tag-success">
                            {session.clicks}
                          </span>
                        </td>
                        <td>{session.pages_count}</td>
                        <td>{formatDuration(session.duration_seconds)}</td>
                        <td>{formatDate(session.first_event)}</td>
                        <td>{formatDate(session.last_event)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
