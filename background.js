// Commented out code below originally used for custom domain toggle feature

let tabData = {};
let dataPlane;
// let isCurrentTabCustomDomain;
let writeKey;

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    // if (isCurrentTabCustomDomain) {
    // if (isCustomDomainCall(details.url)) {
    if (isRudderStackCall(details.url)) {
      dataPlane = details.url.replace(/page|track|identify/gi, '');
      try {
        const requestBody = String.fromCharCode.apply(
          null,
          new Uint8Array(details.requestBody.raw[0].bytes)
        );
        if (
          JSON.parse(requestBody).context.library.name ===
          'RudderLabs JavaScript SDK'
        ) {
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
        }
      } catch (e) {
        console.log('error: ', e);
      }
    }
    // }
    // else {
    //   if (isRudderStackCall(details.url)) {
    //     dataPlane = details.url.replace(/page|track|identify/gi, '');
    //     try {
    //       const requestBody = String.fromCharCode.apply(
    //         null,
    //         new Uint8Array(details.requestBody.raw[0].bytes)
    //       );
    //       const event = {
    //         tabId: details.tabId,
    //         payload: JSON.parse(requestBody),
    //       };
    //       chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    //         if (tabs[0]) {
    //           if (tabs[0].id === details.tabId) {
    //             addEvent(event, tabs[0].id);
    //           }
    //         }
    //       });
    //     } catch (e) {
    //       console.log('error: ', e);
    //     }
    //   }
    // }
  },
  {
    urls: ['<all_urls>'],
  },
  ['requestBody']
);

// const isRudderStackCall = (requestUrl) => {
//   const regexUrl = /^https:\/\/(.*)dataplane.rudderstack.com(.*)$/;
//   return regexUrl.test(requestUrl);
// };

// const isCustomDomainCall = (requestUrl) => {
//   const regexUrl = /^https:\/\/(.*)\/v1\/(?:page|track|identify)$/;
//   return regexUrl.test(requestUrl);
// };

const isRudderStackCall = (requestUrl) => {
  const regexUrl = /^https:\/\/(.*)\/v1\/(?:page|track|identify)$/;
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

chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg) => {
    let tabId = msg.tabId;
    let searchValue = msg.searchValue;
    let filters = msg.filters;

    switch (msg.type) {
      case 'update':
        updateEventsForTab(tabId, port);
        break;
      case 'filter':
        filterEventsForTab(tabId, searchValue, filters, port);
        break;
      case 'reset':
        resetEventsForTab(tabId, port);
        break;
      case 'clear':
        clearEventsForTab(tabId, port);
        break;
      // case 'custom-domain':
      //   // isCurrentTabCustomDomain = true;
      //   tabData[tabId].isCustomDomain = true;
      //   break;
      // case 'rudderstack-domain':
      //   // isCurrentTabCustomDomain = false;
      //   tabData[tabId].isCustomDomain = false;
      //   break;
      default:
        console.log('msg.type does not match any action: ', msg.type);
    }
  });
});

const updateEventsForTab = (tabId, port) => {
  if (
    tabData[tabId] &&
    tabData[tabId].filters &&
    (tabData[tabId].filters.length > 0 || tabData[tabId].searchValue !== '')
  ) {
    filterEventsForTab(
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
    tabData[tabId].isCustomDomain = tabData[tabId].isCustomDomain || false;
    // isCurrentTabCustomDomain = tabData[tabId].isCustomDomain || false;
    port.postMessage({
      type: 'update',
      events: tabData[tabId].events,
      searchValue: tabData[tabId].searchValue,
      filters: tabData[tabId].filters,
      isCustomDomain: tabData[tabId].isCustomDomain,
    });
  }
};

const filterEventsForTab = (tabId, searchValue, filters, port) => {
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
    isCustomDomain: tabData[tabId].isCustomDomain,
  });
};

const resetEventsForTab = (tabId, port) => {
  tabData[tabId].searchValue = '';
  tabData[tabId].filters = [];
  port.postMessage({
    type: 'update',
    events: tabData[tabId].events,
    searchValue: tabData[tabId].searchValue,
    filters: tabData[tabId].filters,
    isCustomDomain: tabData[tabId].isCustomDomain,
  });
};

const clearEventsForTab = (tabId, port) => {
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
