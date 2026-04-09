// Shared navigation for docs/visual/ pages
// Usage: <script src="nav.js" data-active="overview"></script>
(function () {
  var script = document.currentScript;
  var active = script ? script.getAttribute('data-active') || '' : '';
  var NAV_HEIGHT = 44;

  var pages = [
    { id: 'overview', label: 'Overview', href: 'overview.html' },
    { id: 'architecture', label: 'Architecture', href: 'architecture.html' },
    { id: 'auth-security', label: 'Auth & Security', href: 'auth-security.html' },
    { id: 'workflows', label: 'Workflows', href: 'workflows.html' },
    { id: 'features', label: 'Features', href: 'features.html' },
    { id: 'testing', label: 'Testing', href: 'testing.html' },
    { id: 'presentation', label: 'Presentation', href: 'presentation.html' },
  ];

  var nav = document.createElement('nav');
  nav.id = 'site-nav';

  var brand = document.createElement('a');
  brand.href = 'overview.html';
  brand.textContent = 'CSLogbook';
  brand.className = 'site-nav-brand';
  nav.appendChild(brand);

  var links = document.createElement('div');
  links.className = 'site-nav-links';

  pages.forEach(function (p) {
    var a = document.createElement('a');
    a.href = p.href;
    a.textContent = p.label;
    a.className = 'site-nav-link' + (p.id === active ? ' active' : '');
    links.appendChild(a);
  });
  nav.appendChild(links);

  var style = document.createElement('style');
  style.textContent =
    '#site-nav {' +
    '  position: sticky; top: 0; z-index: 10000;' +
    '  background: #ffffff; border-bottom: 1px solid rgba(0,0,0,0.1);' +
    '  padding: 0 24px; display: flex; align-items: center;' +
    '  gap: 16px; height: ' + NAV_HEIGHT + 'px; box-sizing: border-box;' +
    '  font-family: "Inter", -apple-system, system-ui, "Segoe UI", Helvetica, sans-serif;' +
    '}' +
    '[data-theme="dark"] #site-nav { background: #191918; border-color: rgba(255,255,255,0.1); }' +
    '.site-nav-brand {' +
    '  color: #0075de; font-weight: 700; font-size: 15px;' +
    '  text-decoration: none; white-space: nowrap;' +
    '}' +
    '.site-nav-brand:hover { text-decoration: none; opacity: 0.85; }' +
    '.site-nav-links { display: flex; gap: 2px; flex-wrap: wrap; }' +
    '.site-nav-link {' +
    '  color: #615d59; text-decoration: none; padding: 4px 10px;' +
    '  border-radius: 4px; font-size: 14px; font-weight: 500;' +
    '  transition: all 0.15s; white-space: nowrap;' +
    '}' +
    '[data-theme="dark"] .site-nav-link { color: #a39e98; }' +
    '.site-nav-link:hover { color: rgba(0,0,0,0.95); background: #f6f5f4; text-decoration: none; }' +
    '[data-theme="dark"] .site-nav-link:hover { color: #f6f5f4; background: rgba(255,255,255,0.06); }' +
    '.site-nav-link.active {' +
    '  color: rgba(0,0,0,0.95); background: #f2f9ff; font-weight: 600;' +
    '}' +
    '[data-theme="dark"] .site-nav-link.active { color: #f6f5f4; background: rgba(9,127,232,0.12); }' +
    '@media (max-width: 768px) {' +
    '  #site-nav { padding: 0 12px; gap: 8px; height: auto; min-height: ' + NAV_HEIGHT + 'px; flex-wrap: wrap; padding-top: 6px; padding-bottom: 6px; }' +
    '  .site-nav-links { gap: 0; }' +
    '  .site-nav-link { font-size: 12px; padding: 3px 6px; }' +
    '}';

  document.head.appendChild(style);
  document.body.prepend(nav);
  document.documentElement.style.setProperty('--site-nav-h', NAV_HEIGHT + 'px');
})();
