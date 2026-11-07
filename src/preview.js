/* 极简 Markdown → HTML 预览（只覆盖 X2MD 输出用到的语法） */
(function (root) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const safeUrl = (u) => (/^(https?:|data:image\/)/i.test(u) ? u : '#');
  function inl(s) {
    const codes = [];
    s = esc(s).replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`);
    s = s
      .replace(/\[!\[([^\]]*)\]\(([^)\s]+)\)\]\(([^)\s]*)\)/g, (_, a, src, href) => `<a href="${safeUrl(href)}" target="_blank" rel="noopener"><img alt="${a}" src="${safeUrl(src)}" loading="lazy"></a>`)
      .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, a, src) => `<img alt="${a}" src="${safeUrl(src)}" loading="lazy">`)
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, href) => `<a href="${safeUrl(href)}" target="_blank" rel="noopener">${t}</a>`)
      .replace(/(^|[\s(])(https?:\/\/[^\s<]+)/g, (_, a, u) => `${a}<a href="${u}" target="_blank" rel="noopener">${u}</a>`)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/~~([^~]+)~~/g, '<del>$1</del>');
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[i])}</code>`).replace(/\n/g, '<br>');
  }
  function render(md) {
    let src = md.replace(/\r/g, '');
    let meta = '';
    const fm = src.match(/^---\n([\s\S]*?)\n---\n/);
    if (fm) {
      meta = '<dl class="md-meta">' + fm[1].split('\n').map((l) => {
        const i = l.indexOf(':');
        let v = l.slice(i + 1).trim();
        try { v = JSON.parse(v); } catch (e) { /* keep */ }
        return `<dt>${esc(l.slice(0, i))}</dt><dd>${esc(String(v))}</dd>`;
      }).join('') + '</dl>';
      src = src.slice(fm[0].length);
    }
    const lines = src.split('\n');
    const out = [];
    let i = 0;
    while (i < lines.length) {
      const l = lines[i];
      if (!l.trim()) { i++; continue; }
      if (/^```/.test(l)) {
        const buf = []; i++;
        while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
        i++; out.push(`<pre><code>${esc(buf.join('\n'))}</code></pre>`); continue;
      }
      let m;
      if ((m = l.match(/^(#{1,6})\s+(.*)$/))) { out.push(`<h${m[1].length}>${inl(m[2])}</h${m[1].length}>`); i++; continue; }
      if (/^(---|\*\*\*)\s*$/.test(l)) { out.push('<hr>'); i++; continue; }
      if (/^>/.test(l)) {
        const buf = [];
        while (i < lines.length && /^>/.test(lines[i])) buf.push(lines[i++].replace(/^> ?/, ''));
        out.push(`<blockquote>${render(buf.join('\n'))}</blockquote>`); continue;
      }
      if (/^(\s*)([-*]|\d+\.)\s+/.test(l)) {
        const ordered = /^\s*\d+\./.test(l);
        const items = [];
        while (i < lines.length && (/^(\s*)([-*]|\d+\.)\s+/.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
          if (/^(\s*)([-*]|\d+\.)\s+/.test(lines[i]) && !/^\s{2,}/.test(lines[i])) items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ''));
          else items[items.length - 1] += '\n' + lines[i].trim();
          i++;
        }
        out.push(`<${ordered ? 'ol' : 'ul'}>${items.map((x) => `<li>${inl(x)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`); continue;
      }
      const buf = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|>|---\s*$|\s*([-*]|\d+\.)\s)/.test(lines[i])) buf.push(lines[i++]);
      if (!buf.length) buf.push(lines[i++]);
      out.push(`<p>${inl(buf.join('\n'))}</p>`);
    }
    return meta + out.join('\n');
  }
  root.X2MDPreview = { render };
})(typeof self !== 'undefined' ? self : this);
