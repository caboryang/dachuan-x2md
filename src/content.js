/* X2MD content script — runs on x.com / twitter.com */
(function () {
  'use strict';
  const X = self.X2MD;
  const T = self.X2MDI18N.t;
  let opts = { ...X.DEFAULTS };
  let showButtons = true;

  const loadOpts = () => new Promise((r) => {
    try {
      chrome.storage.sync.get({ x2mdOptions: {}, x2mdButtons: true }, (v) => {
        opts = { ...X.DEFAULTS, ...(v.x2mdOptions || {}) };
        showButtons = v.x2mdButtons !== false;
        r();
      });
    } catch (e) { r(); }
  });
  chrome.storage.onChanged.addListener(() => loadOpts().then(scan));

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy'); ta.remove(); return ok;
    }
  }
  function toast(msg, err) {
    let el = document.getElementById('x2md-toast');
    if (!el) { el = document.createElement('div'); el.id = 'x2md-toast'; document.body.appendChild(el); }
    el.textContent = msg; el.className = err ? 'err show' : 'show';
    clearTimeout(el._t); el._t = setTimeout(() => (el.className = err ? 'err' : ''), 2200);
  }

  /* ---------- 每条帖子操作栏里的「MD」按钮 ---------- */
  function addButton(article) {
    if (article.querySelector(':scope .x2md-btn')) return;
    const qb = [...article.querySelectorAll('div[role="link"]')].find((d) => d.querySelector('[data-testid="User-Name"]'));
    const group = [...article.querySelectorAll('[role="group"]')].find((g) => !qb || !qb.contains(g));
    if (!group) return;
    const btn = document.createElement('button');
    btn.className = 'x2md-btn';
    btn.type = 'button';
    btn.title = T('btnTitle');
    btn.textContent = 'MD';
    btn.addEventListener('click', async (e) => {
      e.preventDefault(); e.stopPropagation();
      try {
        const res = e.shiftKey ? await X.extractPage(opts) : X.renderTweet(X.parseTweet(article, opts), opts);
        await copyText(res.markdown);
        toast(e.shiftKey ? T('copiedPage', res.count) : T('copiedPost'));
      } catch (err) { toast(T('convertFailed', err.message), true); }
    }, true);
    group.appendChild(btn);
  }
  function scan() {
    document.querySelectorAll('.x2md-btn').forEach((b) => { if (!showButtons) b.remove(); });
    if (!showButtons) return;
    document.querySelectorAll('article[data-testid="tweet"]').forEach(addButton);
  }
  let pending = false;
  new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; scan(); });
  }).observe(document.documentElement, { childList: true, subtree: true });

  /* ---------- 来自 popup / 转换页 / 快捷键 的消息 ---------- */
  chrome.runtime.onMessage.addListener((msg, sender, send) => {
    if (msg && msg.type === 'x2md:ping') { send({ ok: true, page: X.detectPage(), url: location.href }); return; }
    if (msg && msg.type === 'x2md:extract') {
      X.extractPage({ ...opts, ...(msg.opts || {}) })
        .then((res) => send({ ok: true, ...res }))
        .catch((e) => send({ ok: false, error: e.message }));
      return true;
    }
    if (msg && msg.type === 'x2md:copyPage') {
      toast(T('converting'));
      X.extractPage(opts)
        .then(async (res) => { await copyText(res.markdown); toast(T('copiedPage', res.count)); })
        .catch((e) => toast(T('convertFailed', e.message), true));
    }
  });

  loadOpts().then(scan);
})();
