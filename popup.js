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
    displayUserInfo(msg);
    updateUserInfoBtnsCSS(msg);
  }
});

const displayUserInfo = (msg) => {
  const userInfoEl = document.getElementsByClassName('user-data__info')[0];
  if (msg.id === 'userId') {
    userInfoEl.innerHTML =
      msg[msg.id] === ''
        ? `<pre class="user-data__info__text"><code class="event__details__text--lg">Undentified User</code></pre>`
        : `<pre class="user-data__info__text">` +
          `<button class="btn btn-outline-dark btn--copy-to-clipboard" title="Copy To Clipboard">` +
          `<img class="img--copy-to-clipboard" src="c2c-black.png" title="Copy To Clipboard"/>` +
          `</button>` +
          `<code class="event__details__text--lg">${msg[msg.id]}</code></pre>`;
  } else if (msg.id === 'anonymousId') {
    userInfoEl.innerHTML =
      `<pre class="user-data__info__text">` +
      `<button class="btn btn-outline-dark btn--copy-to-clipboard" title="Copy To Clipboard">` +
      `<img class="img--copy-to-clipboard" src="c2c-black.png" title="Copy To Clipboard"/>` +
      `</button>` +
      `<code class="event__details__text--lg">${msg[msg.id]}</code></pre>`;
  } else if (msg.id === 'userTraits') {
    if (Object.keys(msg[msg.id]).length > 0) {
      userInfoEl.innerHTML =
        `<pre class="event__details__json">` +
        `<button class="btn btn-outline-dark btn--copy-to-clipboard" title="Copy To Clipboard">` +
        `<img class="img--copy-to-clipboard" src="c2c-black.png" title="Copy To Clipboard"/>` +
        `</button>` +
        `<code class="event__details__text--lg">${syntaxHighlight(
          JSON.stringify(msg[msg.id], undefined, 2)
        )}</code>` +
        `</pre>`;
    } else {
      userInfoEl.innerHTML =
        '<pre><code class="event__details__text--lg">No User Traits</code></pre>';
    }
  }
  addCopyToClipboardListeners();
};

const updateUserInfoBtnsCSS = (msg) => {
  const userInfoBtns = [].slice.call(
    document.getElementsByClassName('btn--user-data')
  );
  userInfoBtns.forEach((btn) => {
    if (btn.id === msg.id) {
      btn.classList.add('btn--user-data--active');
    } else {
      btn.classList.remove('btn--user-data--active');
    }
  });
};

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
  const eventsContainer =
    document.getElementsByClassName('events-container')[0];
  if (msg.events.length > 0) {
    eventsContainer.innerHTML = '';
    msg.events.map(
      (m) =>
        (eventsContainer.innerHTML +=
          `<div class="event event--${m.payload.type} event--collapsed" data-type="${m.payload.type}">` +
          `<div class="event__details">` +
          `<div class="event__details__top">` +
          `<span class="event__details__text event__details__text--${
            m.payload.type
          }">${
            m.payload.type.charAt(0).toUpperCase() + m.payload.type.slice(1)
          }</span>` +
          `<span class="event__details__text">${
            m.payload.event ? `&nbsp;|&nbsp;${m.payload.event}` : ''
          }</span>` +
          `</div>` +
          `<div class="event__details__bottom">` +
          `<span class="event__details__text event__details__text--user-id">${
            m.payload.userId
              ? `User ID:<br><div class="event__details__text--sm">${m.payload.userId}</div>`
              : '<code class="event__details__text--sm">Unidentified<br>User</code>'
          }</span>` +
          `<span class="event__details__text event__details__text--anonymoud-id">Anonymous ID:<br><div class="event__details__text--sm">${m.payload.anonymousId}</div></span>` +
          `<span class="event__details__text event__details__text--sent-at">Sent At:<br><div class="event__details__text--sm">${m.payload.sentAt
            .replace('Z', '')
            .replace('T', ' ')}</div></span>` +
          `</div>` +
          `</div>` +
          `<div class="event__details--expanded">` +
          `<pre class="event__details__json">` +
          `<button class="btn btn-outline-dark btn--copy-to-clipboard" title="Copy To Clipboard">` +
          `<img class="img--copy-to-clipboard" src="c2c-black.png" title="Copy To Clipboard"/>` +
          `</button>` +
          `<code class="event__details__text--sm">${syntaxHighlight(
            JSON.stringify(m.payload, undefined, 2)
          )}</code>` +
          `</pre>` +
          `</div>` +
          `<div>`)
    );
  } else {
    eventsContainer.innerHTML = `<div class="events-container__text">RudderStack Events Will Show Up Here</div>`;
  }
  addEventCollapseExpandListeners();
  setClearBtnDisableAttribute(msg.events);
  setResetBtnDisableAttribute(msg.filters, msg.searchValue);
  addCopyToClipboardListeners();
};

