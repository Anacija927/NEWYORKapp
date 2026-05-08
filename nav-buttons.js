// ============================================================================
// nav-buttons.js
// Injects two fixed buttons on every page :
//   - LEFT  : back navigation (defaults to index.html, label "Carte")
//   - RIGHT : link to utile.html ("Pratique" / open-book glyph)
//
// Configuration via data-attributes on the <script> tag:
//   <script src="assets/nav-buttons.js" data-back-href="brooklyn-index.html" data-back-label="Brooklyn"></script>
//
// Special case for utile.html itself :
//   <script src="assets/nav-buttons.js" data-mode="utile"></script>
//   → hides the "Pratique" button (we're already there)
//   → swaps the LEFT button for a "Fermer ✕" that calls history.back()
// ============================================================================

(function () {
  if (document.getElementById('nav-buttons-style')) return; // already injected

  // --- Read config ---
  var scriptTag = document.currentScript;
  var backHref  = (scriptTag && scriptTag.getAttribute('data-back-href'))  || 'index.html';
  var backLabel = (scriptTag && scriptTag.getAttribute('data-back-label')) || 'Carte';
  var mode      = (scriptTag && scriptTag.getAttribute('data-mode'))       || 'normal';
  var utileHref = (scriptTag && scriptTag.getAttribute('data-utile-href')) || 'utile.html';

  // --- Inject CSS ---
  var style = document.createElement('style');
  style.id = 'nav-buttons-style';
  style.textContent = `
    .nav-btn {
      position: fixed;
      top: calc(env(safe-area-inset-top, 0) + 14px);
      z-index: 999;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 14px 9px 12px;
      background: rgba(26, 39, 68, 0.88);
      color: #C8A96E;
      font-family: 'DM Mono', monospace;
      font-size: 10px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      text-decoration: none;
      border: 1px solid rgba(200, 169, 110, 0.4);
      border-radius: 3px;
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
      cursor: pointer;
      transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease;
      -webkit-tap-highlight-color: transparent;
      -webkit-appearance: none;
      appearance: none;
    }
    .nav-btn:hover,
    .nav-btn:focus-visible {
      background: rgba(26, 39, 68, 1);
      color: #E8C98A;
      outline: none;
    }
    .nav-btn:active { transform: translateY(1px); }
    .nav-btn-left  { left:  calc(env(safe-area-inset-left, 0)  + 14px); }
    .nav-btn-right { right: calc(env(safe-area-inset-right, 0) + 14px); padding: 9px 12px 9px 14px; }
    .nav-btn .nav-icon {
      font-size: 14px;
      line-height: 1;
      transform: translateY(-1px);
    }
    @media (max-width: 480px) {
      .nav-btn {
        font-size: 9.5px;
        padding: 8px 12px 8px 10px;
        letter-spacing: 0.16em;
      }
      .nav-btn-right { padding: 8px 10px 8px 12px; }
    }
  `;
  document.head.appendChild(style);

  // --- Build helper ---
  function makeBtn(opts) {
    var b;
    if (opts.onclick) {
      b = document.createElement('button');
      b.type = 'button';
      b.addEventListener('click', opts.onclick);
    } else {
      b = document.createElement('a');
      b.href = opts.href;
    }
    b.id = opts.id;
    b.className = 'nav-btn ' + (opts.side === 'left' ? 'nav-btn-left' : 'nav-btn-right');
    b.setAttribute('aria-label', opts.aria);

    // Build inner: icon + label, order depends on side
    var icon = document.createElement('span');
    icon.className = 'nav-icon';
    icon.textContent = opts.icon;
    var lbl = document.createElement('span');
    lbl.textContent = opts.label;

    if (opts.side === 'left') {
      b.appendChild(icon);
      b.appendChild(lbl);
    } else {
      b.appendChild(lbl);
      b.appendChild(icon);
    }
    return b;
  }

  // --- Build buttons based on mode ---
  function build() {
    if (mode === 'utile') {
      // Page utile itself : show only a "Fermer" button on the left.
      // Use history.back() if there's history, else fall back to index.html.
      var closeBtn = makeBtn({
        id: 'nav-btn-close',
        side: 'left',
        icon: '\u2715', // ✕
        label: 'Fermer',
        aria: 'Fermer cette page',
        onclick: function (e) {
          e.preventDefault();
          if (window.history.length > 1) {
            window.history.back();
          } else {
            window.location.href = 'index.html';
          }
        }
      });
      document.body.appendChild(closeBtn);
      return;
    }

    if (mode === 'home') {
      // Home page itself : no back button (we are the home), only "Pratique"
      var utileBtnHome = makeBtn({
        id: 'nav-btn-utile',
        side: 'right',
        icon: '\u2605',
        label: 'Pratique',
        aria: 'Ouvrir les infos pratiques',
        href: utileHref
      });
      document.body.appendChild(utileBtnHome);
      return;
    }

    // Normal mode: back button on left, "Pratique" on right
    var backBtn = makeBtn({
      id: 'nav-btn-back',
      side: 'left',
      icon: '\u2190', // ←
      label: backLabel,
      aria: 'Retour : ' + backLabel,
      href: backHref
    });
    document.body.appendChild(backBtn);

    var utileBtn = makeBtn({
      id: 'nav-btn-utile',
      side: 'right',
      icon: '\u2605', // ★ (small star = practical info, fits the editorial palette)
      label: 'Pratique',
      aria: 'Ouvrir les infos pratiques',
      href: utileHref
    });
    document.body.appendChild(utileBtn);
  }

  if (document.body) {
    build();
  } else {
    document.addEventListener('DOMContentLoaded', build);
  }
})();
