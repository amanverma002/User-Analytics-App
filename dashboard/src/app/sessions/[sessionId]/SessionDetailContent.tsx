'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchSessionEvents, type EventData } from '@/lib/api';

export default function SessionDetailContent() {
  const params = useParams();
  const sessionId = decodeURIComponent(params.sessionId as string);

  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await fetchSessionEvents(sessionId);
        setEvents(data.events);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load session events');
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, [sessionId]);

  const pageViews = events.filter((e) => e.event_type === 'page_view').length;
  const clicks = events.filter((e) => e.event_type === 'click').length;

  return (
    <>
      <Link href="/sessions" className="back-link">
        ← Back to Sessions
      </Link>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      ) : error ? (
        <div className="empty-state">
          <div className="icon">⚠️</div>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* ─── Session Stats ──────────────── */}
          <div className="stats-grid" style={{ marginBottom: '28px' }}>
            <div className="stat-card accent">
              <div className="stat-icon">🆔</div>
              <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--accent-light)', wordBreak: 'break-all' }}>
                {sessionId}
              </div>
              <div className="stat-label">Session ID</div>
            </div>
            <div className="stat-card success">
              <div className="stat-icon">⚡</div>
              <div className="stat-value">{events.length}</div>
              <div className="stat-label">Total Events</div>
            </div>
            <div className="stat-card info">
              <div className="stat-icon">📄</div>
              <div className="stat-value">{pageViews}</div>
              <div className="stat-label">Page Views</div>
            </div>
            <div className="stat-card warning">
              <div className="stat-icon">👆</div>
              <div className="stat-value">{clicks}</div>
              <div className="stat-label">Clicks</div>
            </div>
          </div>

          {/* ─── Timeline ──────────────────── */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">User Journey Timeline</div>
                <div className="card-subtitle">
                  Events ordered chronologically from first to last
                </div>
              </div>
              <span className="tag tag-accent">{events.length} events</span>
            </div>
            <div className="card-body">
              <div className="timeline">
                {events.map((event, index) => (
                  <div className="timeline-item" key={event._id || index}>
                    <div className={`timeline-dot ${event.event_type === 'page_view' ? 'page-view' : 'click'}`} />
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-type">
                          {event.event_type === 'page_view' ? (
                            <span className="tag tag-info">📄 Page View</span>
                          ) : (
                            <span className="tag tag-success">👆 Click</span>
                          )}
                        </span>
                        <span className="timeline-time">
                          {formatTime(event.timestamp)}
                        </span>
                      </div>
                      <div className="timeline-details">
                        <div className="timeline-detail">
                          <span>🌐</span>
                          <span style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
                            {event.page_url}
                          </span>
                        </div>
                        {event.event_type === 'click' && (
                          <>
                            <div className="timeline-detail">
                              <span>📍</span>
                              <span>
                                ({event.click_x}, {event.click_y})
                              </span>
                            </div>
                            {event.viewport_width && event.viewport_height && (
                              <div className="timeline-detail">
                                <span>🖥️</span>
                                <span>
                                  {event.viewport_width}×{event.viewport_height}
                                </span>
                              </div>
                            )}
                            {event.element_tag && (
                              <div className="timeline-detail">
                                <span>🏷️</span>
                                <span>
                                  &lt;{event.element_tag}&gt;
                                  {event.element_text
                                    ? ` "${event.element_text.substring(0, 40)}${event.element_text.length > 40 ? '…' : ''}"`
                                    : ''}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
