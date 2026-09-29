/* =====================================================================================
   Enforce Central Brain — shared app shell (persistent left sidebar).
   Single source of truth for the navigation across EVERY tool page. Each page includes:
       <script src="../shared/app-shell.js"></script>
   The script injects a fixed dark sidebar + a mobile drawer + hamburger, shifts the page
   content right on desktop, highlights the active page, and shows live counts from the same
   localStorage the tools write. No build step — vanilla, self-contained, class-prefixed `esh-`.
   ===================================================================================== */
(function () {
  if (window.__enforceShell) return; window.__enforceShell = true;
  var W = 252;

  /* ---- which page am I on? ---- */
  var p = location.pathname;
  var active =
    p.indexOf('/dashboard/') >= 0 ? 'dashboard' :
    p.indexOf('/enquiry-inbox/') >= 0 ? 'front' :
    p.indexOf('/quote-generator/') >= 0 ? 'quotes' :
    p.indexOf('/invoicing/') >= 0 ? 'invoicing' :
    p.indexOf('/technician-dispatch/') >= 0 ? 'dispatch' : '';

  /* ---- live counts (best-effort; same keys the tools use) ---- */
  function readLS(k, f) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? f : v; } catch (e) { return f; } }
  var enq = readLS('enforce_enquiries', []) || [];
  var salesEnq = enq.filter(function (e) { return (e.lane || 'sales') === 'sales'; }).length;
  var svcEnq = enq.filter(function (e) { return e.lane === 'service'; }).length;
  var quoteCount = 0, seen = {};
  var SEED_QUOTE_REFS = 6; // matches the demo seed set (Studio + dashboard) so a fresh device is consistent
  for (var i = 0; i < localStorage.length; i++) {
    var k = localStorage.key(i); if (!k || k.indexOf('enforce_quotes:') !== 0) continue;
    (readLS(k, []) || []).forEach(function (q) { var r = q.ref || q.id; if (r && !seen[r]) { seen[r] = 1; quoteCount++; } });
  }
  var quotesInProgress = quoteCount || SEED_QUOTE_REFS;
  var confirmed = (readLS('enforce_confirmed_quotes', []) || []).length || 3;

  /* ---- icons ---- */
  function icon(d) { return '<svg class="esh-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; }
  var I = {
    dash: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    enquiry: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 20l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    quote: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h4"/>',
    invoice: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M8 15h4"/>',
    service: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2-2 2.5-2.5z"/>',
    truck: '<rect x="1" y="6" width="13" height="10" rx="1.5"/><path d="M14 9h4l3 3v4h-7z"/><circle cx="6" cy="18.5" r="1.7"/><circle cx="17" cy="18.5" r="1.7"/>',
    report: '<path d="M9 2h6l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M9 11l2 2 4-4"/>',
    brain: '<path d="M12 5a3 3 0 0 0-3 3 3 3 0 0 0-1 5.8V17a2 2 0 0 0 4 0M12 5a3 3 0 0 1 3 3 3 3 0 0 1 1 5.8V17a2 2 0 0 1-4 0"/>'
  };

  /* ---- nav model (relative paths resolve the same from every tool page) ---- */
  var groups = [
    { grp: null, items: [{ ic: I.dash, nm: 'Dashboard', key: 'dashboard', href: '../dashboard/dashboard.html' }] },
    { grp: 'Sales', items: [
      { ic: I.enquiry, nm: 'Sales Enquiries', key: 'front', href: '../enquiry-inbox/enquiry-inbox.html', ct: salesEnq || null },
      { ic: I.quote, nm: 'Quotations', key: 'quotes', href: '../quote-generator/sales-quotes.html', ct: quotesInProgress || null },
      { ic: I.invoice, nm: 'Invoicing', key: 'invoicing', href: '../invoicing/invoicing-console.html', ct: confirmed || null }
    ]},
    { grp: 'Service', items: [
      { ic: I.service, nm: 'Service Requests', key: 'front', href: '../enquiry-inbox/enquiry-inbox.html', ct: svcEnq || null, subactive: true },
      { ic: I.truck, nm: 'Technician Dispatch', key: 'dispatch', href: '../technician-dispatch/technician-dispatch.html' },
      { ic: I.report, nm: 'Job Reports', tag: 'soon' }
    ]},
    { grp: 'Platform', items: [{ ic: I.brain, nm: 'Knowledge Base', tag: 'soon' }] }
  ];

  /* when on the Front Desk, highlight the first front-desk item only (avoid two active states) */
  var frontUsed = false;
  function itemHTML(it) {
    var inner = icon(it.ic) + '<span>' + it.nm + '</span>' +
      (it.tag ? '<span class="esh-tag">' + it.tag + '</span>' : (it.ct ? '<span class="esh-ct">' + it.ct + '</span>' : ''));
    if (!it.href) return '<span class="esh-item esh-muted" title="Not in this build phase">' + inner + '</span>';
    var isActive = it.key === active && !(it.key === 'front' && frontUsed);
    if (it.key === 'front') frontUsed = true;
    return '<a class="esh-item' + (isActive ? ' esh-active" aria-current="page' : '') + '" href="' + it.href + '">' + inner + '</a>';
  }
  var navHTML = groups.map(function (g) {
    return (g.grp ? '<div class="esh-grp">' + g.grp + '</div>' : '') + g.items.map(itemHTML).join('');
  }).join('');

  /* ---- CSS ---- */
  var css =
  '.esh-sidebar{position:fixed;left:0;top:0;width:' + W + 'px;height:100vh;background:#191b27;color:#c9ccd8;display:flex;flex-direction:column;z-index:1000;border-right:1px solid rgba(255,255,255,.08);font-family:"Hanken Grotesk",system-ui,sans-serif;transition:transform .28s cubic-bezier(.22,1,.36,1)}' +
  '.esh-brand{display:flex;align-items:center;gap:11px;padding:18px 18px 16px}' +
  '.esh-brand .esh-mark{width:34px;height:34px;border-radius:9px;background:linear-gradient(150deg,#5b54e6,#4f46e5);display:grid;place-items:center;flex:0 0 auto;box-shadow:0 4px 14px -4px rgba(79,70,229,.6)}' +
  '.esh-brand .esh-mark::after{content:"";width:11px;height:11px;border-radius:50%;border:2.5px solid #fff}' +
  '.esh-brand .esh-nm{font-size:15px;font-weight:800;letter-spacing:-.01em;color:#fff;line-height:1.1}' +
  '.esh-brand .esh-nm small{display:block;font-family:"IBM Plex Mono",monospace;font-size:8px;letter-spacing:.2em;color:#8086a0;font-weight:400;margin-top:3px}' +
  '.esh-nav{flex:1;overflow-y:auto;padding:6px 12px 12px}' +
  '.esh-grp{font-family:"IBM Plex Mono",monospace;font-size:8.5px;letter-spacing:.16em;text-transform:uppercase;color:#8086a0;padding:16px 10px 7px}' +
  '.esh-item{display:flex;align-items:center;gap:11px;padding:9px 11px;border-radius:9px;color:#c9ccd8;text-decoration:none;font-size:13.5px;font-weight:600;transition:background .14s,color .14s}' +
  '.esh-item .esh-ic{width:18px;height:18px;flex:0 0 auto;color:#8086a0;transition:color .14s}' +
  '.esh-item:hover{background:rgba(255,255,255,.06);color:#fff}.esh-item:hover .esh-ic{color:#c9ccd8}' +
  '.esh-item.esh-active{background:#4f46e5;color:#fff;box-shadow:0 6px 16px -6px rgba(79,70,229,.7)}.esh-item.esh-active .esh-ic{color:#fff}' +
  '.esh-item .esh-tag{margin-left:auto;font-family:"IBM Plex Mono",monospace;font-size:8px;letter-spacing:.04em;padding:2px 7px;border-radius:20px;background:rgba(255,255,255,.09);color:#8086a0;font-weight:500}' +
  '.esh-item.esh-muted{color:#8086a0;cursor:default}.esh-item.esh-muted:hover{background:transparent;color:#8086a0}.esh-item.esh-muted .esh-ic{opacity:.6}' +
  '.esh-item .esh-ct{margin-left:auto;font-family:"IBM Plex Mono",monospace;font-size:11px;color:#8086a0;background:rgba(255,255,255,.07);padding:1px 7px;border-radius:20px;min-width:20px;text-align:center}' +
  '.esh-item.esh-active .esh-ct{background:rgba(255,255,255,.22);color:#fff}' +
  '.esh-foot{border-top:1px solid rgba(255,255,255,.08);padding:12px 14px;display:flex;align-items:center;gap:10px}' +
  '.esh-foot .esh-av{width:32px;height:32px;border-radius:9px;background:#2a2d3e;display:grid;place-items:center;color:#fff;font-weight:700;font-size:13px;flex:0 0 auto}' +
  '.esh-foot .esh-who{min-width:0}.esh-foot .esh-who b{display:block;font-size:12.5px;color:#fff;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  '.esh-foot .esh-who span{font-family:"IBM Plex Mono",monospace;font-size:8.5px;color:#8086a0}' +
  '.esh-foot .esh-eng{margin-left:auto;display:flex;align-items:center;gap:6px;font-family:"IBM Plex Mono",monospace;font-size:8.5px;color:#8086a0;white-space:nowrap}' +
  '.esh-foot .esh-eng::before{content:"";width:6px;height:6px;border-radius:50%;background:#3ddc91;box-shadow:0 0 0 0 rgba(61,220,145,.5);animation:esh-pulse 2.6s cubic-bezier(.22,1,.36,1) infinite}' +
  '@keyframes esh-pulse{0%{box-shadow:0 0 0 0 rgba(61,220,145,.45)}70%{box-shadow:0 0 0 6px rgba(61,220,145,0)}100%{box-shadow:0 0 0 0 rgba(61,220,145,0)}}' +
  '.esh-backdrop{display:none;position:fixed;inset:0;background:rgba(13,14,22,.5);z-index:990}.esh-backdrop.esh-show{display:block}' +
  '.esh-burger{display:none;position:fixed;top:11px;left:12px;z-index:1001;width:40px;height:40px;border:1px solid #e7e9ee;border-radius:10px;background:#fff;cursor:pointer;align-items:center;justify-content:center;box-shadow:0 4px 14px -6px rgba(0,0,0,.35)}' +
  '.esh-burger span,.esh-burger span::before,.esh-burger span::after{content:"";display:block;width:16px;height:2px;background:#16181d;border-radius:2px;position:relative}' +
  '.esh-burger span::before{position:absolute;top:-5px}.esh-burger span::after{position:absolute;top:5px}' +
  /* shift page content right on desktop; drawer on mobile */
  '@media(min-width:861px){body{padding-left:' + W + 'px!important}}' +
  /* mobile: drawer + hamburger; clear space in the page's own sticky top bar (.top / .app) for the burger */
  '@media(max-width:860px){.esh-sidebar{transform:translateX(-100%)}.esh-sidebar.esh-open{transform:translateX(0);box-shadow:0 20px 60px -20px rgba(0,0,0,.6)}.esh-burger{display:flex}.top,.app{padding-left:62px!important}}' +
  '@media(prefers-reduced-motion:reduce){.esh-sidebar{transition:none}.esh-foot .esh-eng::before{animation:none}}';

  /* ---- build & mount ---- */
  function mount() {
    var style = document.createElement('style'); style.id = 'esh-style'; style.textContent = css; document.head.appendChild(style);

    var side = document.createElement('aside'); side.className = 'esh-sidebar';
    side.innerHTML =
      '<div class="esh-brand"><div><img src="../shared/assets/enforce-logo-white.png" alt="Enforce" style="height:21px;width:auto;display:block"><small style="font-family:\'IBM Plex Mono\',monospace;font-size:8px;letter-spacing:.2em;color:#8086a0;margin-top:6px;display:block">CENTRAL BRAIN</small></div></div>' +
      '<nav class="esh-nav">' + navHTML + '</nav>' +
      '<div class="esh-foot"><span class="esh-av">A</span><span class="esh-who"><b>Alexander</b><span>Managing Director</span></span><span class="esh-eng" id="esh-eng">engine…</span></div>';

    var backdrop = document.createElement('div'); backdrop.className = 'esh-backdrop';
    var burger = document.createElement('button'); burger.className = 'esh-burger'; burger.setAttribute('aria-label', 'Menu'); burger.innerHTML = '<span></span>';

    document.body.appendChild(side); document.body.appendChild(backdrop); document.body.appendChild(burger);

    function close() { side.classList.remove('esh-open'); backdrop.classList.remove('esh-show'); }
    burger.onclick = function () { side.classList.toggle('esh-open'); backdrop.classList.toggle('esh-show'); };
    backdrop.onclick = close;
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

    // engine status (best-effort)
    try {
      fetch((window.ENFORCE_AGENT_URL || 'http://localhost:8920') + '/health').then(function (r) { return r.json(); })
        .then(function (h) { var el = document.getElementById('esh-eng'); if (el) el.textContent = 'engine ' + (h.provider === 'mock' ? 'mock' : h.provider); })
        .catch(function () { var el = document.getElementById('esh-eng'); if (el) el.textContent = 'engine offline'; });
    } catch (e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
