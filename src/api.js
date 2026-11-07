/* X2MD API fallback — 不登录也能转换单条帖子 / 部分文章
 * 来源：FxTwitter 公共 API → X 官方 syndication 嵌入接口（逐个尝试） */
(function (root) {
  'use strict';
  const X = root.X2MD;
  const T = (...a) => (root.X2MDI18N ? root.X2MDI18N.t(...a) : a[0]);

  function normalizeUrl(input) {
    let s = (input || '').trim();
    if (!s) throw new Error(T('errEmptyUrl'));
    if (/^\d{5,25}$/.test(s)) return { id: s, user: 'i', url: `https://x.com/i/status/${s}` };
    if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
    let u;
    try { u = new URL(s); } catch (e) { throw new Error(T('errBadUrl')); }
    const host = u.hostname.replace(/^(www|mobile|m)\./, '');
    if (!['x.com', 'twitter.com', 'fxtwitter.com', 'fixupx.com', 'vxtwitter.com', 'fixvx.com'].includes(host)) {
      throw new Error(T('errNotX'));
    }
    const p = u.pathname;
    let m = p.match(/^\/([^/]+)\/status(?:es)?\/(\d+)/);
    if (m) return { id: m[2], user: m[1], url: `https://x.com/${m[1]}/status/${m[2]}`, kind: 'status' };
    m = p.match(/^\/(?:([^/]+)\/)?article\/(\d+)/) || p.match(/^\/i\/article\/(\d+)/);
    if (m) {
      const id = m[2] || m[1];
      return { id, user: m[2] ? m[1] : 'i', url: `https://x.com${p.replace(/\/$/, '')}`, kind: 'article' };
    }
    return { url: `https://x.com${p.replace(/\/$/, '') || '/'}`, kind: 'page' };
  }

  function linkifyPlain(s, o) {
    if (!o.linkify) return s;
    return s
      .replace(/(^|[\s(（，。,])@([A-Za-z0-9_]{1,15})\b/g, '$1[@$2](https://x.com/$2)')
      .replace(/(^|[\s(（，。,])#([\p{L}\p{N}_]+)/gu, (_, a, tag) => `${a}[#${tag}](https://x.com/hashtag/${encodeURIComponent(tag)})`);
  }

  /* Draft.js 内容（X Article）→ Markdown */
  function draftToMd(article, o) {
    const content = article.content || article;
    const blocks = content.blocks || [];
    let em = content.entityMap || {};
    if (Array.isArray(em)) { const obj = {}; em.forEach((e) => { obj[e.key] = e.value || e; }); em = obj; }
    const mediaList = article.media_entities || [];
    const mediaUrl = (id) => {
      const m = mediaList.find((x) => String(x.media_id || x.id) === String(id));
      return m && ((m.media_info && (m.media_info.original_img_url || m.media_info.url)) || m.url || m.media_url_https);
    };
    let ol = 0;
    const out = [];
    for (const b of blocks) {
      const text = b.text || '';
      const before = {}, after = {};
      const add = (map, k, v) => { map[k] = (map[k] || '') + v; };
      (b.inlineStyleRanges || []).forEach((r) => {
        const mk = /bold/i.test(r.style) ? '**' : /italic/i.test(r.style) ? '*' : /strike/i.test(r.style) ? '~~' : /code/i.test(r.style) ? '`' : '';
        if (!mk || !r.length) return;
        add(before, r.offset, mk); after[r.offset + r.length - 1] = mk + (after[r.offset + r.length - 1] || '');
      });
      (b.entityRanges || []).forEach((r) => {
        const e = em[r.key] || {};
        const data = e.data || {};
        if (/link/i.test(e.type || '') && data.url) {
          add(before, r.offset, '['); after[r.offset + r.length - 1] = (after[r.offset + r.length - 1] || '') + `](${data.url})`;
        }
      });
      let line = '';
      for (let i = 0; i < text.length; i++) line += (before[i] || '') + text[i] + (after[i] || '');
      const type = b.type || 'unstyled';
      if (type !== 'ordered-list-item') ol = 0;
      if (type === 'atomic') {
        (b.entityRanges || []).forEach((r) => {
          const e = em[r.key] || {};
          const d = e.data || {};
          if (/divider/i.test(e.type)) out.push('---');
          else if (/media/i.test(e.type) && o.images) (d.mediaItems || []).forEach((mi) => { const u = mediaUrl(mi.mediaId || mi.media_id); if (u) out.push(`![](${X.imgUrl(u, o.imageSize)})`); });
          else if (/tweet/i.test(e.type) && d.tweetId) out.push(`> ${T('embeddedPost')}${T('colon')}https://x.com/i/status/${d.tweetId}`);
          else if (/markdown|code/i.test(e.type) && d.markdown) out.push(d.markdown);
        });
        continue;
      }
      if (!line.trim()) continue;
      switch (type) {
        case 'header-one': out.push('# ' + line); break;
        case 'header-two': out.push('## ' + line); break;
        case 'header-three': out.push('### ' + line); break;
        case 'unordered-list-item': out.push('- ' + line); break;
        case 'ordered-list-item': out.push(`${++ol}. ` + line); break;
        case 'blockquote': out.push('> ' + line); break;
        case 'code-block': out.push('```\n' + text + '\n```'); break;
        default: out.push(line);
      }
    }
    // 连续列表项之间不留空行
    return out.join('\n\n').replace(/^(- .*|\d+\. .*)\n\n(?=- |\d+\. )/gm, '$1\n');
  }

  function fxToTweet(t, o) {
    if (!t) return null;
    const media = t.media || {};
    return {
      id: t.id, url: (t.url || '').replace(/twitter\.com/, 'x.com'),
      name: (t.author || {}).name || '', handle: (t.author || {}).screen_name || '',
      time: t.created_timestamp ? new Date(t.created_timestamp * 1000).toISOString() : t.created_at || '',
      text: linkifyPlain((t.raw_text && t.raw_text.text) && !t.text ? t.raw_text.text : t.text || '', o),
      images: (media.photos || []).map((p) => X.imgUrl(p.url, o.imageSize)),
      videos: (media.videos || []).map((v) => ({ poster: v.thumbnail_url || '', src: v.url })),
      card: null,
      quote: t.quote ? fxToTweet(t.quote, o) : null,
      metrics: o.metrics ? { replies: t.replies, retweets: t.retweets, likes: t.likes, bookmarks: t.bookmarks, views: t.views } : null,
      article: t.article || null,
    };
  }

  function synToken(id) {
    return ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '');
  }
  function synToTweet(j, o) {
    if (!j || !j.user) return null;
    let text = (j.note_tweet && j.note_tweet.note_tweet_results && j.note_tweet.note_tweet_results.result && j.note_tweet.note_tweet_results.result.text) || j.text || '';
    const ent = j.entities || {};
    (ent.urls || []).forEach((u) => { text = text.split(u.url).join(u.expanded_url); });
    (ent.media || []).forEach((m) => { text = text.split(m.url).join(''); });
    const md = j.mediaDetails || [];
    const handle = j.user.screen_name;
    const id = j.id_str;
    return {
      id, url: `https://x.com/${handle}/status/${id}`, name: j.user.name, handle,
      time: j.created_at ? new Date(j.created_at).toISOString() : '',
      text: linkifyPlain(text.trim(), o),
      images: md.filter((m) => m.type === 'photo').map((m) => X.imgUrl(m.media_url_https, o.imageSize)),
      videos: md.filter((m) => m.type !== 'photo').map((m) => ({ poster: m.media_url_https })),
      card: j.card && j.card.binding_values ? {
        url: (j.card.url || ''),
        title: ((j.card.binding_values.title || {}).string_value) || '',
        domain: ((j.card.binding_values.vanity_url || {}).string_value) || '',
      } : null,
      quote: j.quoted_tweet ? synToTweet(j.quoted_tweet, o) : null,
      metrics: o.metrics ? { replies: j.conversation_count, likes: j.favorite_count } : null,
    };
  }

  async function getJson(url) {
    const r = await fetch(url, { credentials: 'omit' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }

  async function fetchViaApi(input, opts) {
    const o = { ...X.DEFAULTS, ...opts };
    const n = normalizeUrl(input);
    if (!n.id) throw new Error(T('errApiOnlyStatus'));
    const errors = [];
    try {
      const j = await getJson(`https://api.fxtwitter.com/${n.user || 'i'}/status/${n.id}`);
      if (j && j.tweet) {
        const t = fxToTweet(j.tweet, o);
        if (t.article && (t.article.content || t.article.title)) {
          const a = t.article;
          return X.render({ type: 'article', url: t.url, main: t, article: { title: a.title || '', md: draftToMd(a, o) || a.preview_text || '', cover: a.cover_media && a.cover_media.media_info ? a.cover_media.media_info.original_img_url : '' } }, o);
        }
        return X.render({ type: 'tweet', url: t.url, tweets: [t], main: t }, o);
      }
      errors.push('FxTwitter: ' + (j && j.message || T('noData')));
    } catch (e) { errors.push('FxTwitter: ' + e.message); }
    try {
      const j = await getJson(`https://cdn.syndication.twimg.com/tweet-result?id=${n.id}&lang=zh&token=${synToken(n.id)}`);
      const t = synToTweet(j, o);
      if (t) return X.render({ type: 'tweet', url: t.url, tweets: [t], main: t }, o);
      errors.push('Syndication: ' + T('noData'));
    } catch (e) { errors.push('Syndication: ' + e.message); }
    throw new Error(T('errApi', errors.join('; ')));
  }

  X.normalizeUrl = normalizeUrl;
  X.fetchViaApi = fetchViaApi;
  X.draftToMd = draftToMd;
  X._fxToTweet = fxToTweet;
  X._synToTweet = synToTweet;
})(typeof self !== 'undefined' ? self : this);
