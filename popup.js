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
    postMessage('update');
  }
});

const postMessage = (type) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    port.postMessage({
      type,
      tabId: tabs[0].id,
    });
  });
};

const renderEvents = (msg) => {
  const eventsContainer = document.getElementById('events-container');
  // let eventsString = '<pre>';
  eventsContainer.innerHTML = '';
  msg.data.map(
    (m) =>
      (eventsContainer.innerHTML +=
        '<div class="event"><pre>' +
        syntaxHighlight(JSON.stringify(m.payload, undefined, 2)) +
        '</div></pre>')
  );
  // eventsString += '</pre>';
  // eventsContainer.innerHTML = eventsString;
};

const syntaxHighlight = (payload) => {
  payload = payload
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return payload.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      var cls = 'number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'key';
        } else {
          cls = 'string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'boolean';
      } else if (/null/.test(match)) {
        cls = 'null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    }
  );
};

const clearEvents = () => {
  postMessage('clear');
};

document.addEventListener('DOMContentLoaded', () => {
  const clearBtn = document.getElementById('clear-button');
  clearBtn.addEventListener('click', clearEvents);
  postMessage('update');
});
