(async function () {
  const $ = (id) => document.getElementById(id);
  const X = self.X2MD, UI = self.X2MDUI;
  const T = self.X2MDI18N.t;
  self.X2MDI18N.apply();
  document.title = T('convTitle');
  let { opts, prompt } = await UI.getOpts();
  let current = { md: '', title: '' };

  const setStatus = (html, cls) => { $('status').className = 'status ' + (cls || ''); $('status').innerHTML = html; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- 方式一：用浏览器登录态打开页面并提取 ---------- */
  async function waitComplete(tabId, ms) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      const t = await chrome.tabs.get(tabId);
      if (t.status === 'complete') return;
      await X.sleep(300);
    }
  }
  async function viaTab(url) {
    const tab = await chrome.tabs.create({ url, active: false });
    try {
      await waitComplete(tab.id, 25000);
      let lastErr = T('errNoResponse');
      for (let i = 0; i < 10; i++) {
        try {
          const res = await chrome.tabs.sendMessage(tab.id, { type: 'x2md:extract', opts: { ...opts, waitMs: 15000, maxScrolls: 12 } });
          if (res && res.ok) return res;
          lastErr = (res && res.error) || lastErr;
          break;
        } catch (e) { lastErr = e.message; await X.sleep(1000); }
      }
      if (/Receiving end|establish connection/.test(lastErr)) lastErr = T('errTabFailed');
      throw new Error(lastErr);
    } finally {
      chrome.tabs.remove(tab.id).catch(() => {});
    }
  }

  async function convertOne(input) {
    const n = X.normalizeUrl(input);
    const method = $('method').value;
    const errs = [];
    if (method !== 'api') {
      try { return await viaTab(n.url); } catch (e) { errs.push(T('viaLogin') + e.message); if (method === 'tab') throw new Error(errs.join('; ')); }
    }
    try { return await X.fetchViaApi(n.url, opts); } catch (e) { errs.push(e.message); }
    throw new Error(errs.join('; '));
  }

  async function run(e) {
    e && e.preventDefault();
    const inputs = $('url').value.split(/[\s,，]+/).map((s) => s.trim()).filter(Boolean);
    if (!inputs.length) { setStatus(T('enterLink'), 'err'); $('url').focus(); return; }
    $('go').disabled = true;
    const results = [], fails = [];
    for (let i = 0; i < inputs.length; i++) {
      setStatus('<span class="spinner"></span> ' + T('convertingN', inputs.length > 1 ? ` (${i + 1}/${inputs.length})` : ''));
      try { results.push(await convertOne(inputs[i])); } catch (err) { fails.push(`${esc(inputs[i])}: ${esc(err.message)}`); }
    }
    $('go').disabled = false;
    if (!results.length) { setStatus(T('failed', fails.join('<br>')), 'err'); return; }
    const md = results.map((r) => r.markdown.trim()).join('\n\n---\n\n') + '\n';
    const title = results.length > 1 ? T('collection', results.length) : results[0].title;
    show(md, title);
    $('stats').textContent = `${results.map((r) => T('k_' + r.type)).join(' + ')} · ${T('chars', md.length.toLocaleString())}`;
    setStatus(fails.length ? T('doneWithFails', fails.length, fails.join('<br>')) : T('done'), fails.length ? 'err' : 'ok');
    addHistory({ title, url: inputs.join(' '), md, time: Date.now() });
  }

  function show(md, title) {
    current = { md, title };
    $('src').value = md;
    $('prev').innerHTML = self.X2MDPreview.render(md);
    $('result').classList.remove('hidden');
    $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- 历史 ---------- */
  const getHist = () => new Promise((r) => chrome.storage.local.get({ x2mdHistory: [] }, (v) => r(v.x2mdHistory)));
  async function addHistory(item) {
    const h = (await getHist()).filter((x) => x.url !== item.url);
    h.unshift(item);
    await chrome.storage.local.set({ x2mdHistory: h.slice(0, 30) });
    drawHistory();
  }
  async function drawHistory() {
    const h = await getHist();
    const ul = $('hist');
    if (!h.length) { ul.innerHTML = `<li class="empty">${T('noHistory')}</li>`; return; }
    ul.innerHTML = '';
    h.forEach((it) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="t" title="${esc(it.url)}">${esc(it.title)}</span><time>${X.fmtTime(new Date(it.time).toISOString())}</time>`;
      li.querySelector('.t').onclick = () => { $('url').value = it.url; show(it.md, it.title); $('stats').textContent = T('fromHistory'); };
      const b = document.createElement('button'); b.className = 'btn sm'; b.textContent = T('copy');
      b.onclick = () => UI.copy(it.md).then(() => { b.textContent = T('copied'); setTimeout(() => (b.textContent = T('copy')), 1200); });
      li.appendChild(b); ul.appendChild(li);
    });
  }
  $('clearHist').onclick = async () => { await chrome.storage.local.set({ x2mdHistory: [] }); drawHistory(); };

  /* ---------- 事件 ---------- */
  $('form').addEventListener('submit', run);
  $('src').addEventListener('input', () => { current.md = $('src').value; $('prev').innerHTML = self.X2MDPreview.render(current.md); });
  $('copy').onclick = async () => { await UI.copy(current.md); $('copy').textContent = T('copied'); setTimeout(() => ($('copy').textContent = T('copy')), 1500); };
  $('dl').onclick = () => UI.download(current.md, current.title);
  document.querySelectorAll('[data-ai]').forEach((b) => (b.onclick = async () => {
    const manual = await UI.sendToAI(b.dataset.ai, current.md, $('prompt').value);
    setStatus(manual ? T('pastedManuallyAI') : T('openedAndCopied'), 'ok');
  }));
  $('prompt').value = prompt;
  $('prompt').addEventListener('change', () => chrome.storage.sync.set({ x2mdPrompt: $('prompt').value }));
  $('tabPrev').onclick = () => { $('tabPrev').classList.add('on'); $('tabSrc').classList.remove('on'); $('prev').classList.remove('hidden'); $('src').classList.add('hidden'); };
  $('tabSrc').onclick = () => { $('tabSrc').classList.add('on'); $('tabPrev').classList.remove('on'); $('src').classList.remove('hidden'); $('prev').classList.add('hidden'); };
  $('method').value = localStorage.getItem('x2md-method') || 'auto';
  $('method').onchange = () => localStorage.setItem('x2md-method', $('method').value);
  UI.renderOptions($('opts'), opts, (o) => { opts = o; });

  drawHistory();
  const q = new URLSearchParams(location.search);
  if (q.get('url')) { $('url').value = q.get('url'); run(); }
  else $('url').focus();
  if (q.get('welcome')) setStatus(T('welcome'), 'ok');
})();
