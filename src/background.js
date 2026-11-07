/* Dachuan X2MD service worker — 右键菜单 + 快捷键 */
const X_PATTERNS = ['https://x.com/*', 'https://twitter.com/*', 'https://mobile.twitter.com/*', 'https://mobile.x.com/*'];

chrome.runtime.onInstalled.addListener((d) => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'x2md-page', title: chrome.i18n.getMessage('menuPage'), contexts: ['page', 'selection'], documentUrlPatterns: X_PATTERNS });
    chrome.contextMenus.create({ id: 'x2md-link', title: chrome.i18n.getMessage('menuLink'), contexts: ['link'], targetUrlPatterns: ['https://x.com/*/status/*', 'https://twitter.com/*/status/*', 'https://x.com/*/article/*', 'https://x.com/i/article/*'] });
    chrome.contextMenus.create({ id: 'x2md-open', title: chrome.i18n.getMessage('menuOpen'), contexts: ['action'] });
  });
  if (d.reason === 'install') chrome.tabs.create({ url: chrome.runtime.getURL('converter.html?welcome=1') });
});

function openConverter(url) {
  chrome.tabs.create({ url: chrome.runtime.getURL('converter.html' + (url ? '?url=' + encodeURIComponent(url) : '')) });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'x2md-page' && tab) chrome.tabs.sendMessage(tab.id, { type: 'x2md:copyPage' });
  if (info.menuItemId === 'x2md-link') openConverter(info.linkUrl);
  if (info.menuItemId === 'x2md-open') openConverter();
});

chrome.commands.onCommand.addListener(async (cmd) => {
  if (cmd !== 'copy-page') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && /^https:\/\/(mobile\.)?(x|twitter)\.com\//.test(tab.url || '')) chrome.tabs.sendMessage(tab.id, { type: 'x2md:copyPage' });
  else openConverter();
});

/* ---------- Send to AI: open the site and fill its composer ---------- */
const AI_SITES = {
  claude: 'https://claude.ai/new',
  chatgpt: 'https://chatgpt.com/',
  gemini: 'https://gemini.google.com/app',
};

// Runs inside the AI page. Waits for the composer, then inserts the text.
async function fillComposer(text, key) {
  const SELECTORS = {
    claude: ['div.ProseMirror[contenteditable="true"]', '[contenteditable="true"]'],
    chatgpt: ['#prompt-textarea', 'div.ProseMirror[contenteditable="true"]', 'textarea'],
    gemini: ['rich-textarea .ql-editor', '.ql-editor[contenteditable="true"]', '[contenteditable="true"]'],
  }[key] || ['[contenteditable="true"]', 'textarea'];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let el = null;
  for (let i = 0; i < 60 && !el; i++) {
    for (const s of SELECTORS) { el = document.querySelector(s); if (el) break; }
    if (!el) await wait(400);
  }
  if (!el) return false;
  await wait(300);
  el.focus();
  if (el.tagName === 'TEXTAREA') {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(el, text);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }
  const before = (el.innerText || '').length;
  document.execCommand('insertText', false, text);
  await wait(300);
  if ((el.innerText || '').length > before) return true;
  // Fallback: synthetic paste (some editors turn long pastes into an attachment)
  const dt = new DataTransfer();
  dt.setData('text/plain', text);
  el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  return true;
}

function waitTabComplete(tabId, ms) {
  return new Promise((resolve) => {
    const done = () => { chrome.tabs.onUpdated.removeListener(listener); clearTimeout(timer); resolve(); };
    const listener = (id, info) => { if (id === tabId && info.status === 'complete') done(); };
    const timer = setTimeout(done, ms);
    chrome.tabs.onUpdated.addListener(listener);
    chrome.tabs.get(tabId, (t) => { if (t && t.status === 'complete') done(); });
  });
}

chrome.runtime.onMessage.addListener((msg) => {
  if (!msg || msg.type !== 'x2md:sendAI' || !AI_SITES[msg.key]) return;
  (async () => {
    const tab = await chrome.tabs.create({ url: AI_SITES[msg.key] });
    await waitTabComplete(tab.id, 20000);
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: fillComposer, args: [msg.text, msg.key] });
    } catch (e) { /* text is still on the clipboard */ }
  })();
});
