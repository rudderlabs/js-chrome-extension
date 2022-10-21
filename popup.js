const port = chrome.runtime.connect();

port.onMessage.addListener((msg) => {
  if (msg.type === 'update') {
    renderEvents(msg);
    renderSeachAndFilters(msg);
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'clear') {
    clearEvents();
  } else if (msg.type === 'add') {
    postMessage('update');
  }
});

const postMessage = (type, searchValue = '', filters = []) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    port.postMessage({
      type,
      searchValue,
      filters,
      tabId: tabs[0].id,
    });
  });
};

const renderEvents = (msg) => {
  const eventsContainer = document.getElementsByClassName(
    'contet__events-container'
  )[0];
  eventsContainer.innerHTML = '';
  msg.events.map(
    (m) =>
      (eventsContainer.innerHTML +=
        `<div class="event ${m.payload.type} collapsed" data-type="${m.payload.type}">` +
        `<div class="event-details__short">` +
        `<div class="event-details__short top">` +
        `<span class="event-details__short type">${m.payload.type}</span>` +
        `<span class="event-details__short name">${
          m.payload.event ? `&nbsp;|&nbsp;${m.payload.event}` : ''
        }</span>` +
        `</div>` +
        `<div class="event-details__short bottom">` +
        `<span class="event-details__short userId">${
          m.payload.userId
            ? `User ID: ${m.payload.userId}`
            : 'Unidentified User'
        }</span>` +
        `<span class="event-details__short anonymousId">Anonymous ID: ${m.payload.anonymousId}</span>` +
        `<span class="event-details__short sentAt">Sent At: ${m.payload.sentAt}</span>` +
        `</div>` +
        `</div>` +
        `<div class="event-details__full">` +
        `<pre>` +
        syntaxHighlight(JSON.stringify(m.payload, undefined, 2)) +
        `</pre>` +
        `</div>` +
        `<div>`)
  );
  toggleEventCollapse();
};

const renderSeachAndFilters = (msg) => {
  const searchInputEl = document.getElementById('search');
  searchInputEl.value = msg.searchValue;

  const filterInputEls = [].slice.call(
    document.getElementsByClassName('form-check-input')
  );
  if (msg.filters.length > 0) {
    filterInputEls
      .filter((input) => msg.filters.indexOf(input.value) > -1)
      .map((input) => (input.checked = true));
  } else {
    filterInputEls.map((input) => (input.checked = false));
  }
};

const toggleEventCollapse = () => {
  var eventElements = [].slice.call(document.getElementsByClassName('event'));
  for (const eventEl of eventElements) {
    eventEl.addEventListener('click', () => {
      if ([].slice.call(eventEl.classList).indexOf('collapsed') != -1) {
        eventEl.classList.remove('collapsed');
        eventEl.classList.add('expanded');
      } else {
        eventEl.classList.add('collapsed');
        eventEl.classList.remove('expanded');
      }
    });
  }
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
      return `<span class=${cls}>${match}</span>`;
    }
  );
};

const clearEvents = () => {
  postMessage('clear');
};

document.addEventListener('DOMContentLoaded', () => {
  const clearBtn = document.getElementById('clear');
  clearBtn.addEventListener('click', clearEvents);

  const filterInputEls = [].slice.call(
    document.getElementsByClassName('form-check-input')
  );
  filterInputEls.forEach((input) =>
    input.addEventListener('change', filterEvents)
  );

  const searchInputEl = document.getElementById('search');
  searchInputEl.addEventListener('keyup', filterEvents);

  const resetBtn = document.getElementById('reset');
  resetBtn.addEventListener('click', resetFilters);

  postMessage('update');
});

const resetFilters = () => {
  postMessage('reset', '', []);
};

const filterEvents = () => {
  const searchValue = document.getElementById('search').value;
  const filterInputEls = [].slice.call(
    document.getElementsByClassName('form-check-input')
  );
  const filters = filterInputEls
    .filter((filter) => filter.checked)
    .map((filter) => filter.value);

  postMessage('filter', searchValue, filters);
};
