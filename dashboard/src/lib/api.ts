const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Session {
  session_id: string;
  total_events: number;
  page_views: number;
  clicks: number;
  first_event: string;
  last_event: string;
  duration_seconds: number;
  pages_count: number;
}

export interface EventData {
  _id: string;
  session_id: string;
  event_type: 'page_view' | 'click';
  page_url: string;
  timestamp: string;
  click_x: number | null;
  click_y: number | null;
  viewport_width: number | null;
  viewport_height: number | null;
  element_tag: string | null;
  element_text: string | null;
}

export interface ClickData {
  click_x: number;
  click_y: number;
  viewport_width: number | null;
  viewport_height: number | null;
  element_tag: string | null;
  element_text: string | null;
  timestamp: string;
  session_id: string;
}

export interface PageInfo {
  page_url: string;
  total_events: number;
  total_clicks: number;
  total_page_views: number;
}

// Fetch all sessions with event counts
export async function fetchSessions(): Promise<{ sessions: Session[]; total: number }> {
  const res = await fetch(`${API_BASE}/sessions`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
}

// Fetch events for a specific session
export async function fetchSessionEvents(sessionId: string): Promise<{
  session_id: string;
  total_events: number;
  events: EventData[];
}> {
  const res = await fetch(`${API_BASE}/sessions/${encodeURIComponent(sessionId)}/events`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch session events');
  return res.json();
}

// Fetch click data for heatmap
export async function fetchHeatmapData(pageUrl: string): Promise<{
  page_url: string;
  total_clicks: number;
  clicks: ClickData[];
}> {
  const res = await fetch(`${API_BASE}/heatmap?page=${encodeURIComponent(pageUrl)}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch heatmap data');
  return res.json();
}

// Fetch distinct page URLs
export async function fetchPages(): Promise<{ pages: PageInfo[]; total: number }> {
  const res = await fetch(`${API_BASE}/pages`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch pages');
  return res.json();
}
