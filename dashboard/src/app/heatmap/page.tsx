'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { fetchPages, fetchHeatmapData, type PageInfo, type ClickData } from '@/lib/api';

export default function HeatmapPage() {
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [clicks, setClicks] = useState<ClickData[]>([]);
  const [loading, setLoading] = useState(true);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredClick, setHoveredClick] = useState<ClickData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load page URLs on mount
  useEffect(() => {
    async function loadPages() {
      try {
        const data = await fetchPages();
        setPages(data.pages);
        if (data.pages.length > 0) {
          setSelectedPage(data.pages[0].page_url);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load pages');
      } finally {
        setLoading(false);
      }
    }
    loadPages();
  }, []);

  // Load heatmap data when page is selected
  useEffect(() => {
    if (!selectedPage) return;

    async function loadHeatmap() {
      setHeatmapLoading(true);
      try {
        const data = await fetchHeatmapData(selectedPage);
        setClicks(data.clicks);
      } catch (err: unknown) {
        console.error('Heatmap error:', err);
      } finally {
        setHeatmapLoading(false);
      }
    }
    loadHeatmap();
  }, [selectedPage]);

  const getHeatmapDotStyle = useCallback(
    (click: ClickData, index: number) => {
      const container = containerRef.current;
      if (!container) return { display: 'none' };

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Normalize coordinates to container dimensions
      const vw = click.viewport_width || 1920;
      const vh = click.viewport_height || 900;

      const x = (click.click_x / vw) * containerWidth;
      const y = (click.click_y / vh) * containerHeight;

      // Determine intensity based on nearby clicks
      const nearby = clicks.filter((c) => {
        const cx = (c.click_x / (c.viewport_width || 1920)) * containerWidth;
        const cy = (c.click_y / (c.viewport_height || 900)) * containerHeight;
        const dist = Math.sqrt((cx - x) ** 2 + (cy - y) ** 2);
        return dist < 40;
      }).length;

      const intensity = Math.min(nearby / 5, 1);
      const size = 24 + intensity * 30;

      // Color gradient from blue → yellow → red based on density
      let color: string;
      if (intensity < 0.3) {
        color = `rgba(96, 165, 250, ${0.4 + intensity})`;
      } else if (intensity < 0.6) {
        color = `rgba(251, 191, 36, ${0.5 + intensity * 0.5})`;
      } else {
        color = `rgba(248, 113, 113, ${0.6 + intensity * 0.4})`;
      }

      return {
        left: `${x}px`,
        top: `${y}px`,
        width: `${size}px`,
        height: `${size}px`,
        background: `radial-gradient(circle, ${color} 0%, ${color.replace(/[\d.]+\)$/, '0.15)')} 50%, transparent 70%)`,
        animationDelay: `${index * 0.05}s`,
      };
    },
    [clicks]
  );

  const selectedPageInfo = pages.find((p) => p.page_url === selectedPage);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="topbar">
          <div>
            <h1 className="topbar-title">Click Heatmap</h1>
            <p className="topbar-subtitle">
              Visualize where users click on your pages
            </p>
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
          ) : pages.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📭</div>
              <h3>No Page Data Yet</h3>
              <p>Visit the demo page and click around to generate heatmap data.</p>
            </div>
          ) : (
            <>
              {/* ─── Page Selector ──────────────── */}
              <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 300px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Select Page
                    </label>
                    <select
                      className="custom-select"
                      value={selectedPage}
                      onChange={(e) => setSelectedPage(e.target.value)}
                    >
                      {pages.map((page) => (
                        <option key={page.page_url} value={page.page_url}>
                          {page.page_url}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedPageInfo && (
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-light)' }}>
                          {selectedPageInfo.total_clicks}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          CLICKS
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--info)' }}>
                          {selectedPageInfo.total_page_views}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          VIEWS
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--success)' }}>
                          {selectedPageInfo.total_events}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          TOTAL
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ─── Heatmap Legend ─────────────── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 600 }}>Density:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(96, 165, 250, 0.6)' }} />
                  <span>Low</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(251, 191, 36, 0.7)' }} />
                  <span>Medium</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(248, 113, 113, 0.8)' }} />
                  <span>High</span>
                </div>
                <span style={{ marginLeft: 'auto' }}>
                  {clicks.length} click{clicks.length !== 1 ? 's' : ''} plotted
                </span>
              </div>

              {/* ─── Heatmap Visualization ──────── */}
              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">Click Position Map</div>
                    <div className="card-subtitle">
                      Each dot represents a user click — hover for details
                    </div>
                  </div>
                </div>
                <div style={{ padding: '16px' }}>
                  {heatmapLoading ? (
                    <div className="loading-spinner">
                      <div className="spinner" />
                    </div>
                  ) : clicks.length === 0 ? (
                    <div className="empty-state">
                      <div className="icon">👆</div>
                      <h3>No Clicks Recorded</h3>
                      <p>No click events found for this page. Visit the page and click around!</p>
                    </div>
                  ) : (
                    <div
                      ref={containerRef}
                      className="heatmap-container"
                      style={{ height: '600px' }}
                    >
                      <div className="heatmap-overlay" />
                      {clicks.map((click, i) => (
                        <div
                          key={i}
                          className="heatmap-dot"
                          style={getHeatmapDotStyle(click, i)}
                          onMouseEnter={() => setHoveredClick(click)}
                          onMouseLeave={() => setHoveredClick(null)}
                        />
                      ))}

                      {/* Tooltip */}
                      {hoveredClick && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '16px',
                            left: '16px',
                            background: 'rgba(14, 14, 24, 0.95)',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '12px 16px',
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            backdropFilter: 'blur(10px)',
                            zIndex: 10,
                            minWidth: '200px',
                          }}
                        >
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                            Click Details
                          </div>
                          <div>📍 Position: ({hoveredClick.click_x}, {hoveredClick.click_y})</div>
                          {hoveredClick.element_tag && (
                            <div>🏷️ Element: &lt;{hoveredClick.element_tag}&gt;</div>
                          )}
                          {hoveredClick.element_text && (
                            <div>📝 Text: &quot;{hoveredClick.element_text.substring(0, 50)}&quot;</div>
                          )}
                          <div>🕐 {new Date(hoveredClick.timestamp).toLocaleString()}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ─── Click Data Table ──────────── */}
              {clicks.length > 0 && (
                <div className="card" style={{ marginTop: '24px' }}>
                  <div className="card-header">
                    <div>
                      <div className="card-title">Click Details</div>
                      <div className="card-subtitle">Raw click event data for this page</div>
                    </div>
                    <span className="tag tag-accent">{clicks.length} clicks</span>
                  </div>
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>X</th>
                          <th>Y</th>
                          <th>Viewport</th>
                          <th>Element</th>
                          <th>Text</th>
                          <th>Session</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clicks.slice(0, 50).map((click, i) => (
                          <tr key={i}>
                            <td style={{ color: 'var(--text-dim)' }}>{i + 1}</td>
                            <td>{click.click_x}</td>
                            <td>{click.click_y}</td>
                            <td>
                              {click.viewport_width && click.viewport_height
                                ? `${click.viewport_width}×${click.viewport_height}`
                                : '—'}
                            </td>
                            <td>
                              {click.element_tag ? (
                                <span className="tag tag-info">&lt;{click.element_tag}&gt;</span>
                              ) : '—'}
                            </td>
                            <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {click.element_text || '—'}
                            </td>
                            <td>
                              <span className="session-id" style={{ fontSize: '10px' }}>
                                {click.session_id.substring(0, 16)}…
                              </span>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              {new Date(click.timestamp).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
