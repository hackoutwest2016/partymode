
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

var sidebarForThread = new WeakMap();
var sidebarTemplatePromise = null;
var festivals = ["coachella", "crssd festival", "hard summer", "colors game over"];
var keywords = ["order", "total", "ticket", " confirmation", "general", "admission"];
var testText = "coachella coachella crssd festival total";

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
        subjectText = subjectText.toLowerCase();
        var bodyText = messageView.getBodyElement();
        bodyText = jQuery(bodyText).text();

        bodyText = bodyText.replace(/\r?\n|\r/g,'');
        bodyText = bodyText.replace(/ +(?= )/g,'');
        bodyText = bodyText.toLowerCase();
        festival = isFestival(bodyText);
        console.log(festival);
        if (festival !== null) {
            addSidebar(threadView, festival);
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

function isFestival(text) {
    var sameFestival = new Array(festivals.length);
    for(i = 0; i < festivals.length; i++) {
        sameFestival[i] = new Array(2)
        sameFestival[i][0] = festivals[i];
        sameFestival[i][1] = occurrences(text, festivals[i]);
    }

    var largest1 = new Array(2);
    largest1[1] = -1;
    var largest2 = new Array(2);
    largest2[1] = -1;
    for(i = 0; i < sameFestival.length; i++) {
        if(largest1[1] < sameFestival[i][1]) {
            largest2 = largest1;
            largest1 = sameFestival[i]
        } else if(largest2[1] < sameFestival[i][1]) {
            largest2 = sameFestival[i];
        }
    }

    if(largest1[1] > largest2[1]) {
        if(containsKeywords(text)) {
            return largest1[0];
        } else {
            return null;
        }
    } else {
        return null;
    }
}

function occurrences(string, substring){
    var n=0;
    var pos=0;

    while(true) {
        pos=string.indexOf(substring,pos);
        if(pos!=-1){
            n++;
            pos+=substring.length;
        } else {
            break;
        }
    }
    return(n);
}

function containsKeywords(text) {
    var nbrOfKeywords = 0;
    for(i = 0; i < keywords.length; i++) {
        if(text.indexOf(keywords[i]) !== -1) {
            nbrOfKeywords++;
        }
    }
    if(nbrOfKeywords > 1) {
        return true;
    } else {
        return false;
    }
}