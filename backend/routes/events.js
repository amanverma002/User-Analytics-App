const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

router.get('/', (req, res) => {
  res.json({
    name: 'CausalFunnel Analytics API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      'POST /api/events': 'Receive and store a single event',
      'POST /api/events/batch': 'Receive and store batch events',
      'GET /api/sessions': 'Fetch all sessions with event counts',
      'GET /api/sessions/:sessionId/events': 'Fetch all events for a session',
      'GET /api/heatmap?page=URL': 'Fetch click data for heatmap',
      'GET /api/pages': 'Get distinct page URLs with counts',
    },
  });
});
router.post('/events', async (req, res) => {
  try {
    const { session_id, event_type, page_url, timestamp, click_x, click_y, viewport_width, viewport_height, element_tag, element_text } = req.body;

    if (!session_id || !event_type || !page_url) {
      return res.status(400).json({
        error: 'Missing required fields: session_id, event_type, page_url',
      });
    }
    if (!['page_view', 'click'].includes(event_type)) {
      return res.status(400).json({
        error: 'Invalid event_type. Must be "page_view" or "click".',
      });
    }
    if (event_type === 'click' && (click_x == null || click_y == null)) {
      return res.status(400).json({
        error: 'Click events require click_x and click_y coordinates.',
      });
    }

    const event = new Event({
      session_id,
      event_type,
      page_url,
      timestamp: timestamp || new Date(),
      click_x: event_type === 'click' ? click_x : null,
      click_y: event_type === 'click' ? click_y : null,
      viewport_width: viewport_width || null,
      viewport_height: viewport_height || null,
      element_tag: element_tag || null,
      element_text: element_text || null,
    });

    await event.save();
    res.status(201).json({ success: true, event_id: event._id });
  } catch (err) {
    console.error('Error saving event:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.post('/events/batch', async (req, res) => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'events must be a non-empty array' });
    }

    const validatedEvents = events.map((e) => ({
      session_id: e.session_id,
      event_type: e.event_type,
      page_url: e.page_url,
      timestamp: e.timestamp || new Date(),
      click_x: e.event_type === 'click' ? e.click_x : null,
      click_y: e.event_type === 'click' ? e.click_y : null,
      viewport_width: e.viewport_width || null,
      viewport_height: e.viewport_height || null,
      element_tag: e.element_tag || null,
      element_text: e.element_text || null,
    }));

    const result = await Event.insertMany(validatedEvents);

    res.status(201).json({ success: true, count: result.length });
  } catch (err) {
    console.error('Error saving batch events:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await Event.aggregate([
      {
        $group: {
          _id: '$session_id',
          total_events: { $sum: 1 },
          page_views: {
            $sum: { $cond: [{ $eq: ['$event_type', 'page_view'] }, 1, 0] },
          },
          clicks: {
            $sum: { $cond: [{ $eq: ['$event_type', 'click'] }, 1, 0] },
          },
          first_event: { $min: '$timestamp' },
          last_event: { $max: '$timestamp' },
          pages_visited: { $addToSet: '$page_url' },
        },
      },
      {
        $project: {
          session_id: '$_id',
          _id: 0,
          total_events: 1,
          page_views: 1,
          clicks: 1,
          first_event: 1,
          last_event: 1,
          duration_seconds: {
            $divide: [{ $subtract: ['$last_event', '$first_event'] }, 1000],
          },
          pages_count: { $size: '$pages_visited' },
        },
      },
      { $sort: { last_event: -1 } },
    ]);

    res.json({ sessions, total: sessions.length });
  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/sessions/:sessionId/events', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const events = await Event.find({ session_id: sessionId })
      .sort({ timestamp: 1 })
      .lean();

    if (events.length === 0) {
      return res.status(404).json({ error: 'No events found for this session' });
    }

    res.json({
      session_id: sessionId,
      total_events: events.length,
      events,
    });
  } catch (err) {
    console.error('Error fetching session events:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/heatmap', async (req, res) => {
  try {
    const { page } = req.query;

    if (!page) {
      return res.status(400).json({ error: 'page query parameter is required' });
    }

    const clicks = await Event.find({
      page_url: page,
      event_type: 'click',
    })
      .select('click_x click_y viewport_width viewport_height element_tag element_text timestamp session_id')
      .sort({ timestamp: -1 })
      .lean();

    res.json({
      page_url: page,
      total_clicks: clicks.length,
      clicks,
    });
  } catch (err) {
    console.error('Error fetching heatmap data:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/pages', async (req, res) => {
  try {
    const pages = await Event.aggregate([
      {
        $group: {
          _id: '$page_url',
          total_events: { $sum: 1 },
          total_clicks: {
            $sum: { $cond: [{ $eq: ['$event_type', 'click'] }, 1, 0] },
          },
          total_page_views: {
            $sum: { $cond: [{ $eq: ['$event_type', 'page_view'] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          page_url: '$_id',
          _id: 0,
          total_events: 1,
          total_clicks: 1,
          total_page_views: 1,
        },
      },
      { $sort: { total_events: -1 } },
    ]);

    res.json({ pages, total: pages.length });
  } catch (err) {
    console.error('Error fetching pages:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
module.exports = router;
