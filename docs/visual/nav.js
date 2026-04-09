// Shared navigation for docs/visual/ pages
// Usage: <script src="nav.js" data-active="architecture"></script>
(function () {
  var script = document.currentScript;
  var active = script ? script.getAttribute('data-active') || '' : '';
  var NAV_HEIGHT = 32; // px — used by pages with fixed internal navs

  var pages = [
    { id: 'architecture', label: 'Architecture', href: 'architecture.html' },
    { id: 'explainer', label: 'Explainer', href: 'CSLogbook_Visual_Explainer.html' },
    { id: 'presentation', label: 'Presentation', href: 'presentation.html' },
    { id: 'system-flow', label: 'System Flow', href: 'system-flow.html' },
  ];

  var nav = document.createElement('nav');
  nav.id = 'site-nav';

  var brand = document.createElement('span');
  brand.textContent = 'CSLogbook';
  brand.className = 'site-nav-brand';
  nav.appendChild(brand);

  pages.forEach(function (p) {
    var a = document.createElement('a');
    a.href = p.href;
    a.textContent = p.label;
    a.className = 'site-nav-link' + (p.id === active ? ' active' : '');
    nav.appendChild(a);
  });

  var style = document.createElement('style');
  style.textContent =
    '#site-nav {' +
    '  position: sticky; top: 0; z-index: 10000;' +
    '  background: #f8fafc; border-bottom: 1px solid #e2e8f0;' +
    '  padding: 0.35rem 1.5rem; display: flex; align-items: center;' +
    '  gap: 0.6rem; flex-wrap: wrap;' +
    '  font-family: "Segoe UI", system-ui, sans-serif; font-size: 0.78rem;' +
    '  height: ' + NAV_HEIGHT + 'px; box-sizing: border-box;' +
    '}' +
    '.site-nav-brand {' +
    '  color: #2563eb; font-weight: 700; margin-right: 0.4rem; font-size: 0.85rem;' +
    '}' +
    '.site-nav-link {' +
    '  color: #64748b; text-decoration: none; padding: 0.2rem 0.55rem;' +
    '  border-radius: 5px; transition: all 0.15s;' +
    '}' +
    '.site-nav-link:hover { color: #1e293b; background: #2563eb10; }' +
    '.site-nav-link.active {' +
    '  color: #1e293b; background: #2563eb15; font-weight: 600;' +
    '}';

  document.head.appendChild(style);
  document.body.prepend(nav);

  // Expose height for pages with fixed internal navs
  document.documentElement.style.setProperty('--site-nav-h', NAV_HEIGHT + 'px');
})();
