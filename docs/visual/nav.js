// Shared navigation for docs/visual/ pages
// Usage: <script src="nav.js" data-active="architecture"></script>
(function () {
  const script = document.currentScript;
  const active = script?.getAttribute('data-active') || '';

  const pages = [
    { id: 'architecture', label: 'Architecture', href: 'architecture.html' },
    { id: 'explainer', label: 'Explainer', href: 'CSLogbook_Visual_Explainer.html' },
    { id: 'presentation', label: 'Presentation', href: 'presentation.html' },
    { id: 'system-flow', label: 'System Flow', href: 'system-flow.html' },
  ];

  const nav = document.createElement('nav');
  nav.id = 'site-nav';

  const brand = document.createElement('span');
  brand.textContent = 'CSLogbook';
  brand.className = 'site-nav-brand';
  nav.appendChild(brand);

  pages.forEach(p => {
    const a = document.createElement('a');
    a.href = p.href;
    a.textContent = p.label;
    a.className = 'site-nav-link' + (p.id === active ? ' active' : '');
    nav.appendChild(a);
  });

  const style = document.createElement('style');
  style.textContent = `
    #site-nav {
      background: #f8fafc; border-bottom: 1px solid #e2e8f0;
      padding: 0.45rem 1.5rem; display: flex; align-items: center;
      gap: 0.6rem; flex-wrap: wrap;
      font-family: 'Segoe UI', system-ui, sans-serif; font-size: 0.78rem;
    }
    .site-nav-brand {
      color: #2563eb; font-weight: 700; margin-right: 0.4rem; font-size: 0.85rem;
    }
    .site-nav-link {
      color: #64748b; text-decoration: none; padding: 0.2rem 0.55rem;
      border-radius: 5px; transition: all 0.15s;
    }
    .site-nav-link:hover { color: #1e293b; background: #2563eb10; }
    .site-nav-link.active {
      color: #1e293b; background: #2563eb15; font-weight: 600;
    }
  `;

  document.head.appendChild(style);
  document.body.prepend(nav);
})();
