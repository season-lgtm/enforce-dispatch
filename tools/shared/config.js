/* =====================================================================================
   Enforce web tools — environment config. Loaded in <head> BEFORE every page's scripts,
   so the single agent-API base URL is defined once, here, instead of hardcoded per page.

   LOCAL DEV:  the agent server (services/agents/server.py) runs on :8920 → default below.
   STAGING / PROD:  the static site is served over HTTPS from a real host, so the browser
     CANNOT reach a developer's localhost:8920. Serve the agent under the SAME origin via a
     reverse proxy at "/agent" (this avoids CORS and HTTPS mixed-content entirely). Example
     nginx:  location /agent/ { proxy_pass http://127.0.0.1:8920/; }
   Override anytime by defining window.ENFORCE_AGENT_URL before this file loads, or by
   editing the STAGING_DEFAULT below to a full URL (e.g. "https://api.enforce.example").
   ===================================================================================== */
(function () {
  if (window.ENFORCE_AGENT_URL) return;           // explicit override wins
  var host = location.hostname;
  var isLocal = host === 'localhost' || host === '127.0.0.1' || host === '';
  var STAGING_DEFAULT = location.origin + '/agent';  // reverse-proxy path on the staging host
  window.ENFORCE_AGENT_URL = isLocal ? 'http://localhost:8920' : STAGING_DEFAULT;
})();