const addEventCollapseExpandListeners = () => {
  var eventElements = [].slice.call(
    document.getElementsByClassName('event__details')
  );
  for (const eventEl of eventElements) {
    eventEl.addEventListener('click', () => {
      if (
        [].slice
          .call(eventEl.parentElement.classList)
          .indexOf('event--collapsed') != -1
      ) {
        eventEl.parentElement.classList.remove('event--collapsed');
        eventEl.parentElement.classList.add('event--expanded');
      } else {
        eventEl.parentElement.classList.add('event--collapsed');
        eventEl.parentElement.classList.remove('event--expanded');
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
    document.getElementsByClassName('btn--copy-to-clipboard')
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
  const searchInputEl = document.getElementsByClassName('nav__search-input')[0];
  searchInputEl.value = msg.searchValue;

  const filterInputEls = [].slice.call(
    document.getElementsByClassName('nav__filters-check-input')
  );
  if (msg.filters.length > 0) {
    filterInputEls
      .filter((input) => msg.filters.indexOf(input.value) > -1)
      .map((input) => (input.checked = true));
  } else {
    filterInputEls.map((input) => (input.checked = false));
  }

  msg.isCustomDomain
    ? (document.getElementById('flexSwitchCheckChecked').style.display =
        'block')
    : (document.getElementById('flexSwitchCheckDefault').style.display =
        'block');
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
    document.getElementsByClassName('nav__filters-check-input')
  );
  filterInputEls.forEach((input) =>
    input.addEventListener('change', filterEvents)
  );

  const searchInputEl = document.getElementsByClassName('nav__search-input')[0];
  searchInputEl.addEventListener('keyup', filterEvents);

  const resetBtn = document.getElementById('reset');
  resetBtn.addEventListener('click', resetFilters);

  const customDomainToggles = [].slice.call(
    document.getElementsByClassName('nav__custom-domain__input')
  );
  customDomainToggles.forEach((toggle) =>
    toggle.addEventListener('change', updateDataPlaneURL)
  );

  const clearBtn = document.getElementById('clear');
  clearBtn.addEventListener('click', clearEvents);

  const userIdsBtn = document.getElementById('userId');
  userIdsBtn.addEventListener('click', getUserInfo);

  const anonIdsBtn = document.getElementById('anonymousId');
  anonIdsBtn.addEventListener('click', getUserInfo);

  const userTraitsBtn = document.getElementById('userTraits');
  userTraitsBtn.addEventListener('click', getUserInfo);

  postMessage('update');
});

const updateDataPlaneURL = (e) => {
  if (e.target.checked) {
    postMessage('custom-domain');
  } else {
    postMessage('rudderstack-domain');
  }
};

const getUserInfo = (e) => {
  chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
    const activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, {
      type: 'getUserInfo',
      id: e.target.id,
    });
  });
};

const resetFilters = () => {
  postMessage('reset', '', []);
};

const filterEvents = () => {
  const searchValue =
    document.getElementsByClassName('nav__search-input')[0].value;
  const filterInputEls = [].slice.call(
    document.getElementsByClassName('nav__filters-check-input')
  );
  const filters = filterInputEls
    .filter((filter) => filter.checked)
    .map((filter) => filter.value);

  postMessage('filter', searchValue, filters);
};
