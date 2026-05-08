// ============================================================================
// password-gate.js
// Editorial-style password gate for neighborhood pages.
//
// Usage in each protected page (right after <body>):
//   <script src="assets/password-gate.js"></script>
//   <script>requireGate('harlem');</script>
//
// Brooklyn cascade : the 4 sub-pages call requireGate('brooklyn') — same slug
// as the hub, so unlocking once unlocks everything Brooklyn.
//
// Storage : localStorage key 'nyc-unlocked-v1' = JSON array of unlocked slugs.
// ============================================================================

(function () {
  const STORAGE_KEY = 'nyc-unlocked-v1';
  const SALT = 'nyc2026:';

  // SHA-256 of (SALT + password)
  const HASHES = {
    'harlem':         '0adf9953f4ea14ebe3e197f7585ac9b9b4728d265d6241bb6c162748d159ae99',
    'upper-west-side':'7f5e1ceebcce77f8ccc6e32f088277e9bdad13730303f88340a6083fbb9930c3',
    'upper-east-side':'1d1b9ba25ae56b29cd00cc132f26473b7d68735fbdb26d33806ba7f188bb619a',
    'midtown':        '51537e49dce0a96ec322f11f1ee13269b9fb169ba94f8ffa6b1e27a374c04072',
    'chelsea':        '3d246fe701f36cc4fcfa7c8649585869d7373e28caa08655101480adbbebeecc',
    'flatiron':       'bac9f82c361224416376d103b204468bff15d2842126627fa58717fb52c30525',
    'greenwich':      '9567676440d20d43b910fb7e9b22b7fff629d07c9acdf20aaef0c64fcdff52a0',
    'east-village':   '91f5fdc05f70320621a3b516fcdf1614a39e926d344f3758312ab62aa26c1bea',
    'chinatown':      'd42d861b7c2804c09ebeadf99fba0b1585c70d2b1e38a8bce7f62e8b4ee6089d',
    'sud-manhattan':  '91d4f507b463104d601dc34ef635f99ae04e03f1abfd2be3c1e09074f44cd351',
    'rockefeller':    'bed06772abecd6eb132fa7a5172c0ad1630bd752829175c2cd784e7a2bf648a0',
    'liberty':        '05b4e1cb24fdf402d8a8fa8abd021bfdf5f2d12848dc6a7accaa1c0994cb95fc',
    'brooklyn':       '88165004b4d49f3472aa50144a02120a2f07b49ca93437baaba86ba188652486',
  };

  const LABELS = {
    'harlem':          'Harlem',
    'upper-west-side': 'Upper West Side',
    'upper-east-side': 'Upper East Side',
    'midtown':         'Midtown',
    'chelsea':         'Chelsea',
    'flatiron':        'Flatiron & Gramercy',
    'greenwich':       'Greenwich & West Village',
    'east-village':    'East Village',
    'chinatown':       'Chinatown & Little Italy',
    'sud-manhattan':   'Sud de Manhattan',
    'rockefeller':     'Rockefeller Center',
    'liberty':         'Statue de la Liberté & Ellis Island',
    'brooklyn':        'Brooklyn',
  };

  // Factual unlock phrases shown briefly after success
  const PHRASES = {
    'harlem':          "L'Apollo Theater, scène mythique de Harlem où Ella Fitzgerald débuta en 1934.",
    'upper-west-side': "Le Dakota Building, où vivait John Lennon, à l'angle de Central Park West et de la 72e rue.",
    'upper-east-side': "L'Upper East Side, décor de la série Gossip Girl autour de Madison Avenue.",
    'midtown':         "L'Empire State Building, gratte-ciel art déco de 102 étages, achevé en 1931.",
    'chelsea':         "La High Line, ancienne voie ferrée aérienne reconvertie en parc en 2009.",
    'flatiron':        "Le Flatiron Building, gratte-ciel triangulaire de 1902, à l'angle de Broadway et de la 5e Avenue.",
    'greenwich':       "Le 90 Bedford Street, dans West Village, immeuble façade de la série Friends.",
    'east-village':    "Tompkins Square Park, cœur historique de l'East Village et de sa contre-culture.",
    'chinatown':       "Mulberry Street, artère de Little Italy où Coppola a tourné Le Parrain.",
    'sud-manhattan':   "Wall Street, centre financier mondial, bordé par Trinity Church et la Bourse de New York.",
    'rockefeller':     "Top of the Rock, observatoire au sommet du Rockefeller Center, ouvert en 1933.",
    'liberty':         "Frédéric Auguste Bartholdi, sculpteur français de la Statue de la Liberté, inaugurée en 1886.",
    'brooklyn':        "DUMBO, acronyme de Down Under the Manhattan Bridge Overpass.",
  };

  // ── Helpers ──────────────────────────────────────────────────────────────

  async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function getUnlocked() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }

  function unlock(slug) {
    const list = getUnlocked();
    if (!list.includes(slug)) {
      list.push(slug);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
  }

  function isUnlocked(slug) {
    return getUnlocked().includes(slug);
  }

  // ── Inject CSS ────────────────────────────────────────────────────────────

  function injectStyles() {
    if (document.getElementById('gate-styles')) return;
    const s = document.createElement('style');
    s.id = 'gate-styles';
    s.textContent = `
      body.gate-active > *:not(.gate-overlay) { display: none !important; }
      .gate-overlay {
        position: fixed; inset: 0;
        background: #FAF7F2;
        display: flex; align-items: center; justify-content: center;
        z-index: 99999;
        padding: 24px;
        font-family: 'Cormorant Garamond', Georgia, serif;
        animation: gateIn 0.4s ease;
      }
      .gate-overlay.fading { animation: gateOut 0.5s ease forwards; }
      @keyframes gateIn  { from { opacity: 0; } to { opacity: 1; } }
      @keyframes gateOut { from { opacity: 1; } to { opacity: 0; } }

      .gate-card {
        max-width: 380px; width: 100%;
        text-align: center;
      }
      .gate-eyebrow {
        font-family: 'DM Mono', monospace;
        font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase;
        color: #C8A96E; margin-bottom: 22px;
      }
      .gate-title {
        font-family: 'Cormorant Garamond', serif;
        font-size: 38px; font-weight: 300; font-style: italic;
        color: #1B2A4A; margin-bottom: 8px; line-height: 1.1;
      }
      .gate-sub {
        font-family: 'Lora', serif;
        font-style: italic; font-size: 14px;
        color: #6B5D4A; margin-bottom: 28px;
      }
      .gate-input {
        width: 100%; padding: 14px 16px;
        background: transparent;
        border: none; border-bottom: 1px solid #1B2A4A;
        font-family: 'DM Mono', monospace;
        font-size: 16px; text-align: center;
        letter-spacing: 0.12em;
        color: #1B2A4A; border-radius: 0;
        -webkit-appearance: none; appearance: none;
      }
      .gate-input:focus {
        outline: none;
        border-bottom-color: #C8A96E;
      }
      .gate-input.shake { animation: shake 0.4s ease; }
      @keyframes shake {
        0%,100% { transform: translateX(0); }
        25% { transform: translateX(-6px); }
        75% { transform: translateX(6px); }
      }
      .gate-error {
        color: #8B3A2A; font-family: 'Lora', serif;
        font-style: italic; font-size: 13px;
        margin-top: 12px; min-height: 1.2em;
        opacity: 0; transition: opacity 0.2s;
      }
      .gate-error.show { opacity: 1; }
      .gate-help {
        font-family: 'DM Mono', monospace;
        font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
        color: #6B5D4A; opacity: 0.55;
        margin-top: 24px;
      }
      .gate-back {
        display: inline-block;
        margin-top: 18px;
        font-family: 'DM Mono', monospace;
        font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
        color: #6B5D4A; opacity: 0.7;
        text-decoration: none; cursor: pointer;
        background: none; border: none; padding: 8px;
      }
      .gate-back:hover { color: #1B2A4A; opacity: 1; }

      /* Reveal phrase shown on success */
      .gate-reveal {
        text-align: center;
        animation: revealFade 0.6s ease;
      }
      @keyframes revealFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      .gate-reveal-title {
        font-family: 'Cormorant Garamond', serif;
        font-style: italic; font-weight: 400;
        font-size: 28px; color: #C8A96E;
        margin-bottom: 18px; letter-spacing: 0.04em;
      }
      .gate-reveal-phrase {
        font-family: 'Cormorant Garamond', serif;
        font-style: italic; font-weight: 400;
        font-size: 18px; color: #1B2A4A;
        line-height: 1.5; max-width: 360px;
        margin: 0 auto;
      }
      .gate-reveal-divider {
        width: 40px; height: 1px;
        background: #C8A96E;
        margin: 18px auto;
        opacity: 0.6;
      }
    `;
    document.head.appendChild(s);
  }

  // ── Main API ──────────────────────────────────────────────────────────────

  async function requireGate(slug) {
    if (!HASHES[slug]) {
      console.error('[gate] unknown slug:', slug);
      return;
    }
    if (isUnlocked(slug)) return; // already unlocked, nothing to do

    injectStyles();

    // Hide content until unlock
    const ensureGateActive = () => {
      if (document.body) document.body.classList.add('gate-active');
    };
    if (document.body) ensureGateActive();
    else document.addEventListener('DOMContentLoaded', ensureGateActive);

    // Build overlay
    const overlay = document.createElement('div');
    overlay.className = 'gate-overlay';
    overlay.innerHTML = `
      <div class="gate-card">
        <div class="gate-eyebrow">${LABELS[slug]}</div>
        <h2 class="gate-title">Mot de passe</h2>
        <p class="gate-sub">Pour entrer dans ce chapitre.</p>
        <input class="gate-input" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" inputmode="text" />
        <div class="gate-error"></div>
        <div class="gate-help">Indice — un mot lié au quartier</div>
        <button class="gate-back" type="button">← Retour à la carte</button>
      </div>
    `;

    // Append once body exists
    const appendOverlay = () => document.body.appendChild(overlay);
    if (document.body) appendOverlay();
    else document.addEventListener('DOMContentLoaded', appendOverlay);

    // Wait for body+overlay to be ready, then wire up
    await new Promise(r => {
      if (document.body) r();
      else document.addEventListener('DOMContentLoaded', r);
    });

    const input = overlay.querySelector('.gate-input');
    const errEl = overlay.querySelector('.gate-error');
    const backBtn = overlay.querySelector('.gate-back');

    setTimeout(() => input.focus(), 100);

    backBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });

    return new Promise(resolve => {
      const tryUnlock = async () => {
        const guess = input.value.trim().toLowerCase();
        if (!guess) return;
        const hash = await sha256(SALT + guess);
        if (hash === HASHES[slug]) {
          unlock(slug);
          // Replace card with reveal
          const card = overlay.querySelector('.gate-card');
          card.innerHTML = `
            <div class="gate-reveal">
              <div class="gate-reveal-title">${LABELS[slug]}</div>
              <div class="gate-reveal-divider"></div>
              <p class="gate-reveal-phrase">${PHRASES[slug]}</p>
            </div>
          `;
          // After reading time, fade out and reveal page
          setTimeout(() => {
            overlay.classList.add('fading');
            setTimeout(() => {
              overlay.remove();
              document.body.classList.remove('gate-active');
              resolve();
            }, 500);
          }, 5000);
        } else {
          errEl.textContent = 'Mot de passe incorrect';
          errEl.classList.add('show');
          input.classList.remove('shake');
          // Force reflow to restart animation
          void input.offsetWidth;
          input.classList.add('shake');
          input.value = '';
          input.focus();
          setTimeout(() => errEl.classList.remove('show'), 2200);
        }
      };

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') tryUnlock();
      });
    });
  }

  // Expose
  window.requireGate = requireGate;
  window.isUnlocked = isUnlocked;
})();
