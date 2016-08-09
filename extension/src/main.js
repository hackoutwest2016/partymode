
var sidebarForThread = new WeakMap();
var sidebarTemplatePromise = null;
var festivals = ["coachella", "crssd festival", "hard summer", "colors game over"];
var keywords = ["order", "total", "ticket", " confirmation", "general", "admission"];
var testText = "coachella coachella crssd festival total";
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
        //console.log("subject: ", threadView.getSubject())
        var subjectText = threadView.getSubject();
        subjectText = subjectText.toLowerCase();
        console.log(subjectText);
        var bodyText = messageView.getBodyElement();
        bodyText = jQuery(bodyText).text();
        bodyText = bodyText.replace(/\r?\n|\r/g,'');
        bodyText = bodyText.replace(/ +(?= )/g,'');
        bodyText = bodyText.toLowerCase();
        //console.log(bodyText);
        //console.log(isFestival(subjectText));
        //console.log(isFestival(bodyText));
        //console.log(containsKeywords(bodyText));
        console.log(isFestival(testText));
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

/*function isFestival(text, festivals) {
        if(text.indexOf(festivals) !== -1)
        {
            return festivals;
        } else {
            return "None";
        }
}*/

/*function isFestival(text) {
    for(i = 0; i < festivals.length; i++)
    {
        if(text.indexOf(festivals[i]) !== -1)
        {
            return festivals[i];
        }
    }
    return "None";
}*/
/*function isFestival(text) {
    var sameFestival = [];
    for(i = 0; i < festivals.length; i++)
    {
        if(text.indexOf(festivals[i]) !== -1)
        {
            sameFestival[sameFestival.length] = festivals[i];
            console.log(festivals[i]);
        }
    }
    if(sameFestival == undefined || sameFestival < 1)
    {
        return "None";
    }
    var firstFestival = sameFestival[0];
    for(i = 0; i < sameFestival.length; i++)
    {
        if(firstFestival !== sameFestival[i])
        {
            return "Many festivals in same mail";
        }
    }
    if(containsKeywords(text))
    {
        return firstFestival;
    }
    return "Not enough keywords";
}*/

function isFestival(text) {
    var sameFestival = new Array(festivals.length);
    for(i = 0; i < festivals.length; i++)
    {
        sameFestival[i] = new Array(2)
        sameFestival[i][0] = festivals[i];
        sameFestival[i][1] = occurrences(text, festivals[i]);
        //console.log(sameFestival[i][0] + " " + sameFestival[i][1]);
    }
    /*console.log(sameFestival[0][0]);
    console.log(sameFestival[0][1]);
    console.log(sameFestival[1][0]);
    console.log(sameFestival[1][1]);
    console.log(sameFestival.length);*/
    var largest1 = new Array(2);
    largest1[1] = -1;
    var largest2 = new Array(2);
    largest2[1] = -1;
    for(i = 0; i < sameFestival.length; i++)
    {
        if(largest1[1] < sameFestival[i][1])
        {
            largest2 = largest1;
            largest1 = sameFestival[i]
        } else if(largest2[1] < sameFestival[i][1])
        {
            largest2 = sameFestival[i];
        }
    }
    /*console.log(largest1);
    console.log(largest2);*/
    if(largest1[1] > largest2[1])
    {
        if(containsKeywords(text))
        {
            return largest1[0];
        } 
        else
        {
            return "Not enough keywords"
        }
    }
    else
    {
        return "Not a festivalmail";
    }    
}

function occurrences(string, substring){
    var n=0;
    var pos=0;

    while(true){
        pos=string.indexOf(substring,pos);
        if(pos!=-1){ n++; pos+=substring.length;}
        else{break;}
    }
    return(n);
}

function containsKeywords(text) {
    var nbrOfKeywords = 0;
    for(i = 0; i < keywords.length; i++)
    {
        if(text.indexOf(keywords[i]) !== -1)
        {
            nbrOfKeywords++;
        }
    }
    if(nbrOfKeywords > 1)
    {
        return true;
    }
    else
    {
        return false;
    }
}