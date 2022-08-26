let loaded = false
document.addEventListener("DOMContentLoaded", function() {
    loaded = true
})
chrome.extension.onMessage.addListener(function(event, messageSender, sendResponse) {
    if (loaded) {
        const eventContainer = document.querySelector("div#trackMessages")
        eventContainer.append(`
            <div>
                ${JSON.stringify(event, null, 4)}
            </div>
        `)
    }

    // message is the message you sent, probably an object
    // messageSender is an object that contains info about the context that sent the message
    // sendResponse is a function to run when you have a response
});