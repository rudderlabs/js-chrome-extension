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
  } else if (msg.type === 'userInfo') {
    console.log('user data: ', msg);
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
  if (msg.events.length > 0) {
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
              ? `User ID:<br> ${m.payload.userId}`
              : 'Unidentified<br>User'
          }</span>` +
          `<span class="event-details__short anonymousId">Anonymous ID:<br> ${m.payload.anonymousId}</span>` +
          `<span class="event-details__short sentAt">Sent At:<br> ${m.payload.sentAt}</span>` +
          `</div>` +
          `</div>` +
          `<div class="event-details__full">` +
          `<pre>` +
          `<button id="copyToClipboard" class="copy-to-clipboard btn btn-outline-dark" title="Copy To Clipboard">` +
          `<img class="copy-to-clipboard" src="c2c-black.png" title="Copy To Clipboard"/>` +
          `</button>` +
          `<code>${syntaxHighlight(
            JSON.stringify(m.payload, undefined, 2)
          )}</code>` +
          `</pre>` +
          `</div>` +
          `<div>`)
    );
  } else {
    eventsContainer.innerHTML = `<div class="contet__events-container-no-events">RudderStack Events Will Show Up Here</div>`;
  }
  addEventCollapseExpandListeners();
  setClearBtnDisableAttribute(msg.events);
  setResetBtnDisableAttribute(msg.filters, msg.searchValue);
  addCopyToClipboardListeners();
};

const addEventCollapseExpandListeners = () => {
  var eventElements = [].slice.call(
    document.getElementsByClassName('event-details__short')
  );
  for (const eventEl of eventElements) {
    eventEl.addEventListener('click', () => {
      if (
        [].slice.call(eventEl.parentElement.classList).indexOf('collapsed') !=
        -1
      ) {
        eventEl.parentElement.classList.remove('collapsed');
        eventEl.parentElement.classList.add('expanded');
      } else {
        eventEl.parentElement.classList.add('collapsed');
        eventEl.parentElement.classList.remove('expanded');
      }
    });
  }
};

const setClearBtnDisableAttribute = (events) => {
  const clearBtn = document.getElementById('clear');
  clearBtn.disabled = events.length === 0 ? true : false;
};

const setResetBtnDisableAttribute = (filters, searchValue) => {
  const resetBtn = document.getElementById('reset');
  resetBtn.disabled = filters.length === 0 && searchValue === '' ? true : false;
};

const addCopyToClipboardListeners = () => {
  const icons = [].slice.call(
    document.getElementsByClassName('copy-to-clipboard')
  );
  for (const icon of icons) {
    icon.addEventListener('click', () => {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText)
        return navigator.clipboard.writeText(
          icon.parentElement.parentElement.getElementsByTagName('code')[0]
            .textContent
        );
      return Promise.reject('The Clipboard API is not available.');
    });
    icon.addEventListener('mouseover', () => {
      if (icon.src) {
        icon.src = 'c2c-white.png';
      } else {
        icon.getElementsByTagName('img')[0].src = 'c2c-white.png';
      }
    });
    icon.addEventListener('mouseleave', () => {
      if (icon.src) {
        icon.src = 'c2c-black.png';
      } else {
        icon.getElementsByTagName('img')[0].src = 'c2c-black.png';
      }
    });
  }
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

  const clearBtn = document.getElementById('clear');
  clearBtn.addEventListener('click', clearEvents);

  const userIdsBtn = document.getElementById('userId');
  userIdsBtn.addEventListener('click', getUserInfo);

  const anonIdsBtn = document.getElementById('anonId');
  anonIdsBtn.addEventListener('click', getUserInfo);

  const userTraitsBtn = document.getElementById('userTraits');
  userTraitsBtn.addEventListener('click', getUserInfo);

  postMessage('update');
});

const getUserInfo = () => {
  chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
    const activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, { type: 'getUserInfo' });
  });
};

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
