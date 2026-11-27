// ATC Memo : standalone desktop app (SayIntentions.AI memo). Independent of any other software.
'use strict';
const { app, BrowserWindow, Menu, shell, dialog, nativeTheme } = require('electron');
const http = require('http');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(app.getPath('appData'), 'ATC-Memo');
const WWW = path.join(__dirname, 'www');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.css': 'text/css' };

/* first launch: reuse the SayIntentions settings of an existing e-NavLog install, if any (copied, never modified) */
try {
  const mine = path.join(DATA_DIR, 'memo.json'), old = path.join(app.getPath('appData'), 'e-NavLog', 'memo.json');
  if (!fs.existsSync(mine) && fs.existsSync(old)) { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.copyFileSync(old, mine); }
} catch (e) {}

const MEMO = require('./memo').create(DATA_DIR);

function startServer() {
  const srv = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/memo')) { MEMO.start(); if (await MEMO.handle(req, res, url)) return; }
      let rel = decodeURIComponent(url.pathname); if (rel === '/') rel = '/index.html';
      const file = path.normalize(path.join(WWW, rel));
      if (!file.startsWith(WWW) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('Not found'); }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
      fs.createReadStream(file).pipe(res);
    } catch (e) { res.writeHead(500); res.end('Error'); }
  });
  /* local only: nothing is exposed to the network */
  return new Promise((ok, ko) => srv.listen(0, '127.0.0.1', () => ok(srv.address().port)).on('error', ko));
}

let win = null;
if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } });
app.setAppUserModelId('com.atcmemo.app');

app.whenReady().then(async () => {
  const V = require('./package.json').version;
  const memo = MEMO.memo, T = (x, ...a) => memo.T(x, ...a);
  try { memo.sysLang = app.getLocale() || 'fr'; } catch (e) {}
  const buildMenu = () => Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: T('Aide'), submenu: [
      { label: T('À propos d’ATC Memo'), click: () => dialog.showMessageBox(win, { type: 'info', title: T('À propos d’ATC Memo'), message: 'ATC Memo ' + V,
          detail: T('Mémo pour SayIntentions.AI sur Microsoft Flight Simulator.\nCréé par fullenwarth. Licence MIT.\n\nLogiciel non officiel : non affilié à SayIntentions.AI, Microsoft ou Asobo Studio, ni approuvé par eux. Toutes les marques appartiennent à leurs propriétaires.') }) },
      { label: T('Ouvrir le dossier des données'), click: () => shell.openPath(DATA_DIR) },
    ] },
  ]));
  buildMenu();
  memo.onLang = buildMenu;
  let port;
  try { port = await startServer(); } catch (e) { dialog.showErrorBox('ATC Memo', 'ATC Memo could not start: ' + e.message); app.quit(); return; }
  win = new BrowserWindow({
    width: 760, height: 900, minWidth: 420, minHeight: 480, title: 'ATC Memo',
    icon: path.join(__dirname, 'build', 'icon.png'), backgroundColor: '#0d1b2a', autoHideMenuBar: true, show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false },
  });
  win.once('ready-to-show', () => win.show());
  win.on('page-title-updated', e => e.preventDefault());
  const local = u => u.startsWith('http://localhost:' + port) || u.startsWith('http://127.0.0.1:' + port);
  win.webContents.setWindowOpenHandler(({ url }) => { if (!local(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!local(url)) { e.preventDefault(); shell.openExternal(url); } });
  win.on('closed', () => { win = null; });
  win.loadURL('http://127.0.0.1:' + port + '/');
});
app.on('window-all-closed', () => { try { MEMO.stop(); } catch (e) {} app.quit(); });
