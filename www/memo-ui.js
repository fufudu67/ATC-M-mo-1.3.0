/* ATC Memo : panneau « ATC » ajouté par-dessus e-NavLog (PC et tablette). Isolé dans un Shadow DOM. */
(() => {
  if (window.__memoUI) return;
  window.__memoUI = true;
  const host = document.createElement('div');
  host.id = 'memo-atc-host';
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
<style>
:host{all:initial}
*{box-sizing:border-box}
:host,.panel{--ink:var(--label,#e8eef5);--ink2:var(--label2,#8fa3b8);--line:var(--sep,#26405c);--surf:var(--card,#14263b);--amb:var(--orange,#ffb43c);--glass:#060c15;--glass2:#0d1726;--ok:#7be0a0;--bad:#ff6b5e;--mono:ui-monospace,'SF Mono',Consolas,'Cascadia Mono',monospace}
.fab{position:fixed;right:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 72px);z-index:2147483000;background:#0d1b2a;color:#ffb43c;border:2px solid #ffb43c;border-radius:28px;padding:12px 20px;font:700 16px system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 18px rgba(0,0,0,.45)}
.fab.alert{animation:p 1.1s ease-in-out infinite;background:#3b2a08}
@keyframes p{50%{box-shadow:0 0 0 8px rgba(255,180,60,.45)}}
@keyframes glow{50%{box-shadow:0 0 0 3px rgba(255,180,60,.55),inset 0 0 22px rgba(255,180,60,.16)}}
@media (prefers-reduced-motion:reduce){.fab.alert,.win.alert,.cell.alert,.dot.alert{animation:none}}
.panel{position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483001;background:var(--bg,#0d1b2a);color:var(--ink);font:15px/1.4 system-ui,'Segoe UI',sans-serif;display:none;flex-direction:column;box-shadow:-8px 0 30px rgba(0,0,0,.5)}
.panel.open{display:flex}
.panel.emb{position:relative;inset:auto;left:auto;right:auto;top:auto;bottom:auto;width:100%;height:auto;z-index:auto;box-shadow:none;background:transparent}.panel.emb .scroll{overflow:visible;flex:none}
.panel.emb .top,.panel.emb .scroll{padding-left:0;padding-right:0}
.panel.emb [data-a=close]{display:none}.panel.emb .title{display:none}.panel.emb .top{justify-content:flex-end}@media (min-width:901px){.panel.emb .clock,.panel.emb .top{display:none}}
.top{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 14px 4px}
.title{font:700 19px system-ui;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.clock{font:700 14px var(--mono);color:#5ad1e6;white-space:nowrap}

/* toolbar */
.bar{display:flex;flex-wrap:wrap;gap:8px;padding:4px 0 8px;align-items:center}
.bar .sp{flex:1}
button{background:var(--surf);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:8px 12px;font:inherit;cursor:pointer;display:inline-flex;align-items:center;gap:7px;min-height:38px}
button svg{width:17px;height:17px;flex:none;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
button:hover{border-color:var(--ink2)}
button:focus-visible{outline:2px solid var(--blue,#5ad1e6);outline-offset:2px}
button.pri{background:color-mix(in srgb,var(--blue,#5ad1e6) 14%,var(--surf));border-color:color-mix(in srgb,var(--blue,#5ad1e6) 55%,var(--line))}
button.ghost{background:transparent;border-color:transparent;color:var(--ink2)}
button.ghost:hover{border-color:var(--line);color:var(--ink)}
.stat{display:flex;align-items:center;gap:8px;color:var(--ink2);font-size:13px;padding:0 2px 8px}
.stat::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--ok);flex:none}.stat.err{color:var(--bad)}.stat.err::before{background:var(--bad)}
.scroll{overflow:auto;padding:4px 0 24px;flex:1}

/* new-instruction bar */
.banner{display:none;position:sticky;top:0;z-index:3;background:var(--amb);color:#1b1200;border-radius:12px;padding:10px 16px;margin:0 0 12px;font:700 20px/1.2 system-ui;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.3)}
.banner small{display:block;font:500 12.5px system-ui;opacity:.8;margin-top:2px}

/* FCU block */
.board{display:flex;flex-direction:column;gap:12px}
.fcu{background:linear-gradient(180deg,var(--glass2),var(--glass));border:1px solid #1d2c42;border-radius:16px;padding:12px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 8px 22px rgba(0,0,0,.28)}
.win{background:#02060c;border:1px solid #16243a;border-radius:10px;padding:10px 14px 9px;min-width:0;cursor:default;position:relative;box-shadow:inset 0 2px 8px rgba(0,0,0,.7)}
.win .lab{font:600 13px system-ui;color:#8fa3b8;display:flex;justify-content:space-between;gap:6px}
.win .val{font:700 clamp(34px,5.2vw,58px)/1.05 var(--mono);letter-spacing:.02em;color:var(--c);text-shadow:0 0 14px color-mix(in srgb,var(--c) 55%,transparent);margin:6px 0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
.win .sub{font:500 12.5px system-ui;color:#9fb0c4;min-height:1.3em}
.win.empty .val{color:#2a3b52;text-shadow:none}
.win.alert{border-color:var(--amb);animation:glow 1.1s ease-in-out infinite;cursor:pointer}
.win.alert .lab::after{content:var(--new,"Nouveau");background:var(--amb);color:#1b1200;border-radius:6px;padding:0 7px;font-size:11.5px;font-weight:700}
.sub.bad{color:var(--bad)}

/* radio and weather row */
.cells{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}
.cell{background:var(--surf);border:1px solid var(--line);border-left:4px solid var(--c);border-radius:12px;padding:10px 14px;min-width:0}
.cell .lab{font:600 13px system-ui;color:var(--ink2)}
.cell .val{font:700 clamp(24px,3vw,32px)/1.1 var(--mono);color:var(--ink);margin:4px 0 2px;font-variant-numeric:tabular-nums;word-break:break-word}
.cell .sub{font:500 12.5px system-ui;color:var(--ink2)}
.cell.empty .val{color:var(--ink2);opacity:.45}
.cell.alert{border-color:var(--amb);border-left-color:var(--amb);animation:glow 1.1s ease-in-out infinite;cursor:pointer}
.sqd{display:flex;gap:5px;margin:5px 0 3px}.sqd i{font:700 26px/1 var(--mono);font-style:normal;background:var(--fill,rgba(127,127,127,.14));border-radius:6px;padding:6px 0;width:30px;text-align:center;color:var(--ink);box-shadow:inset 0 -3px 0 var(--c)}
.cell.empty .sqd i{color:var(--ink2);opacity:.4}

/* runways */
.rwy{background:#2b3038;border-radius:12px;padding:10px 14px 10px 18px;color:#f4f6f8;position:relative;overflow:hidden;min-width:0;border:1px solid #3a414c}
.rwy::before{content:"";position:absolute;left:7px;top:10px;bottom:10px;width:0;border-left:3px dashed rgba(255,255,255,.55)}
.rwy .lab{font:600 13px system-ui;color:#b8c2ce}
.rwy .val{font:800 clamp(30px,4vw,44px)/1.05 var(--mono);letter-spacing:.04em;margin:3px 0 2px}
.rwy .sub{font:500 12.5px system-ui;color:#c9d2dc}
.rwy.empty .val{color:#6b7684}
.dct{background:var(--surf);border:1px solid var(--line);border-left:4px solid var(--c);border-radius:12px;padding:10px 14px;min-width:0}
.dct .lab{font:600 13px system-ui;color:var(--ink2)}.dct .val{font:600 18px/1.3 system-ui;margin-top:4px;word-break:break-word}.dct .sub{font:500 12.5px system-ui;color:var(--ink2);margin-top:2px}.dct.empty .val{opacity:.4}

/* taxi sign */
.sign{background:#0a0a0a;border:3px solid #f2c200;border-radius:10px;padding:10px 16px;color:#f2c200;box-shadow:0 0 0 2px #0a0a0a}
.sign .lab{font:700 12.5px system-ui;background:#f2c200;color:#0a0a0a;display:inline-block;border-radius:4px;padding:1px 8px}
.sign .val{font:700 clamp(18px,2.4vw,24px)/1.35 var(--mono);margin-top:7px;white-space:pre-wrap;word-break:break-word}
.sign.off{opacity:.35;filter:grayscale(1);border-color:#555}.sign.off .lab{background:#666}.sign.empty{opacity:.55}.sign.empty .val{color:#7a6a20}
.sign .sub{font:500 12.5px system-ui;color:#b9a13a;margin-top:2px}

/* clearances */
.clr{background:var(--surf);border:1px solid var(--line);border-radius:14px;padding:12px 16px}
.clr h4{margin:0 0 6px;font:700 15px system-ui;display:flex;justify-content:space-between;gap:8px}.clr h4 span{font:500 12.5px system-ui;color:var(--ink2)}
.cl{display:grid;grid-template-columns:22px 130px 1fr;gap:8px;align-items:baseline;padding:7px 0;border-top:1px solid var(--line)}
.cl:first-of-type{border-top:0}
.cl .ic{width:18px;height:18px;border-radius:50%;display:grid;place-items:center;font:700 11px system-ui;align-self:center}
.cl.ok .ic{background:color-mix(in srgb,var(--ok) 28%,transparent);color:var(--ok)}
.cl.wait .ic{background:color-mix(in srgb,var(--amb) 28%,transparent);color:var(--amb)}
.cl.oth .ic{background:var(--fill,rgba(127,127,127,.2));color:var(--ink2)}
.cl .k{color:var(--ink2);font-size:13.5px}.cl .v{font:600 15.5px/1.35 system-ui;word-break:break-word}.cl.wait .v{color:var(--amb)}
.clr .last{margin-top:8px;padding:9px 12px;border-left:3px solid var(--amb);background:var(--fill,rgba(127,127,127,.12));border-radius:0 8px 8px 0;font:500 15px/1.4 system-ui}
.clr.empty .none{color:var(--ink2);padding:6px 0}
.clr.alert{border-color:var(--amb);animation:glow 1.1s ease-in-out infinite;cursor:pointer}

/* notes and transcript */
.trk{background:var(--surf);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-top:4px}
.trk .nx{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}
.trk .nx .k{font:600 13px system-ui;color:var(--ink2)}
.trk .nx .id{font:700 clamp(26px,3.4vw,36px)/1 var(--mono);color:var(--ink)}
.trk .nx .m{font:600 18px var(--mono);color:var(--ink);font-variant-numeric:tabular-nums}
.trk .nx .m small{font:500 12px system-ui;color:var(--ink2);margin-left:4px}
.trk .tb{height:10px;background:var(--glass2);border:1px solid var(--line);border-radius:6px;position:relative;margin:14px 2px 22px}
.trk .tb i{position:absolute;top:0;bottom:0;left:0;background:var(--amb);border-radius:5px}
.trk .tb u{position:absolute;top:-3px;bottom:-3px;width:2px;background:var(--ink);text-decoration:none}
.trk .tb s{position:absolute;top:14px;font:600 11px system-ui;color:var(--ink2);text-decoration:none;transform:translateX(-50%)}
.trk .rw{display:grid;grid-template-columns:minmax(80px,1.2fr) 1fr 1fr;gap:6px 10px;padding:6px 0;border-top:1px solid var(--line);font:600 14px var(--mono);color:var(--ink);font-variant-numeric:tabular-nums}
.trk .rw b{font:700 14px var(--mono);color:var(--ink)}
.trk .rw.pass{color:var(--ink2);opacity:.6}
.trk .sys{font:500 13.5px system-ui;color:var(--ink2)}

.ainfo{display:inline-block;margin-left:8px;padding:2px 10px;border-radius:8px;background:#6ee7f9;color:#06202a;font:800 .9em var(--mono,monospace);vertical-align:middle}
details{margin:16px 0 0}
summary{cursor:pointer;color:var(--ink);font:700 15px system-ui;padding:6px 2px;list-style:none;display:flex;align-items:center;gap:8px}
summary::-webkit-details-marker{display:none}
summary::before{content:"";width:8px;height:8px;border-right:2px solid var(--ink2);border-bottom:2px solid var(--ink2);transform:rotate(-45deg);transition:transform .15s}
details[open]>summary::before{transform:rotate(45deg)}
summary small{font:500 12.5px system-ui;color:var(--ink2)}
textarea,input,select{width:100%;background:var(--surf);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:9px 11px;font:inherit}
textarea{min-height:92px;resize:vertical}
.hist{list-style:none;margin:6px 0 0;padding:0;display:flex;flex-direction:column;gap:10px}
.hist li{max-width:min(760px,92%);display:flex;flex-direction:column;gap:5px}
.hist .atc{background:var(--surf);border:1px solid var(--line);border-radius:14px 14px 14px 4px;padding:10px 14px;font-size:16.5px;line-height:1.45}
.hist .pil{align-self:flex-end;background:color-mix(in srgb,var(--blue,#5ad1e6) 18%,var(--surf));border:1px solid color-mix(in srgb,var(--blue,#5ad1e6) 40%,var(--line));border-radius:14px 14px 4px 14px;padding:8px 14px;font-size:15px;color:var(--ink)}
.hist li:has(.pil){align-self:flex-end}.hist li:has(.pil) .meta{text-align:right}
.hist .meta{font-size:12px;color:var(--ink2);padding:0 6px}
.hist li.none{color:var(--ink2);font-size:14px}
.meta{font-size:12px;color:var(--ink2)}
mark{color:#101820;border-radius:5px;padding:0 5px;font-weight:700}
mark.hd{background:#5ad1e6}mark.al{background:#ffb43c}mark.sp{background:#c9a7ff}mark.sq{background:#7be0a0}mark.fq{background:#fff}mark.rw{background:none;color:inherit;box-shadow:inset 0 0 0 2px var(--ink2)}

/* dialogs */
.modal{position:absolute;inset:0;background:rgba(5,10,18,.78);display:none;align-items:flex-start;justify-content:center;padding:40px 14px;overflow:auto;z-index:5}
.modal.open{display:flex}
.card{background:var(--bg,#0d1b2a);border:1px solid var(--line);border-radius:14px;padding:16px 18px;width:min(560px,100%)}
.card h3{margin:0 0 8px;font:700 18px system-ui;color:var(--amb)}
.card label{display:block;margin:10px 0 3px;color:var(--ink2);font-size:13px}
.card .atis{white-space:pre-wrap;font-size:17px;margin:6px 0}
.lrow{display:flex;gap:8px;align-items:center;padding:4px 0}.lrow span{flex:1}

@media (max-width:820px){.fcu .val{font-size:clamp(28px,7vw,44px)}.cells{grid-template-columns:repeat(2,1fr)}}
@media (max-width:560px){.fcu{grid-template-columns:1fr}.cells{grid-template-columns:1fr}.cl{grid-template-columns:22px 1fr}.cl .v{grid-column:2}}
</style>
<button class="fab" id="fab" style="display:none">ATC</button>
<div class="panel" id="panel">
  <div class="top"><div class="title" id="head">ATC</div><div class="clock" id="clock"></div></div>
  <div class="bar" id="bar"></div>
  <div class="stat" id="stat">Démarrage…</div>
  <div class="scroll">
    <div class="banner" id="banner"></div>
    <div class="board" id="grid"></div>
    <details open data-k="trk"><summary><span data-t="Suivi du vol">Suivi du vol</span></summary><div class="trk" id="trk"></div></details>
    <details open data-k="pad"><summary><span data-t="Scratchpad">Scratchpad</span></summary><textarea id="pad" rows="4" data-tp="Notes de vol…" placeholder="Notes de vol…"></textarea></details>
    <details open data-k="hist"><summary><span data-t="Échanges">Échanges</span> <small id="hcount"></small></summary><ul class="hist" id="hist"></ul></details>
  </div>
  <div class="modal" id="modal"><div class="card" id="card"></div></div>
</div>`;
  const $ = id => root.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const api = (p, o) => fetch(p, o).then(r => r.json());
  const post = (p, b) => api(p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b || {}) });
  let S = null, skew = 0, open = false, sig = '', first = true, ac = null, launcher = [], isLocal = false;

  /* ---------- langue ---------- */
  let lang = 'fr';
  try { lang = localStorage.getItem('memo_lang') || 'fr'; } catch (e) {}
  const T = (s, ...a) => (window.ATC_I18N ? window.ATC_I18N.tr(lang, s, ...a) : s);
  function applyLang() {
    root.querySelectorAll('[data-t]').forEach(el => { el.textContent = T(el.dataset.t); });
    root.querySelectorAll('[data-tp]').forEach(el => { el.placeholder = T(el.dataset.tp); });
    $('panel').style.setProperty('--new', JSON.stringify(T('Nouveau')));
    try { document.documentElement.lang = lang; } catch (e) {}
  }
  function setLang(l) {
    if (!l || l === lang) return;
    lang = l; try { localStorage.setItem('memo_lang', l); } catch (e) {}
    applyLang(); renderBar(); tick();
  }

  /* ---------- ouverture / fermeture ---------- */
  /* the panel fills the screen up to e-NavLog's side banner (or down to its bottom bar on a narrow screen) */
  const fit = () => {
    const p = $('panel'), tb = document.querySelector('.shell > .tabbar') || document.querySelector('.tabbar');
    let l = 0, b = 0;
    if (tb) {
      const r = tb.getBoundingClientRect();
      if (r.width < innerWidth * 0.5 && r.height > innerHeight * 0.4) l = Math.round(r.right);
      else if (r.width >= innerWidth * 0.5 && r.top > innerHeight / 2) b = Math.round(innerHeight - r.top);
    }
    p.style.left = l + 'px'; p.style.bottom = b + 'px';
  };
  addEventListener('resize', () => { if (open) fit(); });
  const setOpen = v => { if (embedded) return; open = v; if (v) fit(); $('panel').classList.toggle('open', v); $('fab').style.display = 'none'; if (v) poll(); };
  /* The panel is a normal tab of e-NavLog: it is moved into the tab area (#atcHost) and parked when the tab is left. */
  let embedded = false, hostEl = null;
  const sizeHost = () => {
    if (!embedded || !hostEl || !hostEl.isConnected) return;
    const sc = document.getElementById('scroller'), top = hostEl.getBoundingClientRect().top;
    const room = (sc ? sc.getBoundingClientRect().bottom : innerHeight) - top - 8;
    host.style.height = 'auto'; host.style.minHeight = '320px';   /* the page scrolls, not the panel (the flight banner stays above) */
  };
  addEventListener('resize', sizeHost);
  window.__atcMount = el => {
    if (!el) return;
    hostEl = el; embedded = true; open = true;
    el.appendChild(host); host.style.display = 'block'; host.style.width = '100%';
    const p = $('panel'); p.classList.add('emb', 'open'); p.style.left = p.style.bottom = '';
    sizeHost(); setTimeout(sizeHost, 60);
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); } catch (e) {}
    poll();
  };
  window.__atcPark = () => {
    if (host.parentNode !== document.body) document.body.appendChild(host);
    host.style.display = 'none'; embedded = false; open = false; hostEl = null;
    $('panel').classList.remove('emb', 'open');
  };
  $('fab').onclick = () => { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); } catch (e) {} setOpen(true); };
  const sec = JSON.parse(localStorage.getItem('memo_sec') || '{}');
  root.querySelectorAll('details').forEach(d => { if (sec[d.dataset.k] === false) d.open = false; d.addEventListener('toggle', () => { sec[d.dataset.k] = d.open; localStorage.setItem('memo_sec', JSON.stringify(sec)); }); });

  /* ---------- affichage ---------- */
  const ago = t => { const s = (Date.now() - skew - Date.parse(t)) / 1000; if (!(s >= 0)) return ''; return s < 90 ? T('à l’instant') : s < 3600 ? T('il y a {0} min', Math.round(s / 60)) : T('il y a {0} h {1} min', Math.floor(s / 3600), Math.round(s % 3600 / 60)); };
  const hms = s => { s = Math.floor(s) % 86400; const p = n => String(n).padStart(2, '0'); return p(Math.floor(s / 3600)) + ':' + p(Math.floor(s % 3600 / 60)) + ':' + p(s % 60); };
  function mark(text, spans) {
    let out = '', pos = 0;
    for (const [a, b, t] of spans) { if (a < pos) continue; out += esc(text.slice(pos, a)) + '<mark class="' + t + '">' + esc(text.slice(a, b)) + '</mark>'; pos = b; }
    return out + esc(text.slice(pos));
  }

  /* ---------- tiles → board ---------- */
  const subOf = t => esc([t.sub, t.t ? ago(t.t) : ''].filter(Boolean).join(' · '));
  const cls = t => (t.alert ? ' alert' : '') + (t.empty ? ' empty' : '');
  const lab = t => esc(t.label.split('  (')[0]);
  const win = t => `<div class="win${cls(t)}" style="--c:${t.color}"><div class="lab">${lab(t)}</div><div class="val">${esc(t.empty ? '- - -' : t.v)}</div><div class="sub${t.bad ? ' bad' : ''}">${subOf(t)}</div></div>`;
  const cell = t => `<div class="cell${cls(t)}" style="--c:${t.color}"><div class="lab">${lab(t)}</div>${t.k === 'sqk' && /^\d{4}$/.test(t.v) ? `<div class="sqd">${t.v.split('').map(d => `<i>${d}</i>`).join('')}</div>` : `<div class="val">${esc(t.v)}</div>`}<div class="sub${t.bad ? ' bad' : ''}">${subOf(t)}</div></div>`;
  const rwy = t => `<div class="rwy${t.empty ? ' empty' : ''}"><div class="lab">${lab(t)}</div><div class="val">${esc(t.v)}</div><div class="sub">${subOf(t)}</div></div>`;
  const dct = t => `<div class="dct${t.empty ? ' empty' : ''}" style="--c:${t.color}"><div class="lab">${lab(t)}</div><div class="val">${esc(t.v)}</div><div class="sub">${subOf(t)}</div></div>`;
  const sign = t => `<div class="sign${t.empty ? ' empty' : ''}${t.inactive ? ' off' : ''}"><span class="lab">${lab(t)}</span><div class="val">${esc(t.inactive ? T('Inactif : avion en vol') : t.empty ? T('Pas encore donné') : t.v)}</div></div>`;
  function clrBox(t) {
    const rows = [], lines = String(t.v || '').split('\n');
    let last = '';
    lines.forEach((l, n) => {
      if (!l.trim() || l === '—') return;
      const mm = /^(✔|…|•|→)\s+(.*)$/.exec(l);
      if (!mm) return;
      const ic = mm[1], body = mm[2], p = body.indexOf(' : ');
      if (p < 0 || ic === '→' || (ic === '…' && lines[n - 1] === '')) { last = body; return; }
      const kind = ic === '✔' ? 'ok' : ic === '…' ? 'wait' : 'oth';
      rows.push(`<div class="cl ${kind}"><span class="ic">${ic === '✔' ? '✓' : ic === '…' ? '…' : '•'}</span><span class="k">${esc(body.slice(0, p))}</span><span class="v">${esc(body.slice(p + 3))}</span></div>`);
    });
    return `<div class="clr${t.alert ? ' alert' : ''}${t.empty ? ' empty' : ''}"><h4>${esc(T('Autorisations et procédures'))}<span>${t.t ? ago(t.t) : ''}</span></h4>${rows.join('') || (t.empty ? '<div class="none">' + esc(T('Pas encore donné.')) + '</div>' : '')}${last ? `<div class="last">${esc(last)}</div>` : ''}</div>`;
  }
  function board(T) {
    const by = {}; T.forEach(t => by[t.k] = t);
    const g = ks => ks.map(k => by[k]).filter(Boolean);
    return `<div class="fcu">${g(['spd', 'hdg', 'alt']).map(win).join('')}</div>
<div class="cells">${g(['sqk', 'frq', 'qnh', 'atis']).map(cell).join('')}</div>
<div class="cells">${by.rwd ? rwy(by.rwd) : ''}${by.rwa ? rwy(by.rwa) : ''}${by.dct ? dct(by.dct) : ''}</div>
${by.clr ? clrBox(by.clr) : ''}${by.push ? sign(by.push) : ''}${by.tax && !by.tax.inactive ? sign(by.tax) : ''}`;
  }
  function render() {
    if (!S) return;
    $('head').textContent = S.head;
    const st = $('stat'); st.textContent = S.status[0]; st.className = 'stat' + (S.status[1] ? ' err' : '');
    $('grid').innerHTML = board(S.tiles);
    try {
      const P = S.progress || { lines: [], frac: 0, marks: [] }, nx = P.lines.find(l => l.tag === 'next'), t = $('trk');
      if (!nx) {
        const m = P.lines.filter(l => l.tag === 'sys' && l.text).map(l => esc(l.label + l.text));
        t.innerHTML = '<div class="sys">' + (m.join('<br>') || esc(T('Pas de plan de vol.'))) + '</div>';
      } else {
        const dist = l => (l.cols.length === 1 ? -1 : l.tag === 'arr' ? 1e9 : parseFloat(l.cols[1]) || 1e8);
        const rows = P.lines.filter(l => l.cols && l !== nx).sort((a, b) => dist(a) - dist(b)).map(l => {
          const c = l.cols, pass = c.length === 1;
          return `<div class="rw${pass ? ' pass' : ''}"><b>${esc(l.tag === 'arr' ? T('Arrivée') : (l.label || c[0]))}</b><span>${esc(pass ? c[0] : c[1] || '')}</span><span>${esc(pass ? '' : c[2] || '')}</span></div>`;
        }).join('');
        t.innerHTML = `<div class="nx"><span class="k">${esc(T('Prochain point'))}</span><span class="id">${esc(nx.cols[0])}</span><span class="m">${esc(nx.cols[1])}</span><span class="m">${esc(nx.cols[2])}<small>ETA</small></span></div>`
          + `<div class="tb"><i style="width:${(P.frac * 100).toFixed(1)}%"></i>${P.marks.map(([f, n]) => `<u style="left:${(f * 100).toFixed(1)}%"></u><s style="left:${(f * 100).toFixed(1)}%">${esc(n)}</s>`).join('')}</div>` + rows;
      }
    } catch (e) { console.error('[atc] suivi', e); }
    const al = S.tiles.filter(t => t.alert), bn = $('banner');
    if (al.length) { bn.style.display = 'block'; bn.innerHTML = esc(al.map(t => (t.k === 'clr' ? T('Autorisation') : t.k === 'frq' ? T('Fréquence') : t.label.split('  (')[0]) + (t.k === 'clr' && !t.short ? '' : ' ' + (t.short || t.v))).join(' · ')) + '<small>' + esc(T('Nouvelle instruction : touchez pour valider')) + '</small>'; } else bn.style.display = 'none';
    $('fab').classList.toggle('alert', al.length > 0);
    try { window.dispatchEvent(new CustomEvent('enl-atc', { detail: { alert: al.length > 0 } })); } catch (e) {}
    $('hist').innerHTML = S.hist.length ? S.hist.map(m => `<li>${m.pil ? `<div class="pil">${esc(m.pil)}</div>` : ''}${m.atc ? `<div class="atc">${mark(m.atc, m.spans)}</div>` : ''}<div class="meta">${esc(m.who)}${m.freq ? ' · ' + esc(m.freq) : ''} · ${esc((m.t || '').slice(11, 16))} Z</div></li>`).join('') : '<li class="none">' + esc(T('Aucun échange pour l’instant.')) + '</li>';
    const hc = $('hcount'); if (hc) hc.textContent = S.hist.length ? T('{0} messages', S.hist.length) : '';
    renderBar();
  }
  function renderBar() {
    const f = S ? S.flight : { orig: '', dest: '' };
    const pins = launcher.map((e, i) => e.pin ? `<button data-l="${i}">${esc(e.name)}</button>` : '').join('');
    const I = { atis: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 16 0"/><path d="M7.5 12a4.5 4.5 0 0 1 9 0"/><circle cx="12" cy="12" r="1.2"/><path d="M12 13v7"/></svg>', chart: '<svg viewBox="0 0 24 24"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></svg>', app: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>', cog: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/></svg>' };
    const o = f.orig || T('départ'), d = f.dest || T('arrivée');
    $('bar').innerHTML = `<button class="pri" data-a="atis1">${I.atis}ATIS ${esc(o)}</button><button class="pri" data-a="atis0">${I.atis}ATIS ${esc(d)}</button><button class="pri" data-a="ch1">${I.chart}${esc(T('Charts {0}', o))}</button><button class="pri" data-a="ch0">${I.chart}${esc(T('Charts {0}', d))}</button>${pins}<span class="sp"></span><button class="ghost" data-a="launcher">${I.app}${esc(T('Lanceur'))}</button><button class="ghost" data-a="settings">${I.cog}${esc(T('Réglages'))}</button><button class="ghost" data-a="close">✕ ${esc(T('Fermer'))}</button>`;
  }
  function tick() {
    const c = $('clock');
    if (S && S.sim && S.sim.zulu != null) {
      const dt = (Date.now() - skew - S.sim.at) / 1000;
      c.textContent = 'UTC ' + hms(S.sim.zulu + dt) + (S.sim.local != null ? '   ' + T('Local avion') + ' ' + hms(S.sim.local + dt) : '') + '  (sim)';
    } else { const n = new Date(); c.textContent = 'UTC ' + n.toISOString().slice(11, 19) + '   ' + T('Heure PC') + ' ' + n.toTimeString().slice(0, 8); }
    /* embedded as a tab: the same text is also shown at the top right of the app bar (see #atcNavClock) */
    try { const nc = document.getElementById('atcNavClock'); if (nc) nc.textContent = c.textContent.replace(/\s{2,}/g, ' · '); } catch (e) {}
  }
  function beep() { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 880; g.gain.value = .15; o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + .2); } catch (e) {} }

  /* ---------- données ---------- */
  async function poll() {
    try {
      S = await api('/api/memo/state');
      skew = Date.now() - S.now;
      if (S.lang) setLang(S.lang);
      const s2 = S.tiles.filter(t => t.alert).map(t => t.k + t.v + t.t).join('|');
      if (!first && s2 && s2 !== sig && S.cfg.beep) beep();
      sig = s2; first = false;
      render();
    } catch (e) { console.error('[atc]', e); $('stat').textContent = T('e-NavLog ne répond pas…'); }
  }
  setInterval(() => poll(), 1500);
  setInterval(tick, 1000);
  const ack = () => post('/api/memo/ack').then(poll);
  $('banner').onclick = ack;
  $('grid').onclick = e => { if (e.target.closest('.win.alert,.cell.alert,.clr.alert')) ack(); };

  /* ---------- scratchpad ---------- */
  let padTimer = null;
  api('/api/memo/scratch').then(r => { $('pad').value = r.text || ''; });
  $('pad').oninput = () => { clearTimeout(padTimer); padTimer = setTimeout(() => post('/api/memo/scratch', { text: $('pad').value }), 800); };

  /* ---------- fenêtres ---------- */
  const modal = html => { $('card').innerHTML = html; $('modal').classList.add('open'); };
  const closeModal = () => $('modal').classList.remove('open');
  $('modal').onclick = e => { if (e.target === $('modal')) closeModal(); };

  async function showAtis(dep) {
    modal('<h3>ATIS</h3><div class="atis">' + esc(T('Chargement…')) + '</div>');
    const r = await api('/api/memo/atis?dep=' + (dep ? 1 : 0));
    modal(`<h3>ATIS ${esc(T(dep ? 'départ' : 'arrivée'))}${r.icao ? ' · ' + esc(r.icao) : ''}${r.info ? ` <span class="ainfo">INFO ${esc(r.info)}</span>` : ''}</h3><div class="atis">${esc(r.error || r.atis)}</div>${r.runway ? `<div class="meta">${esc(T('Piste en service : {0}', r.runway))}</div>` : ''}${r.metar ? `<div class="meta">${esc(r.metar)}</div>` : ''}<p><button data-a="x">${esc(T('Fermer'))}</button></p>`);
  }
  async function showSettings() {
    const c = await api('/api/memo/settings');
    const langs = c.langs || (window.ATC_I18N ? window.ATC_I18N.LANGS : []), cur = c.lang || 'auto';
    const opt = (v, txt, sel) => `<option value="${esc(v)}"${sel ? ' selected' : ''}>${esc(txt)}</option>`;
    modal(`<h3>${esc(T('Réglages ATC'))}</h3>${c.local ? '' : `<div class="meta">${esc(T('Les réglages se modifient depuis le PC uniquement.'))}</div>`}
<label>${esc(T('Langue'))}${T('Langue') === 'Language' ? '' : ' · Language'}</label><select id="s_lang">${opt('auto', T('Automatique (langue du système)'), cur === 'auto')}${langs.map(([code, name]) => opt(code, name, cur === code)).join('')}</select>
<label>${esc(T('Clé développeur SayIntentions'))}${c.hasKey ? esc(T(' (déjà enregistrée : laissez vide pour la garder)')) : ''}</label><input id="s_key" type="password" autocomplete="off">
<label>${esc(T('Adresse du PC SayIntentions (localhost si c’est ce PC)'))}</label><input id="s_host" value="${esc(c.host)}">
<label>${esc(T('Identifiant SimBrief (pseudo ou numéro de pilote)'))}</label><input id="s_sb" value="${esc(c.sb)}">
<label>${esc(T('Adresse de Navigraph Charts'))}</label><input id="s_ng" value="${esc(c.ng)}">
<label>${esc(T('Communications à afficher dans les échanges'))}</label><select id="s_mode">${opt('atc', T('Radio ATC (vous + ATC), sans équipage'), c.mode === 'atc')}${opt('all', T('Tout, équipage compris'), c.mode === 'all')}</select>
<label><input id="s_beep" type="checkbox" style="width:auto"${c.beep ? ' checked' : ''}> ${esc(T('Bip à chaque nouvelle instruction'))}</label>
<p><button class="pri" data-a="save">${esc(T('Enregistrer'))}</button> <button data-a="x">${esc(T('Annuler'))}</button></p>`);
  }
  async function showLauncher() {
    const r = await api('/api/memo/launcher'); launcher = r.list; isLocal = r.local; renderBar();
    modal(`<h3>${esc(T('Lanceur d’applications'))}</h3><div class="meta">${esc(T('Auto : lancée à chaque démarrage de l’application. Barre : bouton dans la barre du haut.'))}</div>
${launcher.map((e, i) => `<div class="lrow"><span>${esc(e.name)}</span><label><input type="checkbox" data-u="${i}" data-f="auto" style="width:auto"${e.auto ? ' checked' : ''}> Auto</label><label><input type="checkbox" data-u="${i}" data-f="pin" style="width:auto"${e.pin ? ' checked' : ''}> ${esc(T('Barre'))}</label><button data-l="${i}">${esc(T('Lancer'))}</button><button data-d="${i}">✕</button></div>`).join('')}
${r.local ? `<label>${esc(T('Ajouter une application (chemin du programme ou du raccourci)'))}</label><div class="lrow"><input id="l_path" placeholder="C:\\Program Files\\…\\programme.exe"><button data-a="browse">${esc(T('Parcourir…'))}</button></div><div class="lrow"><input id="l_name" placeholder="${esc(T('Nom à afficher'))}"><button class="pri" data-a="add">${esc(T('Ajouter'))}</button></div>` : `<div class="meta">${esc(T('Le lanceur se gère depuis le PC uniquement.'))}</div>`}
<p><button data-a="launchAll">${esc(T('Tout lancer'))}</button> <button data-a="x">${esc(T('Fermer'))}</button></p>`);
  }
  const copyAndOpen = dep => {
    const icao = S && S.flight[dep ? 'orig' : 'dest'];
    if (icao && navigator.clipboard) navigator.clipboard.writeText(icao).catch(() => {});
    $('stat').textContent = icao ? T('{0} copié : collez-le dans la recherche de Navigraph', icao) : T('Aucun vol en cours : cherchez l’aéroport dans Navigraph');
    /* same behaviour as the Charts tab: window inside the PC app, installed app on Android / iPad (Shortcut) */
    if (typeof window.__enlNg === 'function') window.__enlNg(); else window.open((S && S.cfg.ng) || 'https://charts.navigraph.com', '_blank');
  };

  root.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    const a = b.dataset.a;
    if (b.dataset.l !== undefined) { await post('/api/memo/launcher', { action: 'launch', i: +b.dataset.l }); return; }
    if (b.dataset.d !== undefined) { await post('/api/memo/launcher', { action: 'remove', i: +b.dataset.d }); showLauncher(); return; }
    if (a === 'close') setOpen(false);
    else if (a === 'x') closeModal();
    else if (a === 'atis1') showAtis(true); else if (a === 'atis0') showAtis(false);
    else if (a === 'ch1') copyAndOpen(true); else if (a === 'ch0') copyAndOpen(false);
    else if (a === 'settings') showSettings();
    else if (a === 'launcher') showLauncher();
    else if (a === 'save') {
      const r = await post('/api/memo/settings', { key: $('s_key').value, host: $('s_host').value, sb: $('s_sb').value, ng: $('s_ng').value, mode: $('s_mode').value, beep: $('s_beep').checked, lang: $('s_lang').value });
      if (r.error) alert(r.error); else { closeModal(); poll(); }
    } else if (a === 'browse') { const r = await post('/api/memo/launcher', { action: 'browse' }); if (r.path) $('l_path').value = r.path; }
    else if (a === 'add') { const p = $('l_path').value.trim(); if (p) { await post('/api/memo/launcher', { action: 'add', path: p, name: $('l_name').value.trim() }); showLauncher(); } }
    else if (a === 'launchAll') await post('/api/memo/launcher', { action: 'launchAll' });
  });
  root.addEventListener('change', async e => {
    const t = e.target; if (t.dataset.u === undefined) return;
    const i = +t.dataset.u, cur = launcher[i]; cur[t.dataset.f] = t.checked;
    const r = await post('/api/memo/launcher', { action: 'update', i, auto: cur.auto, pin: cur.pin }); launcher = r.list || launcher; renderBar();
  });

  api('/api/memo/launcher').then(r => { launcher = r.list; isLocal = r.local; renderBar(); }).catch(() => {});
  applyLang(); tick(); poll();
  window.dispatchEvent(new Event('enl-atc-ready'));
})();
