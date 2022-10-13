const port = chrome.runtime.connect();

port.onMessage.addListener((msg) => {
  if (msg.type == 'update') {
    renderEvents(msg);
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'clear') {
    clearEvents();
  } else if (msg.type === 'add') {
    renderEvents(msg);
  }
});

const renderEvents = (msg) => {
  if (msg.type === 'add') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      port.postMessage({
        type: 'update',
        tabId: tabs[0].id,
      });
    });
  } else {
    const eventsContainer = document.getElementById('events-container');
    const eventsString = msg.data.map((m) => m.payload.type + ', ');
    eventsContainer.textContent = eventsString;
  }
};

const clearEvents = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    port.postMessage({
      type: 'clear',
      tabId: tabs[0].id,
    });
  });
};

document.addEventListener('DOMContentLoaded', () => {
  const clearBtn = document.getElementById('clear-button');
  clearBtn.addEventListener('click', clearEvents);
  renderEvents({ type: 'add' });
});
