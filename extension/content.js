var j = document.createElement('script');
j.src = chrome.extension.getURL('js/jquery-1.9.1.min.js');
(document.head || document.documentElement).appendChild(j);

var g = document.createElement('script');
g.src = chrome.extension.getURL('js/gmail.js');
(document.head || document.documentElement).appendChild(g);

var s = document.createElement('script');
s.src = chrome.extension.getURL('src/main.js');
(document.head || document.documentElement).appendChild(s);

var q = document.createElement('script');
s.src = chrome.extension.getURL('js/bootstrap.min.js');
(document.head || document.documentElement).appendChild(q);

var p = document.createElement('script');
s.src = chrome.extension.getURL('js/handlebars-v4.0.5.js');
(document.head || document.documentElement).appendChild(p);