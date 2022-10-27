window.addEventListener(
  'message',
  (event) => {
    if (event.source != window) {
      return;
    }
    if (event.data.type === 'getUserInfo' && window.rudderanalytics) {
      window.postMessage(
        {
          type: 'userInfo',
          userId: window.rudderanalytics.getUserId(),
          anonymousId: window.rudderanalytics.getAnonymousId(),
          userTraits: window.rudderanalytics.getUserTraits(),
        },
        '*'
      );
    }
  },
  false
);
