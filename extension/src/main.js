
var hash = location.hash.replace(/#/g, '');
var all = hash.split('&');
var args = {};
console.log('all', all);

all.forEach(function(keyvalue) {
        var idx = keyvalue.indexOf('=');
        var key = keyvalue.substring(0, idx);
        var val = keyvalue.substring(idx + 1);
        args[key] = val;
    });

if (typeof(args['access_token']) != 'undefined') {
    // got access token
    console.log('got access token', args['access_token']);
    g_access_token = args['access_token'];
    localStorage["sp_token"]=args['access_token'];
}

console.log("Saved token: ", localStorage.sp_token);

var sidebarForThread = new WeakMap();

InboxSDK.load('1.0', 'sdk_asdf123_7bf29a335b').then(function(sdk){

    sdk.Conversations.registerMessageViewHandler(function(messageView) {
        var threadView = messageView.getThreadView();
        var subjectText = threadView.getSubject();
        console.log(subjectText);
        var bodyText = messageView.getBodyElement();
        bodyText = jQuery(bodyText).text();
        console.log(bodyText);
        var festivals = ["Coachella", "CRSSD FESTIVAL", "HARD SUMMER", "COLORS Game Over"];
        f_subject = isFestival(subjectText, festivals);
        f_body = isFestival(bodyText, festivals);
        if (f_subject !== "None") {
            addSidebar(threadView, f_subject);
        } else if (f_body !== "None") {
            addSidebar(threadView, f_body);
        } else {
            console.log("No festival :(")
        }
    });
});

function addSidebar(threadView, festival_name) {

    if (!sidebarForThread.has(threadView)) {
        sidebarForThread.set(threadView, document.createElement('div'));

        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/168px-Spotify_logo_without_text.svg.png', true);
        xhr.responseType = 'blob';
        xhr.onload = function(e) {
            var img = document.createElement('img');
            img.src = window.URL.createObjectURL(this.response);
            document.body.appendChild(img);

            console.log(img)

            var tpl = "<div style=\"position: relative; left: 0; top: 0;\">" +
                "<img src=\"<%= event_pic %>\" width=\"100\" height=\"100\" style=\"position: relative; top: 0; left: 0;\"/>" +
                "<a href=\"<%= playlist_link %>\"><img src=\"<%= spotify_logo %>\" width=\"80\" height=\"80\" style=\"position: absolute; top: 10px; left: 10px; opacity: 0.6;\"/></a>" +
            "</div>";

            var template = _.template(tpl)
                sidebarForThread.get(threadView).innerHTML = sidebarForThread.get(threadView).innerHTML + template({
                event_pic: null,
                playlist_link: "https://open.spotify.com/user/128586398/playlist/0ACRVKod4rWgLydC3Rupjf",
                spotify_logo: img.src
            });

            threadView.addSidebarContentPanel({
                el: sidebarForThread.get(threadView),
                title: festival_name + " playlist"
            });
        };

        xhr.send();
    }
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

function isFestival(text, festivals) {
    for(i = 0; i < festivals.length; i++) {
        if (text.indexOf(festivals[i]) !== -1) {
            return festivals[i];
        }
    }
    return "None";
}