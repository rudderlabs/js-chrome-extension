let tabData = {};
let dataPlane;
let writeKey;

chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg) => {
    let tabId = msg.tabId;
    let searchValue = msg.searchValue;
    let filters = msg.filters;
    if (msg.type === 'update') {
      updateEvents(tabId, port);
    } else if (msg.type === 'clear') {
      clearEvents(tabId, port);
    } else if (msg.type === 'filter') {
      filterEvents(tabId, searchValue, filters, port);
    } else if (msg.type === 'reset') {
      resetEvents(tabId, port);
    }
  });
});

const isRudderStackCall = (requestUrl) => {
  const regexUrl = /^https:\/\/(.*)dataplane.rudderstack.com(.*)$/;
  return regexUrl.test(requestUrl);
};

const isRudderStackConfig = (requestUrl) => {
  const regexUrl = /^https:\/\/(.*)api.rudderlabs.com(.*)$/;
  return regexUrl.test(requestUrl);
};

const addEvent = (event, tabId) => {
  tabData[tabId] = tabData[tabId] || {};
  tabData[tabId].events = tabData[tabId].events || [];
  tabData[tabId].events.unshift(event);
  chrome.runtime.sendMessage({ type: 'add' });
};

const updateEvents = (tabId, port) => {
  if (
    tabData[tabId] &&
    tabData[tabId].filters &&
    tabData[tabId].filters.length > 0
  ) {
    filterEvents(
      tabId,
      tabData[tabId].searchValue,
      tabData[tabId].filters,
      port
    );
  } else {
    tabData[tabId] = tabData[tabId] || {};
    tabData[tabId].events = tabData[tabId].events || [];
    tabData[tabId].filters = tabData[tabId].filters || [];
    tabData[tabId].searchValue = tabData[tabId].searchValue || '';
    if (tabData[tabId]) {
      port.postMessage({
        type: 'update',
        events: tabData[tabId].events,
        searchValue: tabData[tabId].searchValue,
        filters: tabData[tabId].filters,
      });
    }
  }
};

const resetEvents = (tabId, port) => {
  tabData[tabId].searchValue = '';
  tabData[tabId].filters = [];
  port.postMessage({
    type: 'update',
    events: tabData[tabId].events,
    searchValue: tabData[tabId].searchValue,
    filters: tabData[tabId].filters,
  });
};

const clearEvents = (tabId, port) => {
  tabData[tabId].events = [];
  tabData[tabId].searchValue = '';
  tabData[tabId].filters = [];
  port.postMessage({
    type: 'update',
    events: tabData[tabId].events,
    searchValue: tabData[tabId].searchValue,
    filters: tabData[tabId].filters,
  });
};

const filterEvents = (tabId, searchValue, filters, port) => {
  tabData[tabId].filters = filters;
  tabData[tabId].searchValue = searchValue;
  let filteredEvents;
  if (filters.length > 0 && searchValue !== '') {
    filteredEvents = tabData[tabId].events.filter(
      (event) =>
        event.tabId === tabId &&
        filters.join('').indexOf(event.payload.type) > -1 &&
        JSON.stringify(event.payload).indexOf(searchValue) > -1
    );
  } else if (filters.length > 0 && searchValue === '') {
    filteredEvents = tabData[tabId].events.filter(
      (event) =>
        event.tabId === tabId &&
        filters.join('').indexOf(event.payload.type) > -1
    );
  } else if (filters.length === 0 && searchValue !== '') {
    filteredEvents = tabData[tabId].events.filter(
      (event) =>
        event.tabId === tabId &&
        JSON.stringify(event.payload).indexOf(searchValue) > -1
    );
  } else if (filters.length === 0 && searchValue === '') {
    filteredEvents = tabData[tabId].events.filter(
      (event) => event.tabId === tabId
    );
  }
  port.postMessage({
    type: 'update',
    events: filteredEvents,
    searchValue: tabData[tabId].searchValue,
    filters: tabData[tabId].filters,
  });
};

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (isRudderStackCall(details.url)) {
      dataPlane = details.url.replace(/page|track|identify/gi, '');
      // console.log('dataPlane: ', dataPlane);
      console.log(details);
      console.log(details.requestBody);
      try {
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
              addEvent(event, tabs[0].id);
            }
          }
        });
      } catch (e) {
        console.log('error: ', e);
      }
    }
  },
  {
    urls: ['<all_urls>'],
  },
  ['requestBody']
);
