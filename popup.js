const port = chrome.runtime.connect();

port.onMessage.addListener((msg) => {
  if (msg.type === 'update') {
    renderEvents(msg);
  } else if (msg.type === 'filter') {
    renderEvents(msg);
    // msg.filters.forEach((filter) => {
    //   const filterInputs = [].slice.call(
    //     document.getElementsByClassName('form-check-input')
    //   );
    //   console.log('filterInputs: ', filterInputs);
    //   console.log('filter: ', filter);
    //   filterInputs.map((input) => {
    //     if (input.value === filter) {
    //       input.checked = true;
    //       console.log('input: ', input);
    //     }
    //   });
    // });
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'clear') {
    clearEvents();
  } else if (msg.type === 'add') {
    postMessage('update');
  }
});

const postMessage = (type, filters = []) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    port.postMessage({
      type,
      tabId: tabs[0].id,
      filters,
    });
  });
};

const renderEvents = (msg) => {
  const eventsContainer = document.getElementById('events-container');
  eventsContainer.innerHTML = '';
  msg.data.map(
    (m) =>
      (eventsContainer.innerHTML +=
        `<div class="event collapsed ${m.payload.type}">` +
        m.payload.type +
        '<pre>' +
        syntaxHighlight(JSON.stringify(m.payload, undefined, 2)) +
        '</pre></div>')
  );
  toggleEventCollapse();
};

const toggleEventCollapse = () => {
  var elements = Array.from(document.getElementsByClassName('event'));
  for (const el of elements) {
    el.addEventListener('click', () => {
      if ([].slice.call(el.classList).indexOf('collapsed') != -1) {
        el.classList.remove('collapsed');
        el.classList.add('expanded');
      } else {
        el.classList.add('collapsed');
        el.classList.remove('expanded');
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
      return '<span class="' + cls + '">' + match + '</span>';
    }
  );
};

const clearEvents = () => {
  postMessage('clear');
};

const filterEvents = (e) => {
  const filterInputs = [].slice.call(
    document.getElementsByClassName('form-check-input')
  );
  const filtersArray = filterInputs
    .filter((input) => input.checked)
    .map((input) => input.value);
  if (e.target.checked) {
    postMessage('filter', filtersArray);
  } else {
    postMessage('filter', filtersArray);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const clearBtn = document.getElementById('clear-button');
  clearBtn.addEventListener('click', clearEvents);
  postMessage('update');
  const filterInputs = [].slice.call(
    document.getElementsByClassName('form-check-input')
  );
  filterInputs.forEach((input) =>
    input.addEventListener('change', filterEvents)
  );
});
