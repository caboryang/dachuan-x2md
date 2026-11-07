/* Dachuan X2MD — i18n (English / 简体中文). Language follows the browser UI language. */
(function (root) {
  const D = {
    en: {
      // markdown output
      image: 'Image', video: 'Video', videoCover: 'Video cover', cover: 'Cover', quote: 'Quoting', original: 'Original post',
      untitledArticle: 'Untitled article', timeline: 'X timeline', threadBy: 'Thread by {0}', postsCount: '{0} posts',
      truncated: '*(Truncated preview — open the original post for the full text)*',
      mediaCount: '*(Contains {0})*', nImages: '{0} image(s)', nVideos: '{0} video(s)', and: ', ',
      linkCard: 'Link card', embeddedPost: 'Embedded post', colon: ': ',
      m_replies: 'replies', m_retweets: 'reposts', m_likes: 'likes', m_bookmarks: 'bookmarks', m_views: 'views',
      // errors
      errNoArticle: 'Article body not found', errNoPostsLogin: 'No posts found on this page (you may need to log in to X)',
      errNoPosts: 'No posts found on this page', errEmptyUrl: 'Please enter an X (Twitter) link', errBadUrl: 'Invalid link',
      errNotX: 'Not an X / Twitter link', errApiOnlyStatus: 'Public API mode only supports single post / article links. For profiles, search etc., open the page in your logged-in browser and use the extension.',
      noData: 'no data', errApi: 'Public API failed ({0})', errNoResponse: 'The page did not respond',
      errTabFailed: 'The page could not be opened (not logged in to X, or blocked by the login wall)', viaLogin: 'Logged-in browser: ',
      unknownError: 'unknown error',
      // content script
      btnTitle: 'Copy as Markdown (Shift+click: whole thread / page)', copiedPage: 'Copied page as Markdown ({0} posts)',
      copiedPost: 'Copied this post as Markdown', convertFailed: 'Conversion failed: {0}', converting: 'Converting…',
      // kinds
      k_thread: 'Thread', k_tweet: 'Post', k_article: 'Article', k_timeline: 'Timeline', k_page: 'Page',
      // options
      o_frontmatter: 'YAML front matter', o_images: 'Images / video covers', o_linkify: 'Link @mentions / #hashtags',
      o_metrics: 'Engagement stats', o_replies: 'Include replies', o_autoScroll: 'Auto-scroll long threads',
      // popup
      subtitle: 'X (Twitter) to Markdown', converter: 'Converter', converterTitle: 'Paste links to convert',
      copyPage: 'Copy page as Markdown', copied: 'Copied ✓', reading: 'Reading page', readingScroll: ' (auto-scrolling long threads)',
      source: 'Source', preview: 'Preview', mdPlaceholder: 'Markdown appears here', download: 'Download .md', reload: 'Re-read',
      sendTo: 'Send to {0}', sendClaude: 'Send to Claude', sendTitle: 'Copy Markdown and open the AI', options: 'Options', showButtons: 'Show “MD” button on every post',
      notX: 'This is not an X / Twitter page.<br>Open any post, thread or article and click the icon again,<br>or paste a link into the converter.',
      openConverter: 'Open converter', shortcutHint: 'Alt+Shift+M · Shift+click MD = whole page',
      scriptNotReady: 'Page script not ready — refresh the X tab and try again', statsLine: '✓ {0} · {1} posts · {2} chars',
      pasteManually: 'Copied — paste it into the page that just opened (Ctrl/⌘+V)',
      // converter page
      convTitle: 'Dachuan X2MD Converter', navHow: 'How to use', navTips: 'Tips', navFaq: 'FAQ', navHistory: 'History',
      badge: 'Unlimited · Runs locally · Nothing uploaded', heroTitle: 'X (Twitter) to Markdown',
      heroSub: 'Turn threads, single posts and X Articles into clean, ordered Markdown — links, @mentions, #hashtags and images included. Ready for Claude, ChatGPT and Gemini.',
      urlPlaceholder: 'Paste an X (Twitter) link, e.g. https://x.com/user/status/123… (multiple links OK)', convert: 'Convert',
      method: 'Fetch via', m_auto: 'Auto (logged-in browser, then public API)', m_tab: 'Logged-in browser (threads / articles)', m_api: 'Public API (no login, single posts only)',
      copy: 'Copy', promptLabel: 'Instruction to prepend when sending to AI (optional, saved automatically)',
      promptPlaceholder: 'e.g. Summarize the key points of this thread and list the main arguments',
      howTitle: 'How to use',
      s1t: 'Open an X page', s1d: 'In a browser where you’re logged in, open any post, thread, X Article, profile or search result.',
      s2t: 'Click the Dachuan X2MD icon', s2d: 'The toolbar icon reads the current page; long threads are auto-scrolled so the whole thread loads.',
      s3t: 'Copy page as Markdown', s3d: 'Copy in one click, download a .md file, or “Send to AI” directly.',
      s4t: 'Or use this converter', s4d: 'Just paste a link. The extension opens it in a background tab with your login, extracts it and closes the tab.',
      howHint: 'Faster: every post gets an <kbd>MD</kbd> button in its action bar — click to copy that post, <kbd>Shift</kbd>+click to copy the whole page. Or press <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>M</kbd>, or right-click a page / link.',
      tipsTitle: 'Tips',
      t1t: 'Whole thread, one document', t1d: 'Convert from any post in a thread and all consecutive posts by the author are merged in order, labeled 1/N, 2/N…',
      t2t: 'X Articles', t2d: 'Titles, headings, lists, quotes, code blocks and images are converted to proper Markdown structure.',
      t3t: 'Links preserved', t3d: 't.co short links are expanded to real URLs; @mentions and #hashtags stay clickable; quoted posts become blockquotes.',
      t4t: 'Need the discussion?', t4d: 'Enable “Include replies” to export loaded replies too — handy for analyzing the comment section.',
      faqTitle: 'FAQ',
      q1: 'Why can’t Claude / ChatGPT read X links?', a1: 'X heavily restricts logged-out access, so AI servers usually get a login wall or an empty page. Dachuan X2MD reads the page inside your own logged-in browser, so it gets the full thread.',
      q2: 'Logged-in browser vs. public API?', a2: 'Logged-in mode opens the link in a background tab and reads the page — threads, articles and replies work, but you need to be logged in to X in this browser. Public API mode uses FxTwitter / X embed endpoints: no login needed, but single posts only (some articles too). “Auto” tries the first, then falls back to the second.',
      q3: 'Thread incomplete when converting in the background?', a3: 'Browsers throttle background tabs, so very long threads may be cut short. Just open the thread on X and click the toolbar icon — the foreground page auto-scrolls and loads everything.',
      q4: 'Why does copy-paste lose structure?', a4: 'Copy-paste grabs rendered UI text mixed with reply counts, button labels and timestamps, often out of order. Dachuan X2MD parses the page structure and outputs only text, author, time, images and links.',
      q5: 'Is any data uploaded?', a5: 'No. Everything is converted locally in your browser. Only in “Public API” mode is the post’s public data requested from FxTwitter / the X embed endpoint.',
      historyTitle: 'Recent conversions', clear: 'Clear', noHistory: 'No history yet', fromHistory: 'From history',
      footer: 'Dachuan X2MD · A Dachuan Creation',
      enterLink: 'Paste an X link first', convertingN: 'Converting{0}… a background X tab will open briefly',
      failed: 'Conversion failed — {0}', collection: 'X collection ({0} items)', chars: '{0} chars',
      doneWithFails: 'Done, but {0} failed:<br>{1}', done: '✓ Done', openedAndCopied: 'Opening the AI and filling in the text (also copied to clipboard)',
      pastedManuallyAI: 'Copied to clipboard — paste it into the AI page that just opened (Ctrl/⌘+V)',
      welcome: 'Installed! Open any X post and click the toolbar icon, or paste a link here to try it.',
    },
    zh: {
      image: '图片', video: '视频', videoCover: '视频封面', cover: '封面', quote: '引用', original: '原帖',
      untitledArticle: '无标题文章', timeline: 'X 时间线', threadBy: '{0} 的串推', postsCount: '共 {0} 条',
      truncated: '*（此处显示的是截断内容，打开原帖可查看全文）*',
      mediaCount: '*（含 {0}）*', nImages: '{0} 张图片', nVideos: '{0} 个视频', and: '、',
      linkCard: '链接卡片', embeddedPost: '嵌入帖子', colon: '：',
      m_replies: '回复', m_retweets: '转帖', m_likes: '喜欢', m_bookmarks: '书签', m_views: '浏览',
      errNoArticle: '未找到文章正文', errNoPostsLogin: '页面上没有找到帖子（可能需要登录 X）',
      errNoPosts: '页面上没有找到帖子', errEmptyUrl: '请输入 X（Twitter）链接', errBadUrl: '链接格式不正确',
      errNotX: '不是 X / Twitter 链接', errApiOnlyStatus: 'API 模式只支持单条帖子 / 文章链接；主页、搜索等页面请在已登录的浏览器中打开后用插件转换',
      noData: '无数据', errApi: '公共接口获取失败（{0}）', errNoResponse: '页面没有响应',
      errTabFailed: '页面没能正常打开（可能未登录 X，或被登录墙拦截）', viaLogin: '登录态：', unknownError: '未知错误',
      btnTitle: '复制为 Markdown（Shift+点击：复制整个串推 / 页面）', copiedPage: '已复制整页 Markdown（{0} 条）',
      copiedPost: '已复制这条帖子的 Markdown', convertFailed: '转换失败：{0}', converting: '正在转换…',
      k_thread: '串推', k_tweet: '帖子', k_article: '文章', k_timeline: '时间线', k_page: '页面',
      o_frontmatter: 'YAML 元信息', o_images: '图片 / 视频封面', o_linkify: '@提及 / #话题 链接',
      o_metrics: '互动数据', o_replies: '包含他人回复', o_autoScroll: '自动滚动加载长串推',
      subtitle: 'X（Twitter）转 Markdown', converter: '转换器', converterTitle: '粘贴链接转换',
      copyPage: '复制页面为 Markdown', copied: '已复制 ✓', reading: '正在读取页面', readingScroll: '（长串推会自动滚动加载）',
      source: '源码', preview: '预览', mdPlaceholder: 'Markdown 会显示在这里', download: '下载 .md', reload: '重新读取',
      sendTo: '发送至 {0}', sendClaude: '发送至 Claude', sendTitle: '复制 Markdown 并打开对应 AI', options: '转换选项', showButtons: '在每条帖子上显示「MD」按钮',
      notX: '当前页面不是 X / Twitter。<br>打开任意帖子、串推或文章后再点击图标，<br>或者直接粘贴链接转换。',
      openConverter: '打开转换器', shortcutHint: '快捷键 Alt+Shift+M · Shift+点 MD = 整页',
      scriptNotReady: '页面脚本未就绪，请刷新 X 页面后重试', statsLine: '✓ {0} · {1} 条 · {2} 字符',
      pasteManually: '已复制，请在新打开的页面里粘贴（Ctrl/⌘+V）',
      convTitle: 'Dachuan X2MD 转换器', navHow: '使用方法', navTips: '转换技巧', navFaq: '常见问题', navHistory: '历史',
      badge: '无次数限制 · 本地运行 · 不上传任何内容', heroTitle: 'X（Twitter）转 Markdown',
      heroSub: '把串推、单条帖子和 X Articles 转成干净、按顺序排列的 Markdown——链接、@提及、#话题和图片都保留，直接喂给 Claude、ChatGPT、Gemini。',
      urlPlaceholder: '粘贴 X（Twitter）链接，例如 https://x.com/user/status/123…（可一次粘贴多条）', convert: '转换',
      method: '获取方式', m_auto: '自动（先用登录态，失败再用公共接口）', m_tab: '浏览器登录态（支持串推 / 文章）', m_api: '公共接口（无需登录，仅单条帖子）',
      copy: '复制', promptLabel: '发送给 AI 时附加的指令（可选，会自动保存）',
      promptPlaceholder: '例如：请用中文总结这个串推的要点，并列出关键论据',
      howTitle: '怎么用',
      s1t: '打开 X 页面', s1d: '在已登录的浏览器里打开任意帖子、串推、X Article、主页或搜索结果。',
      s2t: '点击 Dachuan X2MD 图标', s2d: '工具栏图标会读取当前页面；长串推会自动向下滚动，把整串都加载出来。',
      s3t: '复制页面为 Markdown', s3d: '一键复制、下载 .md，或直接「发送至 AI」。',
      s4t: '或者用这里的转换器', s4d: '粘贴链接即可。插件会在后台用你的登录状态打开页面并提取，结束后自动关闭。',
      howHint: '更快的方式：每条帖子操作栏右侧都有一个 <kbd>MD</kbd> 按钮——点击复制这一条，<kbd>Shift</kbd>+点击复制整个页面；也可以按 <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>M</kbd>，或在页面 / 链接上右键。',
      tipsTitle: '转换技巧',
      t1t: '整串合成一篇', t1d: '在串推的任意一条上转换，都会把作者连续发布的所有帖子按顺序合并成一个文档，并标注 1/N、2/N。',
      t2t: 'X Articles 长文', t2d: '文章的标题、小标题、列表、引用、代码块和配图都会转换成对应的 Markdown 结构。',
      t3t: '链接不丢失', t3d: 't.co 短链会还原为真实网址；@提及和 #话题 可保留为可点击链接；引用帖以引用块嵌入。',
      t4t: '需要讨论上下文？', t4d: '勾选「包含他人回复」，会把页面上加载出的回复一起导出，适合分析评论区观点。',
      faqTitle: '常见问题',
      q1: '为什么 Claude / ChatGPT 读不了 X 的链接？', a1: 'X 对未登录访问做了大量限制，AI 的服务器去抓取时通常只能拿到登录墙或空白页。Dachuan X2MD 在你自己已登录的浏览器里读取页面内容，所以能拿到完整的串推。',
      q2: '「浏览器登录态」和「公共接口」有什么区别？', a2: '登录态模式会在后台标签页打开链接并读取页面，能拿到串推、文章和回复，但需要你在这个浏览器里登录了 X。公共接口模式调用 FxTwitter / X 嵌入接口，不需要登录，但只能拿到单条帖子（部分文章也可以）。「自动」会先试前者，失败再用后者。',
      q3: '后台转换时串推不完整？', a3: '后台标签页里浏览器会限制页面加载，超长串推可能只拿到前面一部分。遇到这种情况，直接在 X 上打开那个串推，点工具栏的图标即可——前台页面会自动滚动加载全部内容。',
      q4: '为什么直接复制粘贴会丢结构？', a4: '复制粘贴拿到的是渲染后的界面文字，混着回复数、按钮文字、时间等噪音，顺序也容易乱。Dachuan X2MD 直接解析页面结构，只输出正文、作者、时间、图片和链接。',
      q5: '数据会被上传吗？', a5: '不会。所有转换都在你的浏览器本地完成；只有选择「公共接口」时会向 FxTwitter / X 嵌入接口请求该条帖子的公开数据。',
      historyTitle: '最近转换', clear: '清空', noHistory: '还没有记录', fromHistory: '来自历史记录',
      footer: 'Dachuan X2MD · A Dachuan Creation',
      enterLink: '请先粘贴一个 X 链接', convertingN: '正在转换{0}… 后台会短暂打开一个 X 标签页',
      failed: '转换失败 — {0}', collection: 'X 合集（{0} 篇）', chars: '{0} 字符',
      doneWithFails: '完成，但有 {0} 条失败：<br>{1}', done: '✓ 转换完成', openedAndCopied: '正在打开 AI 并自动填入内容（同时已复制到剪贴板）',
      pastedManuallyAI: '已复制到剪贴板，请在新打开的 AI 页面粘贴（Ctrl/⌘+V）',
      welcome: '安装成功！打开任意 X 帖子点击工具栏图标，或在这里粘贴链接试试。',
    },
  };
  let ui = '';
  try { ui = (root.chrome && chrome.i18n && chrome.i18n.getUILanguage()) || ''; } catch (e) { /* ignore */ }
  ui = ui || (root.navigator && navigator.language) || 'en';
  const lang = /^zh/i.test(ui) ? 'zh' : 'en';
  function t(key, ...args) {
    const s = (D[lang][key] != null ? D[lang][key] : D.en[key] != null ? D.en[key] : key);
    return s.replace(/\{(\d)\}/g, (_, i) => (args[i] != null ? args[i] : ''));
  }
  function apply(doc) {
    doc = doc || document;
    doc.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    doc.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    doc.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    doc.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
    doc.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
  }
  root.X2MDI18N = { lang, t, apply };
})(typeof self !== 'undefined' ? self : this);
