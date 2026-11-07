(async function () {
  const $ = (id) => document.getElementById(id);
  const UI = self.X2MDUI;
  const T = self.X2MDI18N.t;
  self.X2MDI18N.apply();
  let state = { md: '', title: '' };
  let { opts, buttons, prompt } = await UI.getOpts();

  const openConv = () => { chrome.tabs.create({ url: chrome.runtime.getURL('converter.html') }); window.close(); };
  $('openConv').onclick = openConv; $('openConv2').onclick = openConv;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const onX = tab && /^https:\/\/(mobile\.)?(x|twitter)\.com\//.test(tab.url || '');
  if (!onX) { $('notX').classList.remove('hidden'); return; }
  $('onX').classList.remove('hidden');

  const setStatus = (html, cls) => { $('status').className = 'status ' + (cls || ''); $('status').innerHTML = html; };
  const enable = (on) => document.querySelectorAll('#copy,#dl,[data-ai]').forEach((b) => (b.disabled = !on));

  function show(md) {
    $('out').value = md;
    $('prev').innerHTML = self.X2MDPreview.render(md);
  }
  async function extract() {
    enable(false);
    setStatus('<span class="spinner"></span> ' + T('reading') + (opts.autoScroll ? T('readingScroll') : '') + '…');
    let res;
    try {
      res = await chrome.tabs.sendMessage(tab.id, { type: 'x2md:extract', opts });
    } catch (e) {
      setStatus(T('scriptNotReady'), 'err'); return;
    }
    if (!res || !res.ok) { setStatus(T('convertFailed', (res && res.error) || T('unknownError')), 'err'); return; }
    state = { md: res.markdown, title: res.title };
    show(res.markdown);
    const kind = T('k_' + (res.type || 'page'));
    setStatus(T('statsLine', kind, res.count, res.markdown.length.toLocaleString()), 'ok');
    enable(true);
  }

  $('out').addEventListener('input', () => { state.md = $('out').value; });
  $('copy').onclick = async () => { await UI.copy(state.md); $('copy').textContent = T('copied'); setTimeout(() => ($('copy').textContent = T('copyPage')), 1500); };
  $('dl').onclick = () => UI.download(state.md, state.title);
  $('reload').onclick = extract;
  document.querySelectorAll('[data-ai]').forEach((b) => (b.onclick = async () => {
    const manual = await UI.sendToAI(b.dataset.ai, state.md, prompt);
    if (manual) setStatus(T('pasteManually'), 'ok');
  }));
  $('tabSrc').onclick = () => { $('tabSrc').classList.add('on'); $('tabPrev').classList.remove('on'); $('out').classList.remove('hidden'); $('prev').classList.add('hidden'); };
  $('tabPrev').onclick = () => { $('tabPrev').classList.add('on'); $('tabSrc').classList.remove('on'); $('prev').classList.remove('hidden'); $('out').classList.add('hidden'); };

  UI.renderOptions($('opts'), opts, (o) => { opts = o; extract(); });
  $('btnToggle').checked = buttons;
  $('btnToggle').onchange = () => chrome.storage.sync.set({ x2mdButtons: $('btnToggle').checked });

  extract();
})();
