
InboxSDK.load('1.0', 'sdk_partyhardhow16_d05fc23638').then(function(sdk){

    // the SDK has been loaded, now do something with it!
    sdk.Compose.registerComposeViewHandler(function(composeView){

    // a compose view has come into existence, do something with it!
    composeView.addButton({
            title: "My Nifty Button!",
            iconUrl: 'https://example.com/foo.png',
            onClick: function(event) {
                event.composeView.insertTextIntoBodyAtCursor('Hello World!');
            },
        });
    });

    sdk.Conversations.registerMessageViewHandler(function(messageView) {
        var threadView = messageView.getThreadView();
        addSidebar(threadView);
    });
});

function addSidebar(threadView) {
    var el = document.createElement("div");
    el.innerHTML = 'Hello world!';

    threadView.addSidebarContentPanel({
        el: el,
        title: "PARTY HARD",
        iconUrl: chrome.runtime.getURL('img/coachella.png')
    });
}

