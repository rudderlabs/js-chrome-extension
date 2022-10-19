const port = chrome.runtime.connect();

port.onMessage.addListener((msg) => {
  if (msg.type === 'update') {
    renderEvents(msg);
  } else if (msg.type === 'search') {
    console.log('search: ', msg);
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
  const eventsContainer = document.getElementsByClassName(
    'contet__events-container'
  )[0];
  eventsContainer.innerHTML = '';
  msg.data.map(
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
  chrome.storage.local.get(['filters'], (result) => {
    if (result.filters) {
      filterEventsByStorage(result.filters);
    }
  });
};

const toggleEventCollapse = () => {
  var eventElements = Array.from(document.getElementsByClassName('event'));
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

const filterEventsByDOM = () => {
  const filterInputEls = [].slice.call(
    document.getElementsByClassName('form-check-input')
  );
  const filters = filterInputEls
    .filter((filter) => filter.checked)
    .map((filter) => filter.value);

  chrome.storage.local.set({ filters }, () => {
    if (filters) {
      filterEventsByStorage(filters);
    }
  });
};

const filterEventsByStorage = (filters) => {
  const eventElements = [].slice.call(document.getElementsByClassName('event'));
  const filterInputEls = [].slice.call(
    document.getElementsByClassName('form-check-input')
  );

  if (filters.length === 0) {
    for (const eventEl of eventElements) {
      eventEl.style.display = 'block';
    }
    filterInputEls.map((input) => (input.checked = false));
  } else {
    for (const eventEl of eventElements) {
      if (filters.indexOf(eventEl.getAttribute('data-type')) > -1) {
        eventEl.style.display = 'block';
      } else {
        eventEl.style.display = 'none';
      }
    }
    filterInputEls
      .filter((input) => filters.indexOf(input.value) > -1)
      .map((input) => (input.checked = true));
  }
};

const resetFilters = () => {
  const filters = [];
  chrome.storage.local.set({ filters }, () => {
    filterEventsByStorage(filters);
  });
};

const searchEvents = (e) => {
  var eventElements = [].slice.call(document.getElementsByClassName('event'));
  for (const eventEl of eventElements) {
    if (eventEl.innerHTML.indexOf(e.target.value) === -1) {
      eventEl.style.display = 'none';
    } else {
      eventEl.style.display = '';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const clearBtn = document.getElementById('clear');
  clearBtn.addEventListener('click', clearEvents);

  const filterInputEls = [].slice.call(
    document.getElementsByClassName('form-check-input')
  );
  filterInputEls.forEach((input) =>
    input.addEventListener('change', filterEventsByDOM)
  );

  const resetBtn = document.getElementById('reset');
  resetBtn.addEventListener('click', resetFilters);

  const searchInputEl = document.getElementById('search');
  searchInputEl.addEventListener('keyup', searchEvents);

  postMessage('update');
});
