const browserScript = document.createElement('script');
browserScript.src = chrome.runtime.getURL('browser.js');
browserScript.onload = function () {
  this.remove();
};
(document.head || document.documentElement).appendChild(browserScript);

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'getUserInfo') {
    window.postMessage(msg, '*');
  }
});

window.addEventListener(
  'message',
  (event) => {
    if (event.source != window) {
      return;
    }

    if (event.data.type === 'userInfo') {
      chrome.runtime.sendMessage(event.data);
    }
  },
  false
);
