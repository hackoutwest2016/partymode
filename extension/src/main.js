
var sidebarForThread = new WeakMap();
var sidebarTemplatePromise = null;

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

function getEventName(text) {
    return "Coachella 2016";
}

function addSidebar(threadView) {
    if (!sidebarForThread.has(threadView)) {
        sidebarForThread.set(threadView, document.createElement('div'));

        threadView.addSidebarContentPanel({
            el: sidebarForThread.get(threadView),
            title: "PARTY HARD"
        });
    }

    if (!sidebarTemplatePromise) {
        sidebarTemplatePromise = get(chrome.runtime.getURL('sidebar_template.html'), null, null);
    }

    Promise.all([
        sidebarTemplatePromise
    ])
    .then(function(results) {
        var template = _.template(html);
        sidebarForThread.get(threadView).innerHTML = sidebarForThread.get(threadView).innerHTML + template({
            event_pic: "img/coachella.png"
        });
    });
}

function get(url, params, headers) {
    return Promise.resolve(
        $.ajax({
            url: url,
            type: "GET",
            data: params,
            headers: headers
        })
    );
}
