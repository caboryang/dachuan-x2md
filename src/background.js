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
