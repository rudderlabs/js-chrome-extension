const isRudderStackCall = (call) => {
    let isRudderStack = true

    return isRudderStack
}

const sendEvent = (event) => {
    console.log(1)
    chrome.runtime.sendMessage(event);
}

chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        if (isRudderStackCall(details.url)) {

            chrome.tabs.query({active: true}, function(tabs) {

                // since only one tab should be active and in the current window at once
                // the return variable should only have one entry
                const activeTabs = tabs.map(tab => tab.id)
                if (activeTabs.includes(details.tabId)) {
                    const regStr = /^https:\/\/(.*)dataplane.rudderstack.com(.*)$/
                    if (regStr.test(details.url)) {
                        const postedString = String.fromCharCode.apply(null, new Uint8Array(details.requestBody.raw[0].bytes));
                        const rawEvent = JSON.parse(postedString);
                        sendEvent(rawEvent)
                    }
                }
             });
            // var postedString = String.fromCharCode.apply(null, new Uint8Array(details.requestBody.raw[0].bytes));
            // var rawEvent = JSON.parse(postedString);
            // var event = {
            //     raw: postedString,
            //     trackedTime: formatDateToTime(new Date()),
            // };
            // withOpenTab((tab) => {
            //     event.hostName = tab.url;
            //     event.tabId = tab.id;
            //     if (details.url.endsWith('/v1/t') || details.url.endsWith('/v2/t')) {
            //         event.type = 'track';
            //     } else if (details.url.endsWith('/v1/i') || details.url.endsWith('/v2/i')) {
            //         event.type = 'identify';
            //     } else if (details.url.endsWith('/v1/p') || details.url.endsWith('/v2/p')) {
            //         event.type = 'pageLoad';
            //     } else if (details.url.endsWith('/v1/batch') || details.url.endsWith('/v2/batch') || details.url.endsWith('/v1/b') || details.url.endsWith('/v2/b')) {
            //         event.type = 'batch';
            //     }
            //     if (event.type) {
            //         event.eventName = eventTypeToName(event.type) || rawEvent.event
            //         addEvent(event);
            //     }
            // });
        }
    }, {
        urls: [
            "https://*/*",
            "http://*/*"
        ]
    },
    ['blocking', 'requestBody']
);
// chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
//     if (changeInfo.status == 'complete') {
  
//         chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

//             // since only one tab should be active and in the current window at once
//             // the return variable should only have one entry
//             console.log(tabs[0])
       
//          });
  
//     }
//   })

