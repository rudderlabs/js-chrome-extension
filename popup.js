// Commented out code below originally used for custom domain toggle feature

const port = chrome.runtime.connect();

port.onMessage.addListener((msg) => {
  if (msg.type === 'update') {
    renderEvents(msg);
    renderSeachAndFilters(msg);
  }
});

const renderEvents = (msg) => {
  const eventsContainer =
    document.getElementsByClassName('events-container')[0];
  if (msg.events.length > 0) {
    eventsContainer.innerHTML = '';
    msg.events.map(
      (event) =>
        (eventsContainer.innerHTML +=
          `<div class="event event--${event.payload.type} event--collapsed" data-type="${event.payload.type}">` +
          `<div class="event__details">` +
          `<div class="event__details__top">` +
          `<span class="event__details__text event__details__text--${
            event.payload.type
          }">${
            event.payload.type.charAt(0).toUpperCase() +
            event.payload.type.slice(1)
          }</span>` +
          `<span class="event__details__text">${
            event.payload.event ? `&nbsp;|&nbsp;${event.payload.event}` : ''
          }</span>` +
          `</div>` +
          `<div class="event__details__bottom">` +
          `<span class="event__details__text event__details__text--user-id">${
            event.payload.userId
              ? `User ID:<br><div class="event__details__text--sm">${event.payload.userId}</div>`
              : '<div class="event__details__text--sm">Unidentified<br>User</div>'
          }</span>` +
          `<span class="event__details__text event__details__text--anonymoud-id">Anonymous ID:<br><div class="event__details__text--sm">${event.payload.anonymousId}</div></span>` +
          `<span class="event__details__text event__details__text--sent-at">Sent At:<br><div class="event__details__text--sm">${event.payload.sentAt
            .replace('Z', '')
            .replace('T', ' ')}</div></span>` +
          `</div>` +
          `</div>` +
          `<div class="event__details--expanded">` +
          `<pre class="event__details__json">` +
          `<button class="btn btn-outline-dark btn--copy-to-clipboard btn--copy-to-clipboard--margin" title="Copy To Clipboard">` +
          `<img class="img--copy-to-clipboard" src="c2c-black.png" title="Copy To Clipboard"/>` +
          `</button>` +
          `<code class="event__details__text--sm">${syntaxHighlight(
            JSON.stringify(event.payload, undefined, 2)
          )}</code>` +
          `</pre>` +
          `</div>` +
          `<div>`)
    );
  } else {
    eventsContainer.innerHTML = `<div class="events-container__text">RudderStack Events Will Show Up Here</div>`;
  }
  addEventCollapseExpandListeners();
  setResetBtnDisableAttribute(msg.filters, msg.searchValue);
  setClearBtnDisableAttribute(msg.events);
  addCopyToClipboardListeners();
};

const addEventCollapseExpandListeners = () => {
  const eventElements = [].slice.call(
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

const setResetBtnDisableAttribute = (filters, searchValue) => {
  const resetBtn = document.getElementById('reset');
  resetBtn.disabled = filters.length === 0 && searchValue === '' ? true : false;
};

const setClearBtnDisableAttribute = (events) => {
  const clearBtn = document.getElementById('clear');
  clearBtn.disabled = events.length === 0 ? true : false;
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

  // msg.isCustomDomain
  //   ? (document.getElementById('flexSwitchCheckChecked').style.display =
  //       'block')
  //   : (document.getElementById('flexSwitchCheckDefault').style.display =
  //       'block');
};

chrome.runtime.onMessage.addListener((msg) => {
  switch (msg.type) {
    case 'add':
      postMessage('update');
      break;
    case 'userInfo':
      displayUserInfo(msg);
      updateUserInfoBtnsCSS(msg);
      break;
    case 'clear':
      clearEvents();
      break;
    default:
      console.log('msg.type does not match any action: ', msg.type);
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

const displayUserInfo = (msg) => {
  const userInfoEl = document.getElementsByClassName('user-data__info')[0];
  switch (msg.id) {
    case 'userId':
      userInfoEl.innerHTML =
        msg[msg.id] === ''
          ? `<pre class="user-data__info__text"><code class="event__details__text--lg">Undentified User</code></pre>`
          : `<pre class="user-data__info__text">` +
            `<button class="btn btn-outline-dark btn--copy-to-clipboard" title="Copy To Clipboard">` +
            `<img class="img--copy-to-clipboard" src="c2c-black.png" title="Copy To Clipboard"/>` +
            `</button>` +
            `<code class="event__details__text--lg">${
              msg[msg.id]
            }</code></pre>`;
      break;
    case 'anonymousId':
      userInfoEl.innerHTML =
        `<pre class="user-data__info__text">` +
        `<button class="btn btn-outline-dark btn--copy-to-clipboard" title="Copy To Clipboard">` +
        `<img class="img--copy-to-clipboard" src="c2c-black.png" title="Copy To Clipboard"/>` +
        `</button>` +
        `<code class="event__details__text--lg">${msg[msg.id]}</code></pre>`;
      break;
    case 'userTraits':
      userInfoEl.innerHTML =
        Object.keys(msg[msg.id]).length > 0
          ? `<pre class="event__details__json">` +
            `<button class="btn btn-outline-dark btn--copy-to-clipboard" title="Copy To Clipboard">` +
            `<img class="img--copy-to-clipboard" src="c2c-black.png" title="Copy To Clipboard"/>` +
            `</button>` +
            `<code class="event__details__text--lg">${syntaxHighlight(
              JSON.stringify(msg[msg.id], undefined, 2)
            )}</code>` +
            `</pre>`
          : '<pre><code class="event__details__text--lg">No User Traits</code></pre>';
      break;
    default:
      console.log('msg.type does not match any action: ', msg.type);
  }

  addCopyToClipboardListeners();
};

const syntaxHighlight = (payload) => {
  payload = payload
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return payload.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'number';
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

const clearEvents = () => {
  postMessage('clear');
};

// const updateDataPlaneURL = (e) => {
//   if (e.target.checked) {
//     postMessage('custom-domain');
//   } else {
//     postMessage('rudderstack-domain');
//   }
// };

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

  const userIdsBtn = document.getElementById('userId');
  userIdsBtn.addEventListener('click', getUserInfo);

  const anonIdsBtn = document.getElementById('anonymousId');
  anonIdsBtn.addEventListener('click', getUserInfo);

  const userTraitsBtn = document.getElementById('userTraits');
  userTraitsBtn.addEventListener('click', getUserInfo);

  // const customDomainToggles = [].slice.call(
  //   document.getElementsByClassName('nav__custom-domain__input')
  // );
  // customDomainToggles.forEach((toggle) =>
  //   toggle.addEventListener('change', updateDataPlaneURL)
  // );

  const clearBtn = document.getElementById('clear');
  clearBtn.addEventListener('click', clearEvents);

  postMessage('update');
});

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

const resetFilters = () => {
  postMessage('reset', '', []);
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
