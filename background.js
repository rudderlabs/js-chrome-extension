chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg) => {
    let tabId = msg.tabId;
    if (msg.type === 'update') {
      updateEvents(tabId, port);
    } else if (msg.type === 'clear') {
      clearEvents(tabId, port);
      updateEvents(tabId, port);
    } else if (msg.type === 'filter') {
      filterEvents(tabId, msg.filters, port);
    }
  });
});

let rudderStackEvents = [];
let currentFilters = [];
let dataPlane;
let writeKey;

const isRudderStackCall = (requestUrl) => {
  const regexUrl = /^https:\/\/(.*)dataplane.rudderstack.com(.*)$/;
  return regexUrl.test(requestUrl);
};

const isRudderStackConfig = (requestUrl) => {
  const regexUrl = /^https:\/\/(.*)api.rudderlabs.com(.*)$/;
  return regexUrl.test(requestUrl);
};

const addEvent = (event) => {
  rudderStackEvents.unshift(event);
  chrome.runtime.sendMessage({ type: 'add' });
};

const updateEvents = (tabId, port) => {
  rudderStackEvents = rudderStackEvents.filter(
    (event) => event.tabId === tabId
  );
  port.postMessage({
    type: 'update',
    data: rudderStackEvents,
  });
};

const clearEvents = (tabId, port) => {
  rudderStackEvents = rudderStackEvents.filter(
    (event) => event.tabId !== tabId
  );
  port.postMessage({
    type: 'update',
    data: rudderStackEvents,
  });
};

const filterEvents = (tabId, filters, port) => {
  let filteredEvents = [];
  for (const filter of filters) {
    rudderStackEvents.forEach((event) => {
      if (event.payload.type === filter) {
        filteredEvents.push(event);
      }
    });
  }
  port.postMessage({
    type: 'filter',
    data: filters.length === 0 ? rudderStackEvents : filteredEvents,
    filters,
  });
};

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (isRudderStackCall(details.url)) {
      dataPlane = details.url.replace(/page|track|identify/gi, '');
      console.log('dataPlane: ', dataPlane);
      const requestBody = String.fromCharCode.apply(
        null,
        new Uint8Array(details.requestBody.raw[0].bytes)
      );
      const event = {
        tabId: details.tabId,
        payload: JSON.parse(requestBody),
      };
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          if (tabs[0].id === details.tabId) {
            addEvent(event);
          }
        }
      });
    }
  },
  {
    urls: ['<all_urls>'],
  },
  ['requestBody']
);
