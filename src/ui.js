/* 弹窗与转换页共用的工具函数 */
(function (root) {
  const X = root.X2MD;
  const OPTION_LABELS = [
    ['frontmatter'], ['images'], ['linkify'], ['metrics'], ['replies'], ['autoScroll'],
  ];
  const AI_TARGETS = {
    claude: { name: 'Claude', url: 'https://claude.ai/new', q: 'https://claude.ai/new?q=' },
    chatgpt: { name: 'ChatGPT', url: 'https://chatgpt.com/', q: 'https://chatgpt.com/?q=' },
    gemini: { name: 'Gemini', url: 'https://gemini.google.com/app', q: null },
  };

  const getOpts = () => new Promise((r) => chrome.storage.sync.get({ x2mdOptions: {}, x2mdButtons: true, x2mdPrompt: '' }, (v) =>
    r({ opts: { ...X.DEFAULTS, ...v.x2mdOptions }, buttons: v.x2mdButtons !== false, prompt: v.x2mdPrompt || '' })));
  const saveOpts = (opts) => new Promise((r) => chrome.storage.sync.set({ x2mdOptions: opts }, r));

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy'); ta.remove(); return ok;
    }
  }
  function fileName(title) {
    const base = (title || 'x-post').replace(/[\\/:*?"<>|#\n\r]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'x-post';
    return base + '.md';
  }
  function download(text, title) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
    a.download = fileName(title);
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  async function sendToAI(key, md, prompt) {
    const t = AI_TARGETS[key];
    const text = (prompt ? prompt.trim() + '\n\n' : '') + md;
    await copy(text);
    const enc = encodeURIComponent(text);
    const url = t.q && enc.length < 7000 ? t.q + enc : t.url;
    chrome.tabs.create({ url });
    return url === t.url; // true = 需要手动粘贴
  }
  function renderOptions(container, opts, onChange) {
    container.innerHTML = '';
    OPTION_LABELS.forEach(([k]) => {
      const label = root.X2MDI18N.t('o_' + k);
      const id = 'opt-' + k;
      const wrap = document.createElement('label');
      wrap.className = 'chip';
      wrap.innerHTML = `<input type="checkbox" id="${id}"><span>${label}</span>`;
      const cb = wrap.querySelector('input');
      cb.checked = !!opts[k];
      cb.addEventListener('change', () => { opts[k] = cb.checked; saveOpts(opts); onChange && onChange(opts); });
      container.appendChild(wrap);
    });
  }
  root.X2MDUI = { getOpts, saveOpts, copy, download, sendToAI, renderOptions, AI_TARGETS, fileName };
})(self);
