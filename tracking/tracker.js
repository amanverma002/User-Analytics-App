(function () {
  'use strict';

  const scriptTag = document.currentScript;
  const API_ENDPOINT = (scriptTag && scriptTag.getAttribute('data-api')) || 'http://localhost:5000/api/events';
  const BATCH_ENDPOINT = API_ENDPOINT.replace('/events', '/events/batch');
  const FLUSH_INTERVAL = 3000; 
  const SESSION_DURATION = 30 * 60 * 1000; 

  function generateSessionId() {
    return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
  }

  function getOrCreateSession() {
    const stored = localStorage.getItem('cf_session');
    if (stored) {
      try {
        const session = JSON.parse(stored);
        const elapsed = Date.now() - session.lastActivity;
        
        if (elapsed < SESSION_DURATION) {
          session.lastActivity = Date.now();
          localStorage.setItem('cf_session', JSON.stringify(session));
          return session.id;
        }
      } catch (e) {
        
      }
    }
   
    const newSession = {
      id: generateSessionId(),
      created: Date.now(),
      lastActivity: Date.now(),
    };
    localStorage.setItem('cf_session', JSON.stringify(newSession));
    return newSession.id;
  }

  function setSessionCookie(sessionId) {
    const expires = new Date(Date.now() + SESSION_DURATION).toUTCString();
    document.cookie = `cf_session_id=${sessionId}; expires=${expires}; path=/; SameSite=Lax`;
  }
  const SESSION_ID = getOrCreateSession();
  setSessionCookie(SESSION_ID);
  let eventQueue = [];
  let flushTimer = null;

  function queueEvent(event) {
    eventQueue.push(event);
   
    if (!flushTimer) {
      flushTimer = setTimeout(flushEvents, FLUSH_INTERVAL);
    }
  }

  function flushEvents() {
    if (eventQueue.length === 0) {
      flushTimer = null;
      return;
    }

    const batch = eventQueue.splice(0);
    flushTimer = null;

    const payload = JSON.stringify({ events: batch });
    const sent = navigator.sendBeacon && navigator.sendBeacon(
      BATCH_ENDPOINT,
      new Blob([payload], { type: 'application/json' })
    );

    if (!sent) {
      fetch(BATCH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(function (err) {
        console.warn('[Tracker] Failed to send events:', err);
        
        eventQueue = batch.concat(eventQueue);
      });
    }
  }

  function trackPageView() {
    queueEvent({
      session_id: SESSION_ID,
      event_type: 'page_view',
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
    });
  }

  function trackClick(event) {
    const target = event.target;
    const tag = target.tagName ? target.tagName.toLowerCase() : '';
    let text = (target.textContent || target.innerText || '').trim().substring(0, 100);

    queueEvent({
      session_id: SESSION_ID,
      event_type: 'click',
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      click_x: Math.round(event.clientX),
      click_y: Math.round(event.clientY),
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      element_tag: tag,
      element_text: text || null,
    });
  }

  trackPageView();

  document.addEventListener('click', trackClick, { capture: true, passive: true });
  window.addEventListener('beforeunload', flushEvents);
  const originalPushState = history.pushState;
  history.pushState = function () {
    originalPushState.apply(this, arguments);
    trackPageView();
  };
  window.addEventListener('popstate', trackPageView);
  window.__cfTracker = {
    sessionId: SESSION_ID,
    flush: flushEvents,
    getQueue: function () { return eventQueue; },
  };

  console.log('[CausalFunnel Tracker] Initialized | Session:', SESSION_ID);
})();
