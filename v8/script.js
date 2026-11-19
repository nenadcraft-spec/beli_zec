/* WHR V8 0.1 — local plugin catalog and explicit file exchange. No command execution. */
(() => {
  'use strict';
  const SCHEMA = 'WHR_V8_PLUGIN_CATALOG_1';
  const STORE = 'WHR_ASTRO_MOZAK_V8_1';
  const STATUSES = ['OPEN', 'NOT_TESTED', 'VERIFIED'];
  const RESULT_STATUSES = ['OPEN', 'PASS', 'FAIL', 'NOT_RUN'];
  const labels = { OPEN: 'OPEN', NOT_TESTED: 'NIJE TESTIRANO', VERIFIED: 'RUČNO POTVRĐENO', NOT_RUN: 'NOT_RUN' };
  const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const stable = value => JSON.stringify(value, (_, v) => isObject(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
  const emptyState = () => ({ schema: SCHEMA, plugins: [], journal: [] });
  function text(value, name, max, required = true) {
    if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw Error('Neispravno polje: ' + name);
    return value.trim();
  }
  function identifier(value, prefix) {
    if (typeof value !== 'string' || !new RegExp('^' + prefix + '[A-Za-z0-9_-]{1,100}$').test(value)) throw Error('Neispravan ID.');
    return value;
  }
  function timestamp(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT/.test(value) || !Number.isFinite(Date.parse(value))) throw Error('Neispravno vreme.');
    return value;
  }
  function validatePlugin(raw) {
    if (!isObject(raw)) throw Error('Plugin mora biti objekat.');
    const p = {
      id: identifier(raw.id, 'plugin_'), name: text(raw.name, 'naziv', 100),
      launcher: text(raw.launcher, 'putanja pokretača', 1000), project: text(raw.project, 'projekat', 120),
      version: text(raw.version, 'verzija', 60, false), description: text(raw.description, 'opis', 2000),
      input: text(raw.input, 'ulaz', 1000), output: text(raw.output, 'izlaz', 1000),
      status: raw.status, evidence: text(raw.evidence, 'dokaz', 4000, false), updatedAt: timestamp(raw.updatedAt)
    };
    if (!STATUSES.includes(p.status)) throw Error('Nepoznat dokazni status.');
    if (/[\r\n\0]/.test(p.launcher) || !/^(?:[A-Za-z]:[\\/]|\\\\[^\\/]+[\\/][^\\/]+[\\/])/.test(p.launcher)) throw Error('Unesi punu Windows putanju, bez komandi i novih redova.');
    if (!/\.(?:cmd|bat|ps1|exe|py|html)$/i.test(p.launcher)) throw Error('Podržani pokretači: CMD, BAT, PS1, EXE, PY i HTML.');
    if (p.status === 'VERIFIED' && !p.evidence) throw Error('Za ručnu potvrdu navedi konkretan dokaz.');
    return p;
  }
  function validateEntry(raw) {
    if (!isObject(raw)) throw Error('Neispravan dnevnički zapis.');
    const e = {
      id: identifier(raw.id, 'request_'), pluginId: identifier(raw.pluginId, 'plugin_'),
      pluginName: text(raw.pluginName, 'naziv izvornog plugina', 100),
      launcher: text(raw.launcher, 'putanja', 1000), createdAt: timestamp(raw.createdAt),
      payload: text(raw.payload, 'ulaz zahteva', 20000), executionStatus: 'NOT_RUN', results: []
    };
    if (raw.executionStatus !== 'NOT_RUN' || !Array.isArray(raw.results) || raw.results.length > 100) throw Error('Neispravan zahtev ili previše rezultata.');
    const seen = new Set();
    e.results = raw.results.map(r => {
      if (!isObject(r) || r.provenance !== 'REPORTED' || !RESULT_STATUSES.includes(r.status)) throw Error('Rezultat mora biti označen kao REPORTED.');
      const result = { id: identifier(r.id, 'result_'), createdAt: timestamp(r.createdAt), status: r.status, provenance: 'REPORTED', text: text(r.text, 'rezultat', 30000), evidence: text(r.evidence, 'dokaz rezultata', 4000) };
      if (seen.has(result.id)) throw Error('Ponovljen ID rezultata.');
      seen.add(result.id);
      return result;
    });
    return e;
  }
  function validateCatalog(raw) {
    if (!isObject(raw) || raw.schema !== SCHEMA || !Array.isArray(raw.plugins) || !Array.isArray(raw.journal)) throw Error('Očekuje se WHR V8 katalog sa pluginovima i dnevnikom.');
    if (raw.plugins.length > 1000 || raw.journal.length > 2000) throw Error('Najviše 1.000 pluginova i 2.000 zahteva po katalogu.');
    const plugins = raw.plugins.map(validatePlugin), journal = raw.journal.map(validateEntry);
    for (const list of [plugins, journal]) if (new Set(list.map(x => x.id)).size !== list.length) throw Error('Ponovljen ID u katalogu.');
    const ids = new Set(plugins.map(p => p.id));
    if (journal.some(e => !ids.has(e.pluginId))) throw Error('Zahtev se poziva na plugin koji nije u katalogu.');
    return { schema: SCHEMA, plugins, journal };
  }
  function mergeCatalog(current, incoming) {
    const a = validateCatalog(current), b = validateCatalog(incoming);
    function merge(left, right) {
      const map = new Map(left.map(x => [x.id, x]));
      for (const item of right) {
        if (map.has(item.id) && stable(map.get(item.id)) !== stable(item)) throw Error('Sukob ID-ja ' + item.id + '. Postojeći podaci nisu menjani.');
        map.set(item.id, item);
      }
      return [...map.values()];
    }
    return validateCatalog({ schema: SCHEMA, plugins: merge(a.plugins, b.plugins), journal: merge(a.journal, b.journal) });
  }
  function makeRequest(plugin, payload, id, createdAt) {
    const p = validatePlugin(plugin);
    return validateEntry({ id, pluginId: p.id, pluginName: p.name, launcher: p.launcher, payload, createdAt, executionStatus: 'NOT_RUN', results: [] });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { SCHEMA, emptyState, validatePlugin, validateEntry, validateCatalog, mergeCatalog, makeRequest };
  if (typeof document === 'undefined') return;

  const $ = id => document.getElementById(id);
  const el = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  };
  let state = emptyState(), storageAvailable = true, requestedPlugin = null, resultRequest = null;
  let toastTimer;
  const uid = prefix => prefix + (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + '_' + Math.random().toString(36).slice(2));
  function toast(message) {
    $('toast').textContent = message; $('toast').hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 5500);
  }
  function persist() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); storageAvailable = true; }
    catch (_) { storageAvailable = false; }
    $('storage-warning').hidden = storageAvailable;
  }
  function download(name, content, type = 'application/json') {
    const url = URL.createObjectURL(new Blob([content], { type: type + ';charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  const json = value => JSON.stringify(value, null, 2);
  const date = value => new Intl.DateTimeFormat('sr-Latn-RS', { timeZone: 'Europe/Belgrade', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  function button(label, fn, className) { const b = el('button', className, label); b.type = 'button'; b.addEventListener('click', fn); return b; }
  function openPlugin(plugin) {
    const form = $('plugin-form'); form.reset(); $('plugin-error').textContent = '';
    $('plugin-title').textContent = plugin ? 'Izmeni plugin' : 'Novi plugin';
    if (plugin) for (const key of ['id', 'name', 'launcher', 'project', 'version', 'description', 'input', 'output', 'status', 'evidence']) form.elements.namedItem(key).value = plugin[key];
    else form.elements.namedItem('id').value = '';
    $('plugin-dialog').showModal();
  }
  function openRequest(p) {
    requestedPlugin = p.id; $('request-form').reset(); $('request-error').textContent = '';
    $('request-plugin').textContent = p.name + ' · ' + p.project; $('request-dialog').showModal();
  }
  function renderPlugins() {
    const query = $('search').value.trim().toLocaleLowerCase('sr'), filter = $('status-filter').value;
    const plugins = state.plugins.filter(p => (!filter || p.status === filter) && [p.name, p.project, p.launcher, p.description].join(' ').toLocaleLowerCase('sr').includes(query));
    $('plugin-grid').replaceChildren();
    for (const p of plugins) {
      const card = el('article', 'plugin-card'), top = el('div', 'card-top');
      top.append(el('span', 'plugin-icon', '⌘'), el('span', 'badge ' + p.status, labels[p.status]));
      const title = el('div'); title.append(el('h3', '', p.name), el('span', 'meta', p.project + ' / ' + (p.version || 'verzija OPEN')));
      const io = el('div', 'io');
      for (const [label, value] of [['ULAZ', p.input], ['IZLAZ', p.output]]) { const block = el('div'); block.append(el('small', '', label), el('p', '', value)); io.append(block); }
      const bottom = el('div', 'card-bottom'); bottom.append(button('Pripremi ulaz →', () => openRequest(p)), button('Izmeni', () => openPlugin(p)));
      card.append(top, title, el('p', '', p.description), el('div', 'path', p.launcher), io);
      if (p.evidence) { const proof = el('details'); proof.append(el('summary', 'meta', 'Dokaz / otvorena pitanja'), el('p', '', p.evidence)); card.append(proof); }
      card.append(bottom); $('plugin-grid').append(card);
    }
    $('empty').hidden = state.plugins.length > 0;
    $('no-results').hidden = !state.plugins.length || plugins.length > 0;
    $('count-all').textContent = state.plugins.length;
    $('count-verified').textContent = state.plugins.filter(p => p.status === 'VERIFIED').length;
    $('count-requests').textContent = state.journal.length;
  }
  function renderJournal() {
    const list = $('journal-list'); list.replaceChildren();
    if (!state.journal.length) { list.append(el('div', 'empty', 'Nema pripremljenih ulaza. Izaberi plugin i pripremi prvi zahtev.')); return; }
    for (const entry of [...state.journal].reverse()) {
      const card = el('article', 'journal-entry');
      card.append(el('h3', '', entry.pluginName), el('div', 'meta', date(entry.createdAt) + ' · ' + entry.id), el('p', 'badge NOT_RUN', 'ZAHTEV · NOT_RUN'), el('pre', '', entry.payload));
      for (const r of entry.results) {
        const result = el('div', 'guide-card'); result.append(el('strong', '', r.status + ' · REPORTED'), el('p', 'meta', date(r.createdAt)), el('pre', '', r.text), el('p', 'hint', 'Dokaz / izvor: ' + r.evidence)); card.append(result);
      }
      card.append(button('Pridruži rezultat', () => {
        resultRequest = entry.id; $('result-form').reset(); $('result-error').textContent = '';
        $('result-request').textContent = entry.pluginName + ' · ' + entry.id; $('result-dialog').showModal();
      }), button('↓ Ponovo preuzmi zahtev', () => download(entry.id + '.json', json({ schema: 'WHR_V8_PLUGIN_REQUEST_1', ...entry })), ''));
      list.append(card);
    }
  }
  function route() {
    const requested = location.hash.slice(1), view = ['plugins', 'journal', 'guide'].includes(requested) ? requested : 'plugins';
    for (const name of ['plugins', 'journal', 'guide']) $('view-' + name).hidden = name !== view;
    for (const a of document.querySelectorAll('[data-view]')) {
      if (a.dataset.view === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    }
    renderPlugins(); renderJournal();
  }
  let savedRaw = null, corruptStorage = false;
  try { savedRaw = localStorage.getItem(STORE); if (savedRaw) state = validateCatalog(JSON.parse(savedRaw)); }
  catch (_) {
    // Never overwrite an unreadable or incompatible stored record on startup.
    storageAvailable = false; corruptStorage = savedRaw !== null; $('storage-warning').hidden = false;
    $('storage-warning').textContent = corruptStorage ? 'Raniji podaci nisu učitani. Sačuvana vrednost nije prepisana. Pre novih unosa preuzmi njenu kopiju.' : 'Pregledač ne dozvoljava trajno čuvanje. Radi u ovoj sesiji i izvezi podatke pre zatvaranja.';
    const rescue = button('↓ Preuzmi sačuvane podatke', () => { try { const raw = localStorage.getItem(STORE); if (raw) download('WHR_V8_RECOVERY.json', raw); else toast('Nema dostupnog sačuvanog zapisa.'); } catch (_) { toast('Pregledač ne dozvoljava pristup sačuvanim podacima.'); } });
    $('storage-warning').append(document.createTextNode(' '), rescue);
  }
  function saveNew(next) {
    if (corruptStorage) throw Error('Postojeći podaci nisu učitani. Prvo sačuvaj kopiju i razreši zapis u pregledaču; prepisivanje je blokirano.');
    state = validateCatalog(next); persist(); route();
    if (!storageAvailable) toast('Zapis je u sesiji. Trajno čuvanje nije uspelo — izvezi kopiju.');
  }
  $('add-plugin').addEventListener('click', () => openPlugin()); $('empty-add').addEventListener('click', () => openPlugin());
  $('plugin-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const raw = Object.fromEntries(new FormData(event.currentTarget)); raw.id ||= uid('plugin_'); raw.updatedAt = new Date().toISOString();
      const p = validatePlugin(raw), plugins = state.plugins.filter(item => item.id !== p.id).concat(p);
      saveNew({ ...state, plugins }); $('plugin-dialog').close(); toast(storageAvailable ? 'Plugin kartica je sačuvana.' : 'Kartica je u sesiji — izvezi katalog.');
    } catch (error) { $('plugin-error').textContent = error.message; }
  });
  $('request-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const plugin = state.plugins.find(p => p.id === requestedPlugin);
      const entry = makeRequest(plugin, new FormData(event.currentTarget).get('payload'), uid('request_'), new Date().toISOString());
      saveNew({ ...state, journal: [...state.journal, entry] });
      download(entry.id + '.json', json({ schema: 'WHR_V8_PLUGIN_REQUEST_1', ...entry }));
      $('request-dialog').close(); toast('Ulaz je pripremljen. Izvršavanje: NOT_RUN.');
    } catch (error) { $('request-error').textContent = error.message; }
  });
  $('result-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const result = { ...values, id: uid('result_'), createdAt: new Date().toISOString(), provenance: 'REPORTED' };
      const journal = state.journal.map(e => e.id === resultRequest ? { ...e, results: [...e.results, result] } : e);
      if (!journal.some(e => e.id === resultRequest)) throw Error('Izvorni zahtev nedostaje.');
      saveNew({ ...state, journal }); $('result-dialog').close(); toast('Prijavljeni rezultat je pridružen zahtevu.');
    } catch (error) { $('result-error').textContent = error.message; }
  });
  for (const b of document.querySelectorAll('[data-close]')) b.addEventListener('click', () => b.closest('dialog').close());
  for (const id of ['search', 'status-filter']) $(id).addEventListener('input', renderPlugins);
  $('export-button').addEventListener('click', () => download('WHR_V8_KATALOG.json', json({ ...state, exportedAt: new Date().toISOString() })));
  $('export-journal').addEventListener('click', () => download('WHR_V8_DNEVNIK.json', json({ schema: 'WHR_V8_JOURNAL_1', exportedAt: new Date().toISOString(), journal: state.journal })));
  $('import-button').addEventListener('click', () => $('file-input').click());
  $('file-input').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw Error('Katalog može imati najviše 5 MB.');
      const next = mergeCatalog(state, JSON.parse(await file.text()));
      const added = next.plugins.length - state.plugins.length; saveNew(next); toast('Uvoz završen: ' + added + ' novih pluginova.');
    } catch (error) { toast('Uvoz odbijen: ' + error.message); }
    finally { event.target.value = ''; }
  });
  window.addEventListener('hashchange', route); route();
})();
