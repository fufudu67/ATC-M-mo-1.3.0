// ATC Memo : mémo ATC intégré (SayIntentions.AI). Aucune dépendance : Node uniquement.
'use strict';
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const I18N = require('./www/i18n.js');

const SAPI = process.env.MEMO_SAPI_BASE || 'https://apipri.sayintentions.ai/sapi/';
const ALERT = { hdg: 'Cap', alt: 'Altitude', spd: 'Vitesse', sqk: 'Squawk', frq: 'Fréquence', dct: 'Direct', clr: 'Autorisation' };
const COLORS = { hdg: '#5ad1e6', alt: '#ffb43c', spd: '#c9a7ff', sqk: '#7be0a0', frq: '#ffffff', qnh: '#6ea8ff', rwd: '#2dd4bf', rwa: '#fb923c', dct: '#ff7eb6', tax: '#cbd5e1', clr: '#a3e635', push: '#f2c200', atis: '#6ee7f9' };
const CLR_TTL = { 'Alignement': 3, 'Décollage': 6, 'Remise de gaz': 6, 'Piste': 30, 'SID': 45, 'Atterrissage': 15 };
const SUPERSEDE = { 'Décollage': ['Alignement', 'Piste'], 'Atterrissage': ['Remise de gaz', 'Piste'], 'Remise de gaz': ['Atterrissage'] };
const CLR_ORDER = ['Décollage', 'Atterrissage', 'Alignement', 'Remise de gaz', 'Piste', 'SID', 'STAR', 'Transition', 'Approche'];
const NATO1 = { alpha: 'a', bravo: 'b', charlie: 'c', delta: 'd', echo: 'e', foxtrot: 'f', golf: 'g', hotel: 'h', juliett: 'j', juliet: 'j', kilo: 'k', lima: 'l', mike: 'm', november: 'n', oscar: 'o', papa: 'p', quebec: 'q', romeo: 'r', sierra: 's', tango: 't', uniform: 'u', victor: 'v', whiskey: 'w', xray: 'x', yankee: 'y', zulu: 'z' };
const GSX_ST = { 1: 'non disponible', 2: 'disponible', 3: 'non autorisé', 4: 'demandé', 5: 'en cours', 6: 'terminé' };

/* ---------- texte : chiffres et lettres ---------- */
const D = { zero: 0, one: 1, two: 2, three: 3, tree: 3, four: 4, five: 5, fife: 5, six: 6, seven: 7, eight: 8, nine: 9, niner: 9 };
const DW = Object.keys(D).join('|');
const RUN = new RegExp('\\b(?:' + DW + ')(?:\\s+(?:(?:point|decimal)\\s+)?(?:' + DW + '))*\\b', 'gi');
const th = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const title = s => s.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());

function disp(s) {
  s = String(s || '').replace(/(?<=[A-Za-z0-9])-(?=[A-Za-z0-9])/g, ' ').replace(/(?<=\d),(?=\d{3}\b)/g, '');
  s = s.replace(RUN, m => m.split(/\s+/).map(w => { w = w.toLowerCase(); return (w === 'point' || w === 'decimal') ? '.' : D[w]; }).join(''));
  s = s.replace(/\b\d(?: \d)+\b/g, m => m.replace(/ /g, ''));
  s = s.replace(/(\d+)\s+thousand(?:\s+(\d+)\s+hundred)?/gi, (m, a, b) => String(a * 1000 + (b ? b * 100 : 0)));
  s = s.replace(/(\d+)\s+hundred\b/gi, (m, a) => String(a * 100));
  s = s.replace(/flight level\s+(\d+)/gi, 'FL$1');
  return s.replace(/(runway\s+\d{1,2})\s+(left|right|center|centre)\b/gi, (m, r, x) => r + x[0].toUpperCase());
}

const ALT = /\b(climb|descend|maintain|altitude|initially|initial|expect)(?:\s+(?:and|to|maintain|initial|climb|altitude|via|sid|except|at|initially)){0,6}\s+(?:(flight level|fl)\s*)?(\d{2,5})(?!\s*(?:knots|kts|\d)|\.\d)/g;
const HL = new RegExp(
  'heading\\s+(?<hd>\\d{1,3})\\b' +
  '|\\b(?:climb|descend|maintain|altitude|initially|initial|expect)(?:\\s+(?:and|to|maintain|initial|climb|altitude|via|sid|except|at|initially)){0,6}\\s+(?<al>FL\\d{2,3}|\\d{4,5})\\b' +
  '|(?<spp>(?:speed|reduce|increase|slow)(?:\\s+speed)?(?:\\s+to)?\\s+)?\\b(?<sp>\\d{2,3})\\s*(?:knots|kts)' +
  '|squawk(?:\\s+code)?\\s+(?<sq>\\d{4})\\b' +
  '|\\b(?<fq>\\d{3}\\.\\d{1,3})\\b' +
  '|runway\\s+(?<rw>\\d{1,2}[LRC]?)\\b', 'gid');

/** Valeurs à surligner dans une phrase : [début, fin, étiquette]. */
function spans(text) {
  const out = [];
  for (const m of text.matchAll(HL)) {
    const g = m.groups;
    if (g.sp !== undefined) {
      if (!g.spp && g.sp.length !== 3) continue;
      out.push([m.indices.groups.sp[0], m.index + m[0].length, 'sp']);
      continue;
    }
    for (const t of ['hd', 'al', 'sq', 'fq', 'rw']) if (g[t] !== undefined) { out.push([m.indices.groups[t][0], m.indices.groups[t][1], t]); break; }
  }
  return out.sort((a, b) => a[0] - b[0]);
}

function qnhPair(txt) {
  const v = parseFloat(txt); let inhg;
  if (txt.includes('.')) inhg = v;
  else if (v >= 2800 && v <= 3100) inhg = v / 100;
  else if (v >= 900 && v <= 1100) return [Math.round(v), v / 33.8639];
  else return null;
  return [Math.round(inhg * 33.8639), inhg];
}

const DCT_STOP = new Set(['the', 'ils', 'final', 'visual', 'approach', 'traffic', 'for', 'rnav', 'vor', 'localizer', 'runway', 'sequence', 'your', 'own',
  'and', 'then', 'when', 'able', 'flight', 'route', 'routing', 'departure', 'arrival', 'speed', 'heading']);

