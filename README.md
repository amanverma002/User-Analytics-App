# 📊 CausalFunnel — User Analytics Application

A full-stack user analytics application that tracks user interactions on a webpage and displays them in a beautiful, real-time dashboard.

![Tech Stack](https://img.shields.io/badge/Node.js-Express-339933?style=flat&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat&logo=mongodb)
![Next.js](https://img.shields.io/badge/Next.js-React-000000?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User's Browser                           │
│                                                                 │
│  ┌──────────────┐     ┌──────────────────────────────────────┐  │
│  │  Demo Page   │     │         Next.js Dashboard            │  │
│  │  (demo.html) │     │  (Sessions View + Heatmap View)      │  │
│  │              │     │                                      │  │
│  │  ┌────────┐  │     └──────────────┬───────────────────────┘  │
│  │  │Tracker │  │                    │                          │
│  │  │  SDK   │  │                    │ GET /api/sessions        │
│  │  └───┬────┘  │                    │ GET /api/sessions/:id    │
│  │      │       │                    │ GET /api/heatmap         │
│  └──────┼───────┘                    │ GET /api/pages           │
│         │ POST /api/events           │                          │
└─────────┼────────────────────────────┼──────────────────────────┘
          │                            │
          ▼                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express.js API Server                         │
│                    (localhost:5000)                              │
│                                                                 │
│  POST /api/events         - Ingest single event                 │
│  POST /api/events/batch   - Ingest batch events                 │
│  GET  /api/sessions       - List sessions with event counts     │
│  GET  /api/sessions/:id   - Get events for a session            │
│  GET  /api/heatmap?page=  - Get click data for heatmap          │
│  GET  /api/pages          - Get distinct page URLs              │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                         MongoDB                                 │
│                 (user_analytics database)                        │
│                                                                 │
│  Events Collection:                                             │
│  { session_id, event_type, page_url, timestamp,                 │
│    click_x, click_y, viewport_width, viewport_height,           │
│    element_tag, element_text }                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Tracking SDK** | Vanilla JavaScript | Lightweight client-side event capture |
| **Backend API** | Node.js + Express | RESTful API for event ingestion & queries |
| **Database** | MongoDB + Mongoose | Document storage with indexing |
| **Dashboard** | Next.js 15 + TypeScript | Interactive analytics UI |
| **Styling** | Vanilla CSS | Custom dark-themed design system |

## 📋 Prerequisites

- **Node.js** >= 18.x
- **MongoDB** >= 6.x (running locally on port 27017)
- **npm** >= 9.x

## 🛠️ Setup Steps

### 1. Clone the Repository

```bash
git clone <repo-url>
cd user-analytics-app
```

### 2. Start MongoDB

Make sure MongoDB is running locally:

```bash
# If using mongod directly
mongod --dbpath /path/to/data

# If using MongoDB as a service (Windows)
net start MongoDB

# If using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 3. Start the Backend Server

```bash
cd backend
npm install
npm run dev
```

The API server will start at `http://localhost:5000`.

### 4. Start the Dashboard

```bash
cd dashboard
npm install
npm run dev
```

The dashboard will start at `http://localhost:3000`.

### 5. Open the Demo Page

Visit `http://localhost:5000/tracking/demo.html` in your browser.

Click around the page to generate tracking events, then visit the dashboard to see the data!

## 📁 Project Structure

```
├── backend/
│   ├── models/
│   │   └── Event.js          # Mongoose schema for events
│   ├── routes/
│   │   └── events.js         # All API route handlers
│   ├── server.js              # Express server entry point
│   ├── .env                   # Environment variables
│   └── package.json
│
├── dashboard/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css    # Design system & global styles
│   │   │   ├── layout.tsx     # Root layout with metadata
│   │   │   ├── page.tsx       # Overview dashboard page
│   │   │   ├── sessions/
│   │   │   │   ├── page.tsx               # Sessions listing
│   │   │   │   └── [sessionId]/page.tsx   # Session detail (timeline)
│   │   │   └── heatmap/
│   │   │       └── page.tsx   # Click heatmap visualization
│   │   ├── components/
│   │   │   └── Sidebar.tsx    # Navigation sidebar
│   │   └── lib/
│   │       └── api.ts         # API client with TypeScript types
│   ├── .env.local             # Dashboard environment config
│   └── package.json
│
├── tracking/
│   ├── tracker.js             # Tracking SDK (add to any page)
│   └── demo.html              # Demo e-commerce page
│
└── README.md
```

## 🔌 API Reference

### `POST /api/events`
Receive and store a single event.

**Request Body:**
```json
{
  "session_id": "sess_abc123",
  "event_type": "click",
  "page_url": "http://localhost:5000/tracking/demo.html",
  "timestamp": "2026-10-13T09:00:00.000Z",
  "click_x": 450,
  "click_y": 320,
  "viewport_width": 1920,
  "viewport_height": 1080,
  "element_tag": "button",
  "element_text": "Add to Cart"
}
```

### `POST /api/events/batch`
Receive and store multiple events at once (used by the tracking SDK).

### `GET /api/sessions`
Returns all sessions with aggregated event counts, duration, and page counts.

### `GET /api/sessions/:sessionId/events`
Returns all events for a specific session, ordered chronologically.

### `GET /api/heatmap?page=<URL>`
Returns all click events for a specific page URL (for heatmap visualization).

### `GET /api/pages`
Returns distinct page URLs with event counts.

## 🎯 Features

### Tracking SDK (`tracker.js`)
- **Automatic page_view tracking** on page load and SPA navigation
- **Click tracking** with x/y coordinates, viewport dimensions, and element metadata
- **Session management** using localStorage with 30-minute expiry
- **Event batching** — queues events and sends in batches every 3 seconds
- **Reliable delivery** — uses `sendBeacon` API with `fetch` fallback
- **Zero dependencies** — pure vanilla JavaScript

### Dashboard
- **Overview Page** — Stats cards, recent sessions table, top pages
- **Sessions View** — Searchable sessions list with event counts, click to view journey
- **Session Detail** — Visual timeline showing the complete user journey
- **Heatmap View** — Select a page and see click density visualization with hover tooltips

## 🧩 Design Decisions & Trade-offs

| Decision | Rationale |
|----------|-----------|
| **localStorage for sessions** | Simpler than cookie management, works across tabs, 30-min expiry mimics real analytics |
| **Event batching (3s interval)** | Reduces network requests; uses `sendBeacon` for reliability on page unload |
| **MongoDB** | Schema flexibility for varying event payloads; good aggregation pipeline support |
| **Compound indexes** | `(session_id, timestamp)` and `(page_url, event_type)` for fast session and heatmap queries |
| **Viewport-normalized heatmap** | Click coordinates are normalized to container size for consistent display across resolutions |
| **Next.js App Router** | Modern React with file-based routing, server components support |
| **Vanilla CSS** | Full control over design without framework overhead; custom dark theme |
| **No authentication** | Simplified for demo purposes; would add JWT/session auth in production |

## 🔮 Future Improvements

- [ ] Add WebSocket for real-time dashboard updates
- [ ] Scroll depth tracking
- [ ] User agent / device type detection
- [ ] Date range filters on the dashboard
- [ ] Export data as CSV
- [ ] Rate limiting on the event ingestion API
- [ ] Redis caching for aggregated queries
- [ ] Docker Compose for one-command setup

## 📄 License

MIT
