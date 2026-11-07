/* X2MD core — X (Twitter) DOM / API data  ->  structured tweets  ->  Markdown
 * Shared by the content script, popup and converter page. No dependencies. */
(function (root) {
  'use strict';

  const DEFAULTS = {
    frontmatter: true,   // YAML 元信息
    images: true,        // 图片 / 视频封面
    metrics: false,      // 互动数据
    replies: false,      // 串推之外的其他回复
    linkify: true,       // @提及 / #话题 转为链接
    autoScroll: true,    // 自动滚动加载长串推
    maxScrolls: 40,
    imageSize: 'orig',   // orig | large | medium
  };
  const ARTICLE_SEL = '[data-testid="twitterArticleRichTextView"],[data-testid="twitterArticleReadView"],[data-testid="longformRichTextComponent"]';
  const BLOCK_TAGS = new Set(['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'PRE', 'FIGURE', 'SECTION', 'ARTICLE', 'HR', 'TABLE', 'HEADER', 'FOOTER']);
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'BUTTON', 'svg', 'SVG', 'TEMPLATE', 'INPUT']);

  const T = (...a) => (root.X2MDI18N ? root.X2MDI18N.t(...a) : a[0]);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function absUrl(h) {
    try {
      const u = new URL(h, 'https://x.com');
      if (/^(www\.|mobile\.)?twitter\.com$/.test(u.hostname)) u.hostname = 'x.com';
      return u.href;
    } catch (e) { return h || ''; }
  }
  function imgUrl(src, size) {
    try {
      const u = new URL(src);
      if (u.hostname === 'pbs.twimg.com' && u.pathname.startsWith('/media/')) {
        if (!u.searchParams.get('format')) {
          const m = u.pathname.match(/\.(jpg|jpeg|png|webp|gif)$/);
          if (m) { u.pathname = u.pathname.slice(0, -m[0].length); u.searchParams.set('format', m[1]); }
        }
        u.searchParams.set('name', size || 'orig');
      }
      return u.href;
    } catch (e) { return src; }
  }
  const clean = (s) => (s || '').replace(/ /g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const wrap = (s, m) => {
    const p = s.match(/^(\s*)([\s\S]*?)(\s*)$/);
    return p[2] ? p[1] + m + p[2] + m + p[3] : s;
  };
  const statusId = (url) => ((url || '').match(/\/status(?:es)?\/(\d+)/) || [])[1] || '';

  /* ---------------- DOM → inline Markdown ---------------- */
  function linkToMd(a, o) {
    const href = a.getAttribute('href') || '';
    const txt = (a.textContent || '').trim();
    if (!txt) {
      const img = a.querySelector('img');
      return img ? imgToMd(img, o) : '';
    }
    if (/^[@#$＃]/.test(txt)) return o.linkify ? `[${txt}](${absUrl(href).split('?')[0]})` : txt;
    // t.co 链接：X 把完整 URL 放在隐藏 span 里，textContent 即为完整地址（末尾带 …）
    if (/\/\/t\.co\//.test(href) || /^https?:\/\//i.test(txt)) {
      let full = txt.replace(/…$/, '').trim();
      if (!/^https?:\/\//i.test(full)) full = /^[\w-]+(\.[\w-]+)+(\/|$)/.test(full) && !/…/.test(txt) ? 'https://' + full : href;
      return full;
    }
    return `[${txt}](${absUrl(href)})`;
  }
  function imgToMd(img, o) {
    const src = img.getAttribute('src') || '';
    const alt = img.getAttribute('alt') || '';
    if (/emoji|twemoji/.test(src) || (!/\/media\/|\/card_img\/|amplify|ext_tw/.test(src) && alt.length <= 4)) return alt;
    if (/profile_images/.test(src)) return '';
    return o.images ? `![${alt && alt !== '图像' && alt !== 'Image' ? alt : ''}](${imgUrl(src, o.imageSize)})` : '';
  }
  function inline(node, o) {
    let out = '';
    for (const n of node.childNodes) {
      if (n.nodeType === 3) { out += n.nodeValue; continue; }
      if (n.nodeType !== 1 || SKIP_TAGS.has(n.tagName)) continue;
      const t = n.tagName;
      if (t === 'BR') { out += '\n'; continue; }
      if (t === 'IMG') { out += imgToMd(n, o); continue; }
      if (t === 'A') { out += linkToMd(n, o); continue; }
      let inner = inline(n, o);
      const st = n.style || {};
      if (t === 'STRONG' || t === 'B' || st.fontWeight === 'bold' || +st.fontWeight >= 600) inner = wrap(inner, '**');
      if (t === 'EM' || t === 'I' || st.fontStyle === 'italic') inner = wrap(inner, '*');
      if (t === 'S' || t === 'DEL' || /line-through/.test(st.textDecoration || '')) inner = wrap(inner, '~~');
      if (t === 'CODE') inner = '`' + inner + '`';
      out += inner;
    }
    return out;
  }

  /* ---------------- DOM → block Markdown (X Articles) ---------------- */
  function hasBlockChild(el) {
    for (const c of el.children) {
      if (BLOCK_TAGS.has(c.tagName)) return true;
      if ((c.tagName === 'SPAN' || c.tagName === 'A') && hasBlockChild(c)) return true;
    }
    return false;
  }
  function listMd(list, o, depth) {
    const ordered = list.tagName === 'OL';
    let i = 0;
    const lines = [];
    for (const li of list.children) {
      if (li.tagName !== 'LI') continue;
      i++;
      const body = hasBlockChild(li) ? blockMd(li, o, depth + 1) : clean(inline(li, o));
      const prefix = ordered ? `${i}. ` : '- ';
      const pad = ' '.repeat(prefix.length);
      lines.push(prefix + body.split('\n').map((l, k) => (k ? (l ? pad + l : '') : l)).join('\n'));
    }
    return lines.join('\n');
  }
  function blockMd(el, o, depth = 0) {
    const out = [];
    let buf = '';
    const flush = () => { const s = clean(buf); if (s) out.push(s); buf = ''; };
    const push = (s) => { flush(); if (s && s.trim()) out.push(s.replace(/\s+$/, '')); };
    for (const n of el.childNodes) {
      if (n.nodeType === 3) { buf += n.nodeValue; continue; }
      if (n.nodeType !== 1 || SKIP_TAGS.has(n.tagName)) continue;
      const t = n.tagName;
      if (n.getAttribute('aria-hidden') === 'true' && !n.querySelector('img')) continue;
      if (/^H[1-6]$/.test(t)) { push('#'.repeat(+t[1]) + ' ' + clean(inline(n, o)).replace(/\n+/g, ' ')); continue; }
      if (t === 'UL' || t === 'OL') { push(listMd(n, o, depth)); continue; }
      if (t === 'BLOCKQUOTE') { push(blockMd(n, o, depth).split('\n').map((l) => (l ? '> ' + l : '>')).join('\n')); continue; }
      if (t === 'PRE') { push('```\n' + n.textContent.replace(/\n$/, '') + '\n```'); continue; }
      if (t === 'HR') { push('---'); continue; }
      if (t === 'IMG') { const s = imgToMd(n, o); if (s.startsWith('![')) push(s); else buf += s; continue; }
      if (t === 'VIDEO') { if (o.images) push(n.poster ? `![${T('videoCover')}](${n.poster})` : `*[${T('video')}]*`); continue; }
      if (t === 'BR') { buf += '\n'; continue; }
      if (BLOCK_TAGS.has(t) || hasBlockChild(n)) {
        if (hasBlockChild(n)) push(blockMd(n, o, depth));
        else push(clean(inline(n, o)));
        continue;
      }
      if (t === 'A') { buf += linkToMd(n, o); continue; }
      buf += inline({ childNodes: [n] }, o);
    }
    flush();
    return out.join('\n\n');
  }

  /* ---------------- DOM → tweet objects ---------------- */
  function parseCore(scope, own, o) {
    const all = (sel) => [...scope.querySelectorAll(sel)].filter(own);
    const user = all('[data-testid="User-Name"]')[0];
    let name = '', handle = '';
    if (user) {
      const RE = /^@([A-Za-z0-9_]{1,15})$/;
      const el = [...user.querySelectorAll('span,div,a')].find((s) => RE.test((s.textContent || '').trim()));
      if (el) handle = (el.textContent || '').trim().match(RE)[1];
      if (!handle) {
        const a = [...user.querySelectorAll('a[href]')].map((x) => (x.getAttribute('href') || '').match(/^\/([A-Za-z0-9_]{1,15})$/)).find(Boolean);
        if (a) handle = a[1];
      }
      if (!handle) { const hm = (user.innerText || user.textContent || '').match(/@([A-Za-z0-9_]{1,15})/); handle = hm ? hm[1] : ''; }
      const first = user.querySelector('a') || user.firstElementChild || user;
      name = clean(inline(first, { ...o, linkify: false })).split('\n')[0].replace(/@\w+.*$/, '').trim();
    }
    const timeEl = all('time')[0];
    const tLink = timeEl && timeEl.closest('a');
    let url = tLink ? absUrl(tLink.getAttribute('href')).replace(/\/(analytics|photo\/\d+|video\/\d+|history)$/, '') : '';
    const textEl = all('[data-testid="tweetText"]')[0];
    const images = [...new Set(all('[data-testid="tweetPhoto"] img, [data-testid="card.layoutLarge.media"] img').map((i) => imgUrl(i.getAttribute('src'), o.imageSize)))].filter((s) => !/profile_images/.test(s));
    const videos = all('video').map((v) => ({ poster: v.getAttribute('poster') || '' }));
    if (!videos.length) all('[data-testid="videoPlayer"],[data-testid="videoComponent"]').forEach(() => videos.push({ poster: '' }));
    let card = null;
    const cw = all('[data-testid="card.wrapper"]')[0];
    if (cw) {
      const a = cw.querySelector('a[href]');
      const lines = clean(cw.innerText || cw.textContent).split('\n').map((s) => s.trim()).filter(Boolean);
      const domain = lines.find((l) => /^(来自\s*)?[\w-]+(\.[\w-]+)+$/.test(l) || /^From /.test(l));
      const title = lines.filter((l) => l !== domain).sort((a, b) => b.length - a.length)[0] || '';
      card = { url: a ? a.getAttribute('href') : '', title, domain: (domain || '').replace(/^(来自|From)\s*/, '') };
    }
    const group = all('[role="group"][aria-label]')[0];
    const social = all('[data-testid="socialContext"]')[0];
    return {
      id: statusId(url), url, name, handle,
      time: timeEl ? timeEl.getAttribute('datetime') : '',
      lang: textEl ? textEl.getAttribute('lang') || '' : '',
      text: textEl ? clean(inline(textEl, o)) : '',
      truncated: all('[data-testid="tweet-text-show-more-link"]').length > 0,
      images, videos, card,
      metricsLabel: group ? group.getAttribute('aria-label') : '',
      social: social ? clean(social.innerText || social.textContent) : '',
    };
  }
  function findQuoteBox(art) {
    return [...art.querySelectorAll('div[role="link"]')].find((d) => d.querySelector('[data-testid="User-Name"]') && d !== art);
  }
  function parseTweet(art, opts) {
    const o = { ...DEFAULTS, ...opts };
    const qb = findQuoteBox(art);
    const t = parseCore(art, (el) => !qb || !qb.contains(el), o);
    if (qb) {
      const q = parseCore(qb, () => true, o);
      if (!q.url && q.handle) q.url = `https://x.com/${q.handle}`;
      t.quote = q;
    }
    return t;
  }

  /* ---------------- Page extraction (content script) ---------------- */
  async function waitFor(fn, ms) {
    const end = Date.now() + (ms || 0);
    while (true) {
      const v = fn();
      if (v || Date.now() >= end) return v;
      await sleep(300);
    }
  }
  function detectPage(loc) {
    loc = loc || location;
    const p = loc.pathname;
    if (/\/(i\/)?article\/\d+/.test(p) || (typeof document !== 'undefined' && document.querySelector(ARTICLE_SEL))) return 'article';
    if (/\/status\/\d+/.test(p)) return 'thread';
    return 'timeline';
  }
  async function collect(o, stopFn) {
    const map = new Map();
    const grab = () => {
      let added = 0;
      document.querySelectorAll('article[data-testid="tweet"]').forEach((a) => {
        const t = parseTweet(a, o);
        if (!t.id) return; // 广告 / 占位
        const prev = map.get(t.id);
        if (!prev) { map.set(t.id, t); added++; }
        else if (t.text.length > prev.text.length || (prev.truncated && !t.truncated)) map.set(t.id, t);
      });
      return added;
    };
    grab();
    const list = () => [...map.values()];
    if (o.autoScroll) {
      const startY = window.scrollY;
      let idle = 0;
      for (let i = 0; i < o.maxScrolls && idle < 3; i++) {
        if (stopFn && stopFn(list())) break;
        window.scrollBy(0, Math.round(window.innerHeight * 0.85));
        await sleep(document.hidden ? 1100 : 750);
        const n = grab();
        const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
        idle = n ? 0 : idle + (atBottom ? 2 : 1);
      }
      window.scrollTo(0, startY);
    }
    return list();
  }
  function pickThread(tweets, focalId, o) {
    const fi = tweets.findIndex((t) => t.id === focalId);
    if (fi < 0) return { list: tweets, main: tweets[0] };
    const main = tweets[fi];
    if (o.replies) return { list: tweets, main };
    const list = tweets.slice(0, fi + 1);
    for (let i = fi + 1; i < tweets.length; i++) {
      if (tweets[i].handle !== main.handle) break;
      list.push(tweets[i]);
    }
    return { list, main };
  }
  async function extractPage(opts) {
    const o = { ...DEFAULTS, ...opts };
    await waitFor(() => document.querySelector('article[data-testid="tweet"],' + ARTICLE_SEL), o.waitMs || 0);
    const type = detectPage();
    const url = absUrl(location.href.split('?')[0]);

    if (type === 'article') {
      const rootEl = document.querySelector(ARTICLE_SEL);
      const scope = (rootEl && rootEl.closest('article,[data-testid="primaryColumn"],main')) || document;
      const titleEl = document.querySelector('[data-testid="twitter-article-title"]') || (rootEl && rootEl.querySelector('h1'));
      const title = titleEl ? clean(titleEl.innerText || titleEl.textContent) : document.title.replace(/ \/ X$/, '');
      const head = parseCore(scope, () => true, o);
      const cover = scope.querySelector('[data-testid="article-cover-image"] img, [data-testid="twitter-article-cover"] img');
      let body = rootEl ? blockMd(rootEl, o) : '';
      if (title && body.startsWith('# ' + title)) body = body.slice(title.length + 2).trim();
      if (!body) throw new Error(T('errNoArticle'));
      return render({ type: 'article', url, article: { title, md: body, cover: cover ? imgUrl(cover.src, o.imageSize) : '' }, main: head }, o);
    }

    if (type === 'thread') {
      const focalId = statusId(location.pathname);
      if (o.autoScroll) { window.scrollTo(0, 0); await sleep(400); }
      const tweets = await collect(o, (list) => {
        if (o.replies) return false;
        const fi = list.findIndex((t) => t.id === focalId);
        return fi >= 0 && list.slice(fi + 1).some((t) => t.handle !== list[fi].handle);
      });
      if (!tweets.length) throw new Error(T('errNoPostsLogin'));
      const { list, main } = pickThread(tweets, focalId, o);
      return render({ type: list.length > 1 ? 'thread' : 'tweet', url, tweets: list, main }, o);
    }

    const tweets = await collect({ ...o, maxScrolls: Math.min(o.maxScrolls, 15) });
    if (!tweets.length) throw new Error(T('errNoPosts'));
    return render({ type: 'timeline', url, title: document.title.replace(/ \/ X$/, ''), tweets, main: tweets[0] }, o);
  }

  /* ---------------- Render ---------------- */
  function fmtTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  function frontmatter(obj) {
    return '---\n' + Object.entries(obj).filter(([, v]) => v !== '' && v != null)
      .map(([k, v]) => `${k}: ${JSON.stringify(String(v))}`).join('\n') + '\n---\n\n';
  }
  function fmtMetrics(m) {
    if (!m) return '';
    const L = ['replies', 'retweets', 'likes', 'bookmarks', 'views'];
    return L.filter((k) => m[k] != null).map((k) => `${m[k]} ${T('m_' + k)}`).join(' · ');
  }
  function snippet(s, n) {
    s = (s || '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n) + '…' : s;
  }
  function tweetBody(t, o) {
    const parts = [];
    if (t.text) parts.push(t.text);
    if (t.truncated) parts.push(T('truncated'));
    const imgs = t.images || [], vids = t.videos || [];
    if (o.images) {
      imgs.forEach((s, i) => parts.push(`![${T('image')}${imgs.length > 1 ? ' ' + (i + 1) : ''}](${s})`));
      vids.forEach((v) => parts.push(v.poster ? `[![${T('video')}](${v.poster})](${t.url || ''})` : `*[${T('video')}](${t.url || ''})*`));
    } else if (imgs.length || vids.length) {
      parts.push(T('mediaCount', [imgs.length ? T('nImages', imgs.length) : '', vids.length ? T('nVideos', vids.length) : ''].filter(Boolean).join(T('and'))));
    }
    if (t.card && (t.card.url || t.card.title)) {
      parts.push(`> ${T('linkCard')}${T('colon')}[${t.card.title || t.card.domain || t.card.url}](${t.card.url})${t.card.domain ? ' — ' + t.card.domain : ''}`);
    }
    if (t.quote) {
      const q = t.quote;
      const head = `**${T('quote')} ${q.name || ''} [@${q.handle}](https://x.com/${q.handle})**${q.time ? ` · [${fmtTime(q.time)}](${q.url})` : ''}`;
      parts.push([head, tweetBody(q, { ...o, metrics: false })].filter(Boolean).join('\n\n').split('\n').map((l) => (l ? '> ' + l : '>')).join('\n'));
    }
    if (o.metrics && (t.metricsLabel || t.metrics)) parts.push(`*${t.metricsLabel || fmtMetrics(t.metrics)}*`);
    return parts.join('\n\n');
  }
  const byline = (t) => `**${t.name || t.handle}** [@${t.handle}](https://x.com/${t.handle})` +
    (t.time ? ` · [${fmtTime(t.time)}](${t.url})` : t.url ? ` · [${T('original')}](${t.url})` : '');

  function render(page, opts) {
    const o = { ...DEFAULTS, ...opts };
    const main = page.main || (page.tweets || [])[0] || {};
    const who = main.handle ? `${main.name || main.handle} (@${main.handle})` : '';
    let md = '', title = '';

    if (page.type === 'article') {
      const a = page.article;
      title = a.title || T('untitledArticle');
      if (o.frontmatter) md += frontmatter({ title, author: who, url: page.url, published: main.time, captured: new Date().toISOString(), source: 'X Article', clipper: 'Dachuan X2MD' });
      md += `# ${title}\n\n`;
      if (main.handle) md += byline({ ...main, url: main.url || page.url }) + '\n\n';
      if (a.cover && o.images) md += `![${T('cover')}](${a.cover})\n\n`;
      md += a.md + '\n';
      return { markdown: md, title, type: 'article', count: 1 };
    }

    const tweets = page.tweets || [];
    if (page.type === 'timeline') {
      title = page.title || T('timeline');
      if (o.frontmatter) md += frontmatter({ title, url: page.url, captured: new Date().toISOString(), source: 'X (Twitter)', clipper: 'Dachuan X2MD', count: tweets.length });
      md += `# ${title}\n\n`;
      md += tweets.map((t) => `## ${t.name || t.handle} (@${t.handle})${t.time ? ' · ' + fmtTime(t.time) : ''}\n\n` +
        (t.social ? `*${t.social}*\n\n` : '') + tweetBody(t, o) + `\n\n[${T('original')}](${t.url})`).join('\n\n---\n\n') + '\n';
      return { markdown: md, title, type: 'timeline', count: tweets.length };
    }

    const own = tweets.filter((t) => t.handle === main.handle);
    const isThread = own.length > 1;
    const snip = snippet(main.text, 50);
    title = `${isThread ? T('threadBy', main.name || main.handle) : (main.name || main.handle)}${snip ? T('colon') + snip : ''}`;
    if (o.frontmatter) md += frontmatter({ title, author: who, url: main.url || page.url, published: main.time, captured: new Date().toISOString(), source: 'X (Twitter)', clipper: 'Dachuan X2MD', type: isThread ? 'thread' : 'tweet', posts: isThread ? own.length : '' });
    md += `# ${title}\n\n`;
    if (tweets.length === 1) {
      md += byline(main) + '\n\n' + tweetBody(main, o) + '\n';
    } else {
      md += byline(main) + (isThread ? ' · ' + T('postsCount', own.length) : '') + '\n\n';
      let n = 0;
      md += tweets.map((t) => {
        if (t.handle === main.handle) {
          n++;
          return `### ${n}/${own.length}${t.time && t.id !== main.id ? ` · [${fmtTime(t.time)}](${t.url})` : ''}\n\n${tweetBody(t, o)}`;
        }
        return `### ${t.name || t.handle} (@${t.handle})\n\n${byline(t)}\n\n${tweetBody(t, o)}`;
      }).join('\n\n') + '\n';
    }
    return { markdown: md, title, type: isThread ? 'thread' : 'tweet', count: tweets.length };
  }

  function renderTweet(t, opts) {
    return render({ type: 'tweet', url: t.url, tweets: [t], main: t }, opts);
  }

  root.X2MD = { DEFAULTS, ARTICLE_SEL, parseTweet, extractPage, render, renderTweet, blockMd, inline, detectPage, imgUrl, absUrl, statusId, fmtTime, clean, sleep };
})(typeof self !== 'undefined' ? self : this);