/** Procédures citées par l'ATC : [catégorie, valeur, état] ; '*' = phrase brute. */
function clearances(d) {
  const out = [];
  for (const sent of d.split(/(?<=[.!?])\s+/)) {
    const low = sent.toLowerCase();
    const cl = /\bcleared?\b|line up and wait|go around|\bproceed\b/.test(low);
    const st = cl ? 'autorisé' : /\bexpect/.test(low) ? 'attendu' : null;
    const rw = low.match(/\brunway\s+(\d{1,2}[lrc]?)\b/);
    const r = rw ? 'piste ' + rw[1].toUpperCase() : '';
    if (cl && /take-?\s?off/.test(low)) out.push(['Décollage', r, 'autorisé']);
    else if (/cleared? (?:to )?land/.test(low)) out.push(['Atterrissage', r, 'autorisé']);
    else if (low.includes('line up and wait')) out.push(['Alignement', r, 'autorisé']);
    if (low.includes('go around') && cl) out.push(['Remise de gaz', '', 'autorisé']);
    const a = low.match(/\b(ils|rnav|rnp|vor|ndb|localizer|localiser|visual|lda|sdf|gps)\b(?:\s+([b-z]|whiskey|xray|x-ray|yankee|zulu)\b)?(?:\s+(?:dme|approach|rwy|runway))*(?:\s+(\d{1,2}[lrc]?))?/);
    if (a && st && /approach|\bils\b|localizer|localiser/.test(low))
      out.push(['Approche', [a[1].toUpperCase(), (a[2] || '').length > 1 ? a[2][0].toUpperCase() : (a[2] || '').toUpperCase(), (a[3] || '').toUpperCase()].filter(Boolean).join(' '), st]);
    else if (rw && st === 'attendu') out.push(['Piste', rw[1].toUpperCase(), 'attendu']);
    for (const m of low.matchAll(/\b([a-z]{3,6}\d[a-z]?)\s+(arrival|departure)\b/g)) out.push([m[2] === 'arrival' ? 'STAR' : 'SID', m[1].toUpperCase(), st || 'indiqué']);
    /* « descend via NIXI5B », « climb via the PIKA2A », « join DAKO1C » : procedure named without the word arrival/departure */
    let proc = false;
    for (const m of low.matchAll(/\b(?:via|follow(?:ing)?|join|fly|resume)\s+(?:the\s+)?([a-z]{3,6}\d[a-z]?)\b/g)) {
      if (new RegExp('\\b' + m[1] + '\\s+(?:arrival|departure)\\b').test(low)) continue;
      const kd = /descend|arrival|\bstar\b|approach/.test(low) ? 'STAR' : /climb|departure|\bsid\b|take-?off/.test(low) ? 'SID' : '';
      if (kd) { out.push([kd, m[1].toUpperCase(), st || 'autorisé']); proc = true; }
    }
    if (proc && !st) out.push(['*', sent.trim(), 'autorisé']);
    const t = low.match(/\b(?!(?:the|your|a|that|this)\b)([a-z]{3,6})\s+transition\b/);
    if (t) out.push(['Transition', t[1].toUpperCase(), st || 'indiqué']);
    if (st) out.push(['*', sent.trim(), st]);
  }
  return out;
}

/** Instructions extraites d'un message ATC : [clé, valeur, détail]. */
/** Lettre d'information d'un ATIS (« information Alpha », « ATIS B », « info Q »…), '' si introuvable. */
function atisLetter(txt, a) {
  for (const k of ['atis_letter', 'atis_code', 'atis_info', 'information', 'info', 'letter']) {
    const v = a && typeof a[k] === 'string' ? a[k].trim() : '';
    if (v) { const w = v.toLowerCase().replace(/[^a-z]/g, ''); const L = w.length === 1 ? w : NATO1[w === 'alfa' ? 'alpha' : w]; if (L) return L.toUpperCase(); }
  }
  const t = String(txt || '').replace(/x-ray/gi, 'xray'), names = Object.keys(NATO1).concat('alfa').join('|');
  let x = t.match(new RegExp('\\b(?:information|info|atis)\\W{0,3}(?:(?:information|info)\\W{0,3})?(' + names + ')\\b', 'i'));
  if (x) { const w = x[1].toLowerCase(); return (NATO1[w === 'alfa' ? 'alpha' : w] || '').toUpperCase(); }
  x = t.match(/\b(?:[Ii]nformation|[Ii]nfo|ATIS)\W{0,3}([A-Z])\b(?![a-z'])/);
  if (x) return x[1];
  x = t.match(new RegExp('\\b(' + names + ')\\b(?=\\W{0,3}(?:is\\s+)?(?:the\\s+)?(?:current|now|atis|information))', 'i'));
  if (x) { const w = x[1].toLowerCase(); return (NATO1[w === 'alfa' ? 'alpha' : w] || '').toUpperCase(); }
  return '';
}
/** Heure d'observation d'un ATIS (« time 1700 », « 1700Z », « information T 1700 »), au format 1700Z, '' si introuvable. */
function atisTime(txt) {
  const t = String(txt || '');
  const x = t.match(/\btime\W{0,3}([01]\d|2[0-3])([0-5]\d)\b/i) || t.match(/\b([01]\d|2[0-3])([0-5]\d)\s?(?:Z|UTC|zulu)\b/i)
    || t.match(/\b(?:information|info)\W{1,4}(?:[A-Za-z]+\W{1,4})?([01]\d|2[0-3])([0-5]\d)\b/i);
  return x ? x[1] + x[2] + 'Z' : '';
}
function parse(m) {
  if (/^INTERCOM/i.test(m.channel || '')) return [];
  const raw = String(m.outgoing_message_english || m.outgoing_message || '').trim();
  if (!raw) return [];
  const d = disp(raw), n = d.toLowerCase(), out = [];
  let x = n.match(/(?:(left|right)\s+)?heading\s+(\d{1,3})\b/);
  if (x) out.push(['hdg', x[2].padStart(3, '0') + '°', x[1] ? (x[1] === 'left' ? 'virage à gauche' : 'virage à droite') : '']);
  let best = null;
  for (const a of n.matchAll(ALT)) if (a[1] !== 'expect' || !best) best = a;
  if (best) {
    const v = parseInt(best[3], 10), k = best[1];
    const sub = k === 'expect' ? 'prévu' : /initial/.test(best[0]) ? 'initiale' : k === 'climb' ? 'montée' : k === 'descend' ? 'descente' : 'maintenir';
    if (best[2]) out.push(['alt', 'FL' + String(v).padStart(3, '0'), sub]);
    else if (v >= 1000) out.push(['alt', th(v) + ' ft', sub]);
  } else {
    for (const sent of n.split(/(?<=[.!?])\s+/)) {
      if (!/climb|descend|maintain|altitude|level|expect|cleared/.test(sent)) continue;
      x = sent.match(/\bfl\s*(\d{2,3})\b/);
      if (x) { out.push(['alt', 'FL' + String(parseInt(x[1], 10)).padStart(3, '0'), 'indiqué']); break; }
      x = sent.match(/(?<![\d.])(\d{4,5})(?![\d.]|\s*(?:knots|kts))/);
      if (x && !new RegExp('(?:squawk|altimeter|qnh|code|wind)\\s+' + x[1]).test(sent)) { out.push(['alt', th(parseInt(x[1], 10)) + ' ft', 'indiqué']); break; }
    }
  }
  x = n.match(/(?:speed|reduce|increase|maintain|slow)\s+(?:speed\s+)?(?:to\s+)?(\d{2,3})\s*(?:knots|kts)/) || n.match(/\b(\d{3})\s*(?:knots|kts)/)
    || n.match(/\b(?:speed|reduce|increase|slow(?:\s+down)?|maintain)\s+(?:speed\s+)?(?:to\s+)?(\d{3})\b(?!\s*(?:feet|ft|\d))/);
  if (x) out.push(['spd', x[1] + ' kt', '']);
  else if (/resume normal speed|cancel speed restriction/.test(n)) out.push(['spd', 'Libre', 'vitesse normale']);
  x = n.match(/squawk(?:\s+code)?\s+(\d{4})/);
  if (x) out.push(['sqk', x[1], '']);
  x = n.match(/contact\s+(.+?)\s+(?:on\s+)?(\d{3}\.\d{1,3})/);
  if (x) out.push(['frq', x[2], title(x[1])]);
  const sents = d.split(/(?<=[.!?])\s+/);
  const tax = sents.filter(t => /\btaxi\b|hold short/i.test(t));
  if (tax.length) out.push(['tax', tax.join(' '), '']);
  const push = sents.filter(t => /\bpush(?:\s?back)?\b|\bstart(?:[- ]?up)?\s+approved\b|^face\b/i.test(t) && !/\brequest/i.test(t));
  if (push.length && /\bpush/i.test(push.join(' '))) out.push(['push', push.join(' '), '']);
  if (/\batis\b/i.test((m.station_name || '') + ' ' + (m.ident || '') + ' ' + (m.channel || '') + ' ' + d)) {
    x = atisLetter(d);
    if (x) out.push(['atis', x, [String(m.station_name || m.ident || '').replace(/\s*atis\s*/i, ' ').trim(), atisTime(d)].filter(Boolean).join(' · ')]);
  }
  x = n.match(/\b(?:altimeter|qnh)\s+(?:is\s+)?(\d{4}|\d{2}\.\d{2})\b/);
  const q = x ? qnhPair(x[1]) : null;
  if (q) out.push(['qnh', String(q[0]), q[1].toFixed(2) + ' inHg · ATC']);
  const hd = n.match(/heading\s+(\d{1,3})\b/);
  x = n.match(/\bdirect(?:\s+to)?\s+([a-z]{3,6})\b/);
  let kind = 'direct';
  if (!x || DCT_STOP.has(x[1])) {
    x = n.match(/\bvectors?\s+(?:to\s+|for\s+|toward\s+|towards\s+)?(?:the\s+)?([a-z]{3,6})\b/);
    kind = 'vecteurs';
  }
  if (x && !DCT_STOP.has(x[1])) out.push(['dct', x[1].toUpperCase(), kind + (hd ? ' · cap ' + hd[1].padStart(3, '0') + '°' : '')]);
  else if (/resume own navigation/.test(n)) out.push(['dct', 'Libre', 'navigation propre']);
  for (const [c, v, st] of clearances(d)) out.push(['cl:' + c, v, st]);
  return out;
}

/* ---------- géométrie et plan SimBrief ---------- */
const hav = (a, b) => {
  const r = Math.PI / 180, la1 = a[0] * r, lo1 = a[1] * r, la2 = b[0] * r, lo2 = b[1] * r;
  const h = Math.sin((la2 - la1) / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin((lo2 - lo1) / 2) ** 2;
  return 3440.065 * 2 * Math.asin(Math.sqrt(h));
};
function segDist(p, a, b) {
  const k = Math.cos(p[0] * Math.PI / 180), ax = a[1] * k, ay = a[0], bx = b[1] * k, by = b[0], px = p[1] * k, py = p[0];
  const dx = bx - ax, dy = by - ay;
  const t = (dx === 0 && dy === 0) ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy)) * 60;
}
const one = x => Array.isArray(x) ? (x[0] || {}) : (x || {});
const val = x => (x === undefined || x === null || x === '' || typeof x === 'object') ? undefined : x;
function navlog(o) {
  let fx = (o.navlog || {}).fix || [];
  if (!Array.isArray(fx)) fx = [fx];
  const pts = [];
  for (const f of fx) {
    const lat = parseFloat(f.pos_lat), lon = parseFloat(f.pos_long);
    if (Number.isNaN(lat) || Number.isNaN(lon)) continue;
    pts.push({ id: String(f.ident), lat, lon, leg: parseFloat(f.distance) || 0, ss: ['1', 'true'].includes(String(f.is_sid_star)) });
  }
  return pts;
}
function progress(pts, pos, gs) {
  const n = pts.length;
  if (n < 2) return null;
  const cum = [0];
  for (let i = 1; i < n; i++) cum.push(cum[i - 1] + pts[i].leg);
  let nxt = 1, bd = Infinity;
  for (let i = 1; i < n; i++) { const d = segDist(pos, [pts[i - 1].lat, pts[i - 1].lon], [pts[i].lat, pts[i].lon]); if (d < bd) { bd = d; nxt = i; } }
  const d0 = hav(pos, [pts[nxt].lat, pts[nxt].lon]), dist = {};
  for (let i = nxt; i < n; i++) dist[i] = d0 + cum[i] - cum[nxt];
  const total = cum[n - 1] || 1;
  return { next: nxt, dist, remaining: dist[n - 1], frac: Math.max(0, Math.min(1, 1 - dist[n - 1] / total)), cum, total };
}
const pad2 = n => String(n).padStart(2, '0');
const hms = s => { s = Math.floor(s) % 86400; return pad2(Math.floor(s / 3600)) + ':' + pad2(Math.floor(s % 3600 / 60)) + ':' + pad2(s % 60); };
const hmZ = s => hms(s).slice(0, 5) + 'Z';
const epochHm = x => { const n = parseInt(x, 10); if (!(n > 0)) return null; const d = new Date(n * 1000); return pad2(d.getUTCHours()) + ':' + pad2(d.getUTCMinutes()) + 'Z'; };
const stampMs = t => { const v = Date.parse(t); return Number.isNaN(v) ? Date.now() : v; };

/* ---------- réseau ---------- */
async function jget(url, headers, ms) {
  const ac = new AbortController(), tm = setTimeout(() => ac.abort(), ms || 10000);
  try { const r = await fetch(url, { headers: headers || {}, signal: ac.signal }); return await r.json(); } finally { clearTimeout(tm); }
}

/* ---------- le mémo ---------- */
class Memo {
  constructor(dataDir) {
    this.dir = dataDir;
    this.file = path.join(dataDir, 'memo.json');
    this.cfg = Object.assign({ key: '', host: 'localhost', sb: '', mode: 'atc', beep: false, ng: 'https://charts.navigraph.com', launch: [], lang: 'auto' }, this.readJson(this.file));
    this.sysLang = 'fr';
    this.status = ['Démarrage…', 0];
    this.fid = null; this.sim = null; this.simAt = 0; this.simMsg = '';
    this.reset();
  }
  /* --- langue de l'interface --- */
  lang() { return I18N.resolve(this.cfg.lang, this.sysLang); }
  T(s, ...a) { return I18N.tr(this.lang(), s, ...a); }
  P(s) { return I18N.trParts(this.lang(), s); }
  sep() { return this.lang() === 'fr' ? ' : ' : ': '; }
  readJson(f) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return {}; } }
  save() { try { fs.mkdirSync(this.dir, { recursive: true }); fs.writeFileSync(this.file, JSON.stringify(this.cfg, null, 1)); } catch (e) { /* ignoré */ } }
  reset() {
    Object.assign(this, { S: {}, hist: [], lid: 0, live: false, clr: {}, raw: [], lastCl: null, wx: {}, wxAt: 0, lastAp: '', siPlan: null, changes: [],
      ofp: null, pts: [], trans: null, tOff: null, tOn: null, ofpAt: 0, ofpOk: false, wxFetchAt: 0, info: this.info || {}, api: '' });
  }
  utcSecs() {
    if (this.sim && this.sim.zulu != null) return (this.sim.zulu + (Date.now() - this.simAt) / 1000) % 86400;
    const n = new Date(); return n.getUTCHours() * 3600 + n.getUTCMinutes() * 60 + n.getUTCSeconds();
  }

  /* --- boucle de lecture SayIntentions --- */
  async sapi(ep, params) {
    const q = new URLSearchParams(Object.assign({ api_key: this.api }, params || {}));
    return jget(SAPI + ep + '?' + q, { 'X-Developer-Key': this.cfg.key }, 10000);
  }
  async tick() {
    const c = this.cfg;
    try {
      if (!c.key) { this.status = ['Clé développeur SayIntentions manquante : ouvrez les réglages ATC.', 1]; return; }
      let fj;
      try { fj = await jget('http://' + (c.host || 'localhost') + ':43117/flightJSON', {}, 4000); }
      catch (e) { this.status = ['SayIntentions injoignable sur {0}:43117 (client lancé ?)', 1, c.host]; return; }
      const f = fj.flight_details || {};
      if (!f.api_key) { this.status = ['En attente d’un vol…', 0]; return; }
      if (f.flight_id !== this.fid) { this.fid = f.flight_id; this.reset(); }
      const cf = f.current_flight || {};
      this.info = { callsign: f.callsign, callsignIcao: f.callsign_icao, cf, orig: cf.flight_origin, dest: cf.flight_destination };
      this.api = f.api_key;
      this.trackPlan();
      if (c.sb && Date.now() - this.ofpAt > (this.ofpOk ? 900000 : 45000)) { this.ofpAt = Date.now(); this.fetchOfp().catch(() => {}); }
      const r = await this.sapi('getCommsHistory', this.lid ? { since_id: this.lid } : {});
      if (r.error) { this.status = [String(r.error), 1]; return; }
      const msgs = (r.comm_history || []).filter(m => m.id > this.lid).sort((a, b) => a.id - b.id);
      this.applyMessages(msgs);
      this.live = true;
      const tr = await this.sapi('getTransponder');
      this.trans = tr && tr.status === 'OK' ? tr : null;
      if (Date.now() - this.wxFetchAt > 120000) {
        const ic = [...new Set([this.info.orig, this.info.dest].filter(Boolean))].join(',');
        if (ic) { const w = await this.sapi('getWX', { icao: ic }); (w.airports || []).forEach(a => { this.wx[a.airport] = a; }); this.wxAt = Date.now(); this.wxFetchAt = Date.now(); }
      }
      this.status = ['Connecté · {0}', 0, new Date().toLocaleTimeString(this.lang())];
    } catch (e) { this.status = ['Erreur réseau : {0}', 1, e.message]; }
  }
  start() {
    const loop = async () => { await this.tick(); this.timer = setTimeout(loop, 5000); };
    loop();
    this.startSim();
    setTimeout(() => this.autoLaunch(), 2500);
  }
  stop() { clearTimeout(this.timer); if (this.helper) { try { this.helper.kill(); } catch (e) { /* ignoré */ } } }

  async fetchOfp() {
    const u = String(this.cfg.sb).trim();
    const o = await jget('https://www.simbrief.com/api/xml.fetcher.php?' + new URLSearchParams({ [/^\d+$/.test(u) ? 'userid' : 'username']: u, json: '1' }), { 'User-Agent': 'ATC-Memo' }, 20000);
    this.ofpOk = !!(o && o.general);
    if (!this.ofpOk) { this.ofp = null; this.pts = []; return; }
    const ob = one(o.origin).icao_code, db = one(o.destination).icao_code;
    if ((this.info.orig && ob && ob !== this.info.orig) || (this.info.dest && db && db !== this.info.dest)) { this.ofp = null; this.pts = []; return; }
    this.ofp = o; this.pts = navlog(o);
  }

  /* --- messages --- */
  applyMessages(msgs) {
    for (const m of msgs) {
      for (const [key, v, sub] of parse(m)) {
        if (key === 'alt' && sub === 'prévu' && this.S.alt && this.S.alt.sub !== 'prévu') continue;
        if (key.startsWith('cl:')) { this.addClr(key.slice(3), v, sub, m.stamp_zulu); continue; }
        this.S[key] = { v, sub, t: m.stamp_zulu, ack: !this.live || !(key in ALERT) };
      }
      /* a taxi instruction can arrive recorded on the pilot side of the exchange: keep it too (never a request) */
      if (!/^INTERCOM/i.test(m.channel || '') && !String(m.outgoing_message_english || m.outgoing_message || '').trim()) {
        const inc = disp(String(m.incoming_message_english || m.incoming_message || '')).trim();
        if (/^(?:[\w' -]{2,40},\s*)?(?:taxi\b|hold short|push ?back)/i.test(inc) && !/\brequest/i.test(inc)) this.S.tax = { v: inc, sub: '', t: m.stamp_zulu, ack: true };
      }
      this.hist.push(m);
      if (m.ident && (m.ident === this.info.orig || m.ident === this.info.dest)) this.lastAp = m.ident;
      this.lid = Math.max(this.lid, m.id);
    }
    this.hist = this.hist.slice(-300);
  }
  addClr(cat, v, st, t) {
    const born = stampMs(t);
    if (cat === '*') {
      if (this.raw.some(r => r.v === v)) return;
      this.raw = this.raw.concat([{ v, st, t, born }]).slice(-2); this.lastCl = { v: v.slice(0, 70) };
    } else {
      const old = this.clr[cat];
      if (old && old.v === v && old.st === st) return;
      for (const c of (SUPERSEDE[cat] || [])) delete this.clr[c];
      if (cat === 'Approche' && st === 'autorisé') delete this.clr['SID'];
      this.clr[cat] = { v, st, t, born }; this.lastCl = { cat, v };
    }
    this.S.clr = { v: '', sub: '', t, ack: !this.live };
  }
  pruneClr() {
    const now = Date.now(), drop = new Set();
    if (this.tOff != null) { drop.add('Alignement'); drop.add('Décollage'); }
    if (this.tOn != null) ['Atterrissage', 'Remise de gaz', 'Piste', 'Approche', 'STAR', 'Transition'].forEach(c => drop.add(c));
    for (const [c, e] of Object.entries(this.clr)) if ((now - e.born) / 60000 > (CLR_TTL[c] || 180)) drop.add(c);
    drop.forEach(c => delete this.clr[c]);
    this.raw = this.raw.filter(r => (now - r.born) / 60000 < 5).slice(-1);
  }
  clrText() {
    this.pruneClr();
    const L = [];
    for (const c of CLR_ORDER) { const e = this.clr[c]; if (e) L.push((e.st === 'autorisé' ? '✔' : e.st === 'attendu' ? '…' : '•') + ' ' + this.T(c) + ' : ' + this.clrVal(e.v) + (e.st === 'attendu' ? '  (' + this.T('attendu') + ')' : '')); }
    if (this.raw.length) { const r = this.raw[this.raw.length - 1]; L.push('', (r.st === 'autorisé' ? '→ ' : '… ') + r.v); }
    return L.join('\n') || '—';
  }
  clrVal(v) { return String(v || '').replace(/^piste /, this.T('piste') + ' '); }
  shortCl() { const l = this.lastCl; if (!l) return ''; return l.cat ? (this.T(l.cat) + ' ' + this.clrVal(l.v)).trim() : l.v; }
  trackPlan() {
    const cf = this.info.cf || {};
    const nw = { 'piste départ': cf.flight_plan_departing_runway, 'SID': cf.flight_plan_sid, 'piste arrivée': cf.flight_plan_arriving_runway, 'STAR': cf.flight_plan_star, 'route': cf.flight_plan_route };
    for (const k of Object.keys(nw)) nw[k] = String(nw[k] || '');
    if (this.siPlan) for (const [k, v] of Object.entries(nw)) {
      const o = this.siPlan[k] || '';
      if (v !== o) this.changes = this.changes.concat([{ at: hmZ(this.utcSecs()), k, o, v }]).slice(-4);
    }
    this.siPlan = nw;
  }
  planDiff() {
    const o = this.ofp || {}, si = this.siPlan || {}, g = one(o.general), org = one(o.origin), dst = one(o.destination);
    const lines = []; let dep = false, arr = false;
    for (const [lbl, mine, ref, isDep] of [['piste départ', si['piste départ'], val(org.plan_rwy), true], ['SID', si.SID, val(g.sid_ident), true],
      ['piste arrivée', si['piste arrivée'], val(dst.plan_rwy), false], ['STAR', si.STAR, val(g.star_ident), false]]) {
      if (mine && ref && String(mine).toUpperCase() !== String(ref).toUpperCase()) { lines.push(this.T(lbl) + ' ' + mine + ' (SimBrief' + this.sep() + ref + ')'); if (isDep) dep = true; else arr = true; }
    }
    return { dep, arr, lines };
  }

  /* --- tuiles --- */
  rwTile(dep) {
    const cf = this.info.cf || {}, icao = dep ? this.info.orig : this.info.dest, w = this.wx[icao] || {};
    const plan = dep ? cf.flight_plan_departing_runway : cf.flight_plan_arriving_runway, v = plan || w.active_runway || '';
    const proc = dep ? cf.flight_plan_sid : cf.flight_plan_star;
    const sub = [proc ? (dep ? 'SID ' : 'STAR ') + proc : '', w.active_runway && w.active_runway !== plan ? 'ATIS : ' + w.active_runway : ''].filter(Boolean).join(' · ');
    return { k: dep ? 'rwd' : 'rwa', label: (dep ? 'Piste départ' : 'Piste arrivée') + (icao ? ' · ' + icao : ''), v: v || '—', sub: sub || (v ? '' : 'pas encore connue'), empty: !v };
  }
  qnhTile() {
    const cf = this.info.cf || {}, { orig, dest } = this.info, sm = this.sim;
    let icao = null;
    if (sm && sm.lat != null) {
      const pos = [sm.lat, sm.lon], cand = [];
      for (const [ic, la, lo] of [[orig, 'flight_plan_origin_lat', 'flight_plan_origin_lon'], [dest, 'flight_destination_lat', 'flight_destination_lon']])
        if (ic && cf[la] && cf[lo]) cand.push([hav(pos, [parseFloat(cf[la]), parseFloat(cf[lo])]), ic]);
      if (cand.length) icao = cand.sort((a, b) => a[0] - b[0])[0][1];
    }
    icao = icao || this.lastAp || orig;
    const metar = (this.wx[icao] || {}).metar || '';
    const q = metar.match(/\bQ(\d{4})\b/), a = metar.match(/\bA(\d{4})\b/), hm = metar.match(/\b\d{2}(\d{2})(\d{2})Z\b/);
    const pair = q ? [parseInt(q[1], 10), parseInt(q[1], 10) / 33.8639] : a ? [Math.round(parseInt(a[1], 10) / 100 * 33.8639), parseInt(a[1], 10) / 100] : null;
    const atc = this.S.qnh;
    let v, sub, t = null;
    if (atc && stampMs(atc.t) >= this.wxAt) { v = atc.v; sub = atc.sub; t = atc.t; }
    else if (pair) { v = String(pair[0]); sub = pair[1].toFixed(2) + ' inHg · METAR ' + icao + (hm ? ' ' + hm[1] + ':' + hm[2] + 'Z' : ''); }
    else { v = '—'; sub = icao ? 'en attente du METAR' : 'pas encore de vol'; }
    return { k: 'qnh', label: 'QNH (hPa)', v, sub, t, empty: v === '—' };
  }
  airborne() {
    const s = this.sim;
    if (s && typeof s.ground === 'number') return s.ground < 0.5;
    if (s && typeof s.gs === 'number' && s.gs > 100 && typeof s.alt === 'number' && s.alt > 3000) return true;
    return this.tOff != null && this.tOn == null;
  }
  tiles() {
    const T = [];
    for (const [k, label] of [['hdg', 'Cap'], ['alt', 'Altitude'], ['spd', 'Vitesse'], ['sqk', 'Squawk'], ['frq', 'Fréquence suivante'], ['dct', 'Direct / vecteurs']]) {
      let e = this.S[k];
      if (k === 'dct' && e && Date.now() - stampMs(e.t) > 1800000) e = null;
      let v = e ? e.v : '—', sub = e ? e.sub : 'pas encore donné', empty = !e, bad = false, t = e ? e.t : null;
      const tr = this.trans;
      if (k === 'sqk' && tr && tr.assigned_code) {
        v = String(tr.assigned_code); empty = false;
        if (tr.matches_assigned === false) { sub = this.T('affiché sur le transpondeur : {0}', tr.code); bad = true; } else sub = 'conforme';
      }
      T.push({ k, label, v, sub, t, empty, bad, alert: !!(e && !e.ack) });
    }
    T.push(this.qnhTile(), this.rwTile(true), this.rwTile(false));
    const air = this.airborne();
    if (air && this.S.tax) delete this.S.tax;   /* the taxi box is inactive in flight; new instructions come after landing */
    {
      const pu = this.S.push, tx = this.S.tax;
      if (air && pu) delete this.S.push;
      /* pushback instruction: shown until taxi instructions follow it (or the aircraft is airborne) */
      if (!air && pu && !(tx && stampMs(tx.t) >= stampMs(pu.t))) T.push({ k: 'push', label: 'Pushback', v: pu.v, sub: '', t: pu.t, empty: false, wide: true });
      const at = this.S.atis;
      if (at) T.push({ k: 'atis', label: 'ATIS', v: at.v, sub: at.sub || '', t: at.t, empty: false });
    }
    const e = this.S.tax;
    T.push({ k: 'tax', label: air ? 'Roulage · inactif en vol' : 'Roulage', v: e ? e.v : '—', sub: air ? 'avion en vol' : e ? '' : 'pas encore donné', t: e ? e.t : null, empty: !e, wide: true, inactive: air });
    const txt = this.clrText(), c = this.S.clr;
    T.push({ k: 'clr', label: 'Autorisations et procédures  (✔ autorisé · … attendu)', v: txt, sub: c ? '' : 'pas encore donné', t: c ? c.t : null, empty: txt === '—', alert: !!(c && !c.ack), short: this.shortCl(), wide: true });
    for (const t of T) {
      t.color = COLORS[t.k]; t.bad = !!t.bad; t.alert = !!t.alert; t.inactive = !!t.inactive;
      if (t.k !== 'clr') t.label = this.P(t.label);
      if (t.sub) t.sub = this.P(t.sub);
      if (t.v === 'Libre') t.v = this.T('Libre');
    }
    return T;
  }
  ack() { for (const k of Object.keys(ALERT)) if (this.S[k]) this.S[k].ack = true; }

  /* --- en-tête, progression, GSX --- */
  head() {
    const i = this.info || {}, o = this.ofp || {}, g = one(o.general), org = one(o.origin), dst = one(o.destination);
    const num = [val(g.icao_airline), val(g.flight_number)].filter(x => x !== undefined).join('');
    const cs = num || disp(i.callsignIcao || i.callsign || '');
    const ap = (code, a) => (code || '?') + (val(a.name) ? ' ' + val(a.name) : '');
    const ci = val(g.costindex) !== undefined ? val(g.costindex) : val(g.cost_index);
    return (cs || 'ATC') + ' · ' + ap(i.orig || val(org.icao_code), org) + ' → ' + ap(i.dest || val(dst.icao_code), dst) + (ci !== undefined ? ' · CI ' + ci : '');
  }
  eta(dist, gs) { return gs < 40 ? '—' : hmZ(this.utcSecs() + dist / gs * 3600); }
  progressOut() {
    const s = this.sim, pts = this.pts, L = [];
    const T = (x, ...a) => this.T(x, ...a), S = this.sep();
    L.push({ tag: 'sys', label: 'SimConnect', text: S + (s ? T('connecté à MSFS') : T('non connecté · {0}', T(this.simMsg || 'en attente'))) });
    const tm = one((this.ofp || {}).times);
    const plan = [['départ', 'sched_out'], ['décollage', 'sched_off'], ['atterrissage', 'sched_on'], ['arrivée', 'sched_in']].filter(([, k]) => epochHm(tm[k])).map(([n, k]) => T(n) + ' ' + epochHm(tm[k]));
    if (plan.length) L.push({ tag: 'plan', label: T('Plan (UTC)'), text: S + plan.join(' · ') });
    const real = [].concat(this.tOff != null ? [T('décollage') + ' ' + hmZ(this.tOff)] : [], this.tOn != null ? [T('atterrissage') + ' ' + hmZ(this.tOn)] : []);
    if (real.length) L.push({ tag: 'real', label: T('Réel (UTC)'), text: S + real.join(' · ') });
    const si = this.siPlan || {};
    if (Object.values(si).some(Boolean)) {
      L.push({ tag: 'si', label: T('Plan SayIntentions'), text: S + (si.SID || 'SID ?') + ' · ' + T('piste') + ' ' + (si['piste départ'] || '?') + '  →  ' + (si.STAR || 'STAR ?') + ' · ' + T('piste') + ' ' + (si['piste arrivée'] || '?') });
      if (si.route) L.push({ tag: 'si', label: T('Route SI'), text: S + si.route.slice(0, 95) });
    }
    const pd = this.planDiff();
    if (pd.lines.length) L.push({ tag: 'diff', label: T('Écart avec SimBrief'), text: S + pd.lines.join(' · ') + '   ' + T('(* = tracé SimBrief non mis à jour)') });
    if (this.changes.length) L.push({ tag: 'chg', label: T('Changements ATC'), text: S + this.changes.slice(-2).map(c => c.at + '  ' + T(c.k) + S + (c.k === 'route' ? T('modifiée') : (c.o || '—') + ' → ' + (c.v || '—'))).join(' | ') });
    const obs = new Set();
    if (pts.length && (pd.dep || pd.arr)) {
      const ns = []; for (let i = 1; i < pts.length - 1; i++) if (!pts[i].ss) ns.push(i);
      if (ns.length) for (let i = 1; i < pts.length - 1; i++) if (pts[i].ss && ((pd.dep && i < ns[0]) || (pd.arr && i > ns[ns.length - 1]))) obs.add(i);
    }
    if (s && s.gps_id) L.push({ tag: 'gps', label: 'GPS MSFS', text: S + T('prochain') + ' ' + s.gps_id + (typeof s.gps_dist_m === 'number' ? ' · ' + Math.round(s.gps_dist_m / 1852) + ' NM' : '') + (s.gps_ete > 0 ? ' · ETE ' + hms(s.gps_ete).slice(0, 5) : '') });
    let frac = 0, marks = [];
    if (!pts.length) L.push({ tag: 'sys', label: T('Points de passage'), text: S + T('renseignez votre identifiant SimBrief (réglages ATC) et générez un plan.') });
    else if (s && s.lat != null) {
      const gs = s.gs || 0, pr = progress(pts, [s.lat, s.lon], gs);
      if (pr) {
        const n = pr.next, dist = pr.dist; frac = pr.frac;
        marks = pts.map((q, i) => [pr.cum[i] / pr.total, q.id]).filter(([, id]) => id === 'TOC' || id === 'TOD');
        L.push({ tag: 'next', label: T('Prochain'), cols: [pts[n].id, Math.round(dist[n]) + ' NM', this.eta(dist[n], gs) + (obs.has(n) ? '  *' : '')] });
        for (const [name, tag] of [['TOC', 'toc'], ['TOD', 'tod']]) {
          const i = pts.findIndex(q => q.id === name);
          if (i >= 0) L.push({ tag, label: name, cols: i < n ? [T('passé')] : ['', Math.round(dist[i]) + ' NM', this.eta(dist[i], gs)] });
        }
        L.push({ tag: 'arr', label: T('Arrivée'), cols: ['', Math.round(pr.remaining) + ' NM', this.eta(pr.remaining, gs)] });
        for (let i = n + 1; i < Math.min(n + 6, pts.length); i++) L.push({ tag: obs.has(i) ? 'diff' : 'wp', label: '', cols: [pts[i].id, Math.round(dist[i]) + ' NM', this.eta(dist[i], gs) + (obs.has(i) ? '  *' : '')] });
      }
    } else L.push({ tag: 'sys', label: T('Progression'), text: S + T('MSFS et SimConnect nécessaires pour suivre le plan ({0} points chargés).', pts.length) });
    return { lines: L, frac, marks };
  }
  gsxOut() {
    const g = (this.sim && this.sim.gsx) || null, s = this.sim, o = this.ofp || {};
    if (!s) return ['GSX : SimConnect non connecté.'];
    if (!g) return ['GSX : en attente de lecture…'];
    const v = k => (typeof g[k] === 'number' ? g[k] : undefined);
    const st = k => { const x = v(k + '_STATE'); return x ? (GSX_ST[Math.round(x)] || 'état ' + Math.round(x)) : null; };
    const active = ['COUATL_STARTED', 'STATE', 'BOARDING_STATE', 'REFUELING_STATE', 'DEBOARDING_STATE', 'CATERING_STATE'].some(k => (v(k) || 0) > 0);
    const kgs = !String(one(o.params).units || '').toLowerCase().startsWith('lb');
    const w = one(o.weights), f = one(o.fuel), L = [];
    const b = v('NUMPASSENGERS_BOARDING'), bt = v('NUMPASSENGERS_BOARDING_TOTAL'), pl = val(w.pax_count);
    if (st('BOARDING')) L.push('Embarquement : ' + st('BOARDING') + (b !== undefined && bt ? ' · ' + b + ' / ' + bt + ' passagers' : '') + (pl !== undefined ? ' (plan SimBrief : ' + pl + ')' : ''));
    const wl = s.fuel_lb;
    if (wl != null || st('REFUELING')) {
      const cur = wl != null ? (kgs ? wl * 0.45359237 : wl) : null, ramp = val(f.plan_ramp), u = kgs ? 'kg' : 'lb';
      L.push('Carburant : ' + (st('REFUELING') || 'pas de service GSX') + (cur != null ? ' · ' + th(Math.round(cur)) + ' ' + u + ' à bord' : '') + (ramp !== undefined ? ' / plan ' + th(Math.round(ramp)) + ' ' + u : ''));
    }
    for (const [name, k] of [['Débarquement', 'DEBOARDING'], ['Catering', 'CATERING']]) if (st(k) && st(k) !== 'non disponible') L.push(name + ' : ' + st(k));
    if (!active && !L.length) return ['GSX : lecture OK, mais aucune variable active. GSX n’est pas chargé : ouvrez son menu une fois dans MSFS.'];
    return L.length ? L : ['GSX actif : aucun service demandé pour le moment.'];
  }
  histOut() {
    const hide = this.cfg.mode === 'atc';
    return this.hist.filter(m => !(hide && /^INTERCOM/i.test(m.channel || ''))).slice(-60).reverse().map(m => {
      const atc = disp(m.outgoing_message_english || m.outgoing_message || ''), pil = disp(m.incoming_message_english || m.incoming_message || '');
      return { id: m.id, t: m.stamp_zulu, who: (/^INTERCOM/i.test(m.channel || '') ? this.T('Équipage') + ' · ' : '') + (m.station_name || m.ident || ''), freq: m.frequency || '', pil, atc, spans: atc ? spans(atc) : [] };
    }).filter(x => x.atc || x.pil);
  }
  snapshot() {
    const s = this.sim;
    return {
      now: Date.now(), status: [this.T(this.status[0], ...this.status.slice(2)), this.status[1]], head: this.head(), tiles: this.tiles(), hist: this.histOut(), progress: this.progressOut(), gsx: this.gsxOut(),
      sim: s ? { zulu: s.zulu, local: s.local, at: this.simAt } : null,
      lang: this.lang(),
      cfg: { lang: this.cfg.lang || 'auto', mode: this.cfg.mode, beep: !!this.cfg.beep, ng: this.cfg.ng, host: this.cfg.host, sb: this.cfg.sb, hasKey: !!this.cfg.key },
      flight: { orig: this.info.orig || '', dest: this.info.dest || '' },
    };
  }
  /** Autorisation de départ (IFR) reçue de SayIntentions : champs prêts à remplir dans e-NavLog. */
  depClr() {
    const H = this.hist || [], txt = m => String(m.outgoing_message_english || m.outgoing_message || '');
    const atc = m => !/^INTERCOM/i.test(m.channel || '') && txt(m);
    const stn = m => m.station_name || m.ident || '';
    let k = -1;
    for (let i = H.length - 1; i >= 0; i--) {
      if (!atc(H[i])) continue;
      const n = disp(txt(H[i])).toLowerCase();
      if (/\bcleared\s+to\s+(?!land\b|cross\b|taxi\b|enter\b|line\b|take|the\b|\d)/.test(n) && /squawk|\bdeparture\b/.test(n)) { k = i; break; }
    }
    if (k < 0) return { received: false };
    const base = H[k], out = { received: true, id: base.id, t: base.stamp_zulu, station: stn(base), text: disp(txt(base)), to: '', sid: '', rwy: '', cfl: '', sqk: '', freq: '' };
    const dest = String(this.info.dest || '').toLowerCase();
    for (const m of H.slice(k).filter(m => atc(m) && stn(m) === stn(base))) {
      const n = disp(txt(m)).toLowerCase();
      let x;
      if (!out.to && dest && (x = n.match(/\bcleared\s+to\s+([a-z]{4})\b/)) && x[1] === dest) out.to = dest.toUpperCase();
      if (!out.sid && (x = n.match(/\b(?!contact\b)([a-z]{3,6})\s?(\d)\s?([a-z]|alpha|bravo|charlie|delta|echo|foxtrot|golf|hotel|juliet?t?|kilo|lima|mike|november|oscar|papa|quebec|romeo|sierra|tango|uniform|victor|whiskey|xray|yankee|zulu)?\s+departure\b/)))
        out.sid = (x[1] + x[2] + (x[3] ? (x[3].length === 1 ? x[3] : NATO1[x[3]] || '') : '')).toUpperCase();
      if (!out.rwy && (x = n.match(/\brunway\s+(\d{1,2}[lrc]?)\b/))) out.rwy = x[1].toUpperCase();
      if (!out.sqk && (x = n.match(/squawk(?:\s+code)?\s+(\d{4})/))) out.sqk = x[1];
      if (!out.freq) {
        const fq = n.match(/departure(?:\s+frequency)?\s+(?:is\s+)?(\d{3})\s*(?:\.|decimal|point)\s*(\d{1,3})/) || n.match(/\bfrequency\s+(\d{3})\s*(?:\.|decimal|point)\s*(\d{1,3})/) || n.match(/contact\s+departure\s+(?:on\s+)?(\d{3})\s*(?:\.|decimal|point)\s*(\d{1,3})/);
        if (fq) out.freq = fq[1] + '.' + fq[2];
      }
      if (!out.cfl) {
        const al = parse(m).filter(([key, , sub]) => key === 'alt' && sub !== 'prévu')[0];
        if (al) { const v = al[1]; out.cfl = /^FL/.test(v) ? v : v.replace(/[,\s](?=\d{3})/g, '').replace(/\s*ft$/, '') + ' ft'; }
      }
    }
    return out;
  }
  /** Données brutes pour les automatismes d'e-NavLog (clairance, SimConnect). */
  autoOut() {
    const s = this.sim;
    return { now: Date.now(), age: s ? Date.now() - this.simAt : null, sim: s || null, simMsg: this.simMsg || '', hasKey: !!this.cfg.key, clr: this.depClr() };
  }
  async wxOf(icao) {
    icao = String(icao || '').toUpperCase();
    if (!/^[A-Z0-9]{4}$/.test(icao)) return { error: 'Code ICAO invalide.' };
    if (!this.cfg.key) return { error: 'SayIntentions non configuré (clé développeur manquante).', off: true };
    if (!this.api) return { error: 'Pas de vol SayIntentions en cours.', off: true };
    this.wxCache = this.wxCache || {};
    const hit = this.wxCache[icao];
    if (hit && Date.now() - hit.at < 60000) return hit.v;
    const r = await this.sapi('getWX', { icao });
    if (r.error) return { error: String(r.error) };
    const a = (r.airports || []).find(x => String(x.airport).toUpperCase() === icao) || (r.airports || [])[0];
    if (!a) return { error: 'Aucune donnée SayIntentions pour ' + icao + '.' };
    const v = { icao, atis: disp(a.atis || ''), metar: a.metar || '', runway: a.active_runway || '', at: Date.now() };
    this.wxCache[icao] = { at: Date.now(), v };
    return v;
  }
  async atis(dep) {
    const icao = dep ? this.info.orig : this.info.dest;
    if (!icao) return { error: this.T('Pas encore de vol ou d’aéroport connu.') };
    if (!this.api) return { error: this.T('Pas encore de vol SayIntentions.') };
    const r = await this.sapi('getWX', { icao });
    if (r.error) return { error: String(r.error) };
    const a = (r.airports || [])[0] || {};
    this.wx[icao] = a;
    const txt = disp(a.atis || this.T('Pas d’ATIS disponible pour cet aéroport.'));
    const info = a.atis ? atisLetter(txt, a) : '';
    const at = atisTime(txt);
    if (info) this.S.atis = { v: info, sub: icao + (dep ? ' · départ' : ' · arrivée') + (at ? ' · ' + at : ''), t: new Date().toISOString(), ack: true };
    /* QNH read from the ATIS refreshes the QNH box (departure ATIS on the ground, arrival ATIS in flight) */
    if (a.atis && (dep ? !this.airborne() : (this.airborne() || !(this.sim && this.sim.ground >= 0.5)))) {
      const qm = txt.toLowerCase().match(/\b(?:altimeter|qnh)\W{0,3}(?:is\s+)?(\d{4}|\d{2}\.\d{2})\b/) || txt.match(/\bQ(\d{4})\b/) || String(a.metar || '').match(/\bQ(\d{4})\b/) || String(a.metar || '').match(/\bA(\d{4})\b/);
      const q = qm ? qnhPair(qm[1]) : null;
      if (q) { this.S.qnh = { v: String(q[0]), sub: q[1].toFixed(2) + ' inHg · ATIS' + (info ? ' ' + info : '') + (at ? ' ' + at : ''), t: new Date().toISOString(), ack: true }; this.lastAp = icao; }
    }
    return { icao, dep, atis: txt, info, runway: a.active_runway || '', metar: a.metar || '' };
  }

  /* --- SimConnect (petit script Python lancé en tâche de fond) --- */
  startSim() {
    const src = path.join(__dirname, 'simhelper.py');
    if (!fs.existsSync(src)) { this.simMsg = 'simhelper.py absent'; return; }
    /* Python cannot read a script stored inside app.asar: copy it to the data folder (SimConnect.dll can also be dropped there) */
    let helper = src;
    try { fs.mkdirSync(this.dir, { recursive: true }); helper = path.join(this.dir, 'simhelper.py'); fs.writeFileSync(helper, fs.readFileSync(src)); }
    catch (e) { this.simMsg = 'Cannot write simhelper.py to ' + this.dir + ' : ' + e.message; return; }
    /* packaged app: simhelper.exe (with SimConnect.dll beside it) is shipped in the app's resources, so nothing has to be installed */
    const bundled = process.resourcesPath ? path.join(process.resourcesPath, 'simhelper.exe') : '';
    const hasBundled = process.platform === 'win32' && bundled && fs.existsSync(bundled);
    const cmds = hasBundled ? [[bundled, []]] : process.platform === 'win32' ? [['python', []], ['py', ['-3']]] : [['python3', []], ['python', []]];
    let idx = 0;
    const launch = () => {
      const [cmd, args] = cmds[idx];
      let p;
      try { p = spawn(cmd, hasBundled ? [] : args.concat(['-u', helper]), { windowsHide: true }); } catch (e) { return next(e); }
      this.helper = p; let buf = '', got = false;
      p.on('error', e => { if (e.code === 'ENOENT' && idx < cmds.length - 1) { idx++; launch(); } else { this.simMsg = 'Python introuvable : SimConnect indisponible'; } });
      p.stdout.on('data', d => {
        buf += d;
        let i;
        while ((i = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
          if (!line) continue;
          try { this.onSim(JSON.parse(line)); got = true; } catch (e) { /* ligne ignorée */ }
        }
      });
      let errTail = '';
      p.stderr.on('data', d => { errTail = (errTail + d).slice(-400); });
      p.on('exit', code => {
        this.sim = null;
        if (!got) { const l = errTail.trim().split(/\r?\n/).filter(Boolean).pop(); this.simMsg = 'Python stopped (code ' + code + ')' + (l ? ' : ' + l : ''); }
        if (!this.stopped) setTimeout(launch, 10000);
      });
      const next = e => { this.simMsg = String(e.message || e); };
    };
    launch();
    process.on('exit', () => { this.stopped = true; try { this.helper && this.helper.kill(); } catch (e) { /* ignoré */ } });
    setInterval(() => { if (this.sim && Date.now() - this.simAt > 6000) this.sim = null; }, 2000);
  }
  onSim(o) {
    if (o.error) { this.sim = null; this.simMsg = o.error; return; }
    const prev = this.sim; this.sim = o; this.simAt = Date.now(); this.simMsg = '';
    /* the next-frequency alert stops by itself once the instructed frequency is set on a COM radio (active frequency) */
    const fq = this.S.frq;
    if (fq && !fq.ack) {
      const want = parseFloat(String(fq.v).replace(',', '.'));
      if (isFinite(want) && [o.com1, o.com2].some(c => typeof c === 'number' && Math.abs(c - want) < 0.004)) fq.ack = true;
    }
    /* heading / altitude / speed alerts stop once the FCU selection (or the aircraft itself) matches the instruction */
    const num = v => { const m = String(v == null ? '' : v).replace(/[,\s]/g, '').match(/(FL)?(\d+)/i); return m ? (m[1] ? +m[2] * 100 : +m[2]) : NaN; };
    const near = (a, b, tol, wrap) => typeof a === 'number' && isFinite(b) && (wrap ? Math.min(Math.abs(a - b) % 360, 360 - Math.abs(a - b) % 360) : Math.abs(a - b)) <= tol;
    const h = this.S.hdg, al = this.S.alt, sp = this.S.spd;
    if (h && !h.ack) { const w = num(h.v); if (near(o.aphdg, w, 1, 1) || near(o.hdgm, w, 3, 1)) h.ack = true; }
    if (al && !al.ack && al.sub !== 'prévu') { const w = num(al.v); if (near(o.apalt, w, 50) || near(o.alt, w, 150)) al.ack = true; }
    if (sp && !sp.ack && /kt/.test(sp.v)) { const w = num(sp.v); if (near(o.apspd, w, 1) || near(o.ias, w, 5)) sp.ack = true; }
    const gs = o.gs || 0, vs = o.vs || 0;
    if (this.tOff == null && gs > 80 && vs > 300) this.tOff = this.utcSecs();
    else if (this.tOff != null && this.tOn == null && gs < 40) this.tOn = this.utcSecs();
    return prev;
  }

  /* --- lanceur d'applications --- */
  launch(p) { if (process.platform === 'win32') exec('start "" "' + String(p).replace(/"/g, '') + '"'); else exec('xdg-open "' + String(p).replace(/"/g, '') + '"'); }
  autoLaunch() { (this.cfg.launch || []).filter(e => e.auto && e.path).forEach((e, i) => setTimeout(() => this.launch(e.path), i * 1500)); }
}

/* ---------- routes HTTP (appelées par server.js) ---------- */
const LOCAL = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
function jsonOut(res, code, obj) { const b = Buffer.from(JSON.stringify(obj)); res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'content-length': b.length }); res.end(b); }
function body(req) { return new Promise(r => { let s = ''; req.on('data', d => { s += d; if (s.length > 1e6) req.destroy(); }); req.on('end', () => { try { r(JSON.parse(s || '{}')); } catch (e) { r({}); } }); }); }

function create(dataDir) {
  const memo = new Memo(dataDir);
  const scratchFile = path.join(dataDir, 'memo-scratchpad.txt');
  async function handle(req, res, url) {
    const p = url.pathname;
    if (!p.startsWith('/api/memo')) return false;
    const local = LOCAL.has(req.socket.remoteAddress);
    if (p === '/api/memo/state') { jsonOut(res, 200, memo.snapshot()); return true; }
    if (p === '/api/memo/auto') { jsonOut(res, 200, memo.autoOut()); return true; }
    if (p === '/api/memo/wx') { jsonOut(res, 200, await memo.wxOf(url.searchParams.get('icao')).catch(e => ({ error: e.message }))); return true; }
    if (p === '/api/memo/ack' && req.method === 'POST') { memo.ack(); jsonOut(res, 200, { ok: true }); return true; }
    if (p === '/api/memo/atis') { jsonOut(res, 200, await memo.atis(url.searchParams.get('dep') === '1').catch(e => ({ error: e.message }))); return true; }
    if (p === '/api/memo/scratch') {
      if (req.method === 'POST') { const b = await body(req); try { fs.mkdirSync(dataDir, { recursive: true }); fs.writeFileSync(scratchFile, String(b.text || '')); } catch (e) { /* ignoré */ } jsonOut(res, 200, { ok: true }); }
      else { let t = ''; try { t = fs.readFileSync(scratchFile, 'utf8'); } catch (e) { /* vide */ } jsonOut(res, 200, { text: t }); }
      return true;
    }
    if (p === '/api/memo/settings') {
      if (req.method === 'POST') {
        if (!local) { jsonOut(res, 403, { error: memo.T('Réglages modifiables depuis le PC uniquement.') }); return true; }
        const b = await body(req), c = memo.cfg;
        if (typeof b.key === 'string' && b.key.trim()) c.key = b.key.trim();
        for (const k of ['host', 'sb', 'ng']) if (typeof b[k] === 'string') c[k] = b[k].trim() || (k === 'host' ? 'localhost' : k === 'ng' ? 'https://charts.navigraph.com' : '');
        if (b.mode === 'atc' || b.mode === 'all') c.mode = b.mode;
        if (typeof b.beep === 'boolean') c.beep = b.beep;
        const oldLang = memo.lang();
        if (b.lang === 'auto' || I18N.CODES.includes(b.lang)) c.lang = b.lang;
        if (memo.lang() !== oldLang && typeof memo.onLang === 'function') { try { memo.onLang(); } catch (e) { /* ignoré */ } }
        memo.save(); memo.ofpAt = 0; memo.fid = null; memo.tick().catch(() => {});
        jsonOut(res, 200, { ok: true });
      } else jsonOut(res, 200, { host: memo.cfg.host, sb: memo.cfg.sb, ng: memo.cfg.ng, mode: memo.cfg.mode, beep: !!memo.cfg.beep, hasKey: !!memo.cfg.key, local, lang: memo.cfg.lang || 'auto', langs: I18N.LANGS });
      return true;
    }
    if (p === '/api/memo/launcher') {
      if (req.method === 'GET') { jsonOut(res, 200, { list: memo.cfg.launch || [], local }); return true; }
      if (!local) { jsonOut(res, 403, { error: memo.T('Lanceur utilisable depuis le PC uniquement.') }); return true; }
      const b = await body(req), L = memo.cfg.launch = memo.cfg.launch || [];
      if (b.action === 'browse') {
        let file = '';
        try { const { dialog } = require('electron'); const r = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: memo.T('Programmes'), extensions: ['exe', 'lnk', 'bat'] }, { name: memo.T('Tous'), extensions: ['*'] }] }); file = (r.filePaths || [])[0] || ''; } catch (e) { /* hors Electron */ }
        jsonOut(res, 200, { path: file }); return true;
      }
      if (b.action === 'add' && b.path) { const clean = String(b.path).trim().replace(/^"|"$/g, ''); L.push({ name: String(b.name || path.win32.parse(clean).name), path: clean, auto: false, pin: false }); }
      else if (b.action === 'update' && L[b.i]) { L[b.i].auto = !!b.auto; L[b.i].pin = !!b.pin; }
      else if (b.action === 'remove' && L[b.i]) L.splice(b.i, 1);
      else if (b.action === 'launch' && L[b.i]) memo.launch(L[b.i].path);
      else if (b.action === 'launchAll') L.forEach(e => memo.launch(e.path));
      memo.save(); jsonOut(res, 200, { list: L });
      return true;
    }
    jsonOut(res, 404, { error: 'inconnu' });
    return true;
  }
  return { memo, handle, start: () => memo.start(), stop: () => memo.stop() };
}

module.exports = { create, Memo, parse, disp, spans, clearances, qnhPair, navlog, progress, hav, epochHm, hms, hmZ };
