
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
                "<a class=\"best_playlist_link\" href=\"<%= playlist_link %>\"><img src=\"<%= spotify_logo %>\" width=\"80\" height=\"80\" style=\"position: absolute; top: 10px; left: 10px; opacity: 0.6;\"/></a>" +
            "</div>";

            var template = _.template(tpl)
                sidebarForThread.get(threadView).innerHTML = sidebarForThread.get(threadView).innerHTML + template({
                event_pic: null,
                playlist_link: "https://spotify.com/",
                spotify_logo: img.src
            });

            threadView.addSidebarContentPanel({
                el: sidebarForThread.get(threadView),
                title: festival_name + " playlist"
            });
            getPlaylist(festival_name);
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

function getPlaylist(eventName) {
    var originalName = eventName;
    eventName = eventName.replace(" ", "_");
    eventName = eventName.toLowerCase();

    var festivals = {};
    festivals["coachella"] = "23977814";
    festivals["hard_summer"] = "23261803";
    festivals["crssd_festival"] = "25908648";
    festivals["emmaboda_festival"] = "19733794";
    festivals["way_out_west"] = "19499249";

    var eventId = festivals[eventName];
    console.log(eventName);
    console.log(eventId);
    console.log(originalName);

    if (eventId === undefined) {
        throw "Could not find festival.";
    }

    var spotifyApi = new SpotifyWebApi();

    spotifyApi.setAccessToken(localStorage["sp_token"]);

    Promise.all([
        get("https://api.songkick.com/api/3.0/events/" + eventId + ".json?apikey=5AiwvQRMAnjap1X8", null, null)
    ])
    .then(function (result) {
        var a = result[0]['resultsPage']['results']['event']['performance'];
        var artists = [];

        for (var i = 0; i < a.length; i++) {
            artists.push(a[i]["artist"]["displayName"]);
        }
        return artists;
    })
    .then(function (artistNames) {
        console.log(artistNames);

        var artists = [];
        var promises = [];

        artistNames.forEach(function(element) {
            console.log("heki: ", element);
            promises.push(
                spotifyApi.searchArtists(element, {limit: 1})
            );
        });

        Promise.all(promises)
            .then(function(results) {

                    console.log("party: ", results);
                    var nrOfTracks = getSongsPerArtist(results.length);
                    var promises = [];

                    results.forEach(function(element) {
                        //console.log("el: ", element['artists']);
                        //console.log("id yo: ", element['artists']['items'][0]['id']);
                        if (element['artists']['items'][0] !== undefined) {
                            promises.push(
                                spotifyApi.getArtistTopTracks(element['artists']['items'][0]['id'], 'SE', {limit: 3})
                            );
                        }
                    });

                    Promise.all(promises)
                        .then(function(results) {
                                trackIds = [];
                                console.log("results: ", results);
                                console.log(results.length);
                                results.forEach(function(element, index) {
                                    console.log("Top tracks: ", element);
                                    for (var i = 0; i < nrOfTracks; i++) {
                                        console.log(element.tracks[i].uri);
                                        if (i < element.tracks.length) {
                                            trackIds.push(element.tracks[i].uri);
                                        }
                                    }
                                });
                                console.log(trackIds);
                                return trackIds;
                            })
                            .then(function (tracks) {
                                createSpotifyPlaylist(spotifyApi, tracks, originalName);
                            });
                    });

                   /* artistNames.forEach(function(artist) {
                        spotifyApi.searchArtists(artist, {limit: 1})
                            .then(function(data) {
                                if (!data.artists.items === undefined || !data.artists.items.length == 0) {
                                    artists.push(data.artists.items[0]);
                                } else {
                                    console.log("Could not find artist: " + artist)
                                }
                            }, function(err) {
                                console.error(err);
                            });*/

/*

        var artists = getSpotifyArtists(artistNames, spotifyApi);
        console.log(artists);
        var nrOfTracks = 1;
        console.log("# songs: ", nrOfTracks);

        var promises = [];
        console.log("len: ", artists.length);

        artists.array.forEach(function(element) {
            console.log("el: ", element);
            promises.push(
                spotifyApi.getArtistTopTracks(element.id, 'SE')
                    .then(function(data) {
                        console.log("Hello ", data);
                    })
            );
        });

        Promise.all(promises)
            .then(function(results) {
                    trackIds = [];
                    console.log("results: ", results);
                    console.log(results.length);
                    results.forEach(function(element, index) {
                        console.log("Top tracks: ", element);
                        for (var i = 0; i < nrOfTracks; i++) {
                            console.log(element);
                            if (i < element.tracks.length) {
                                trackIds.push(element.tracks.uri);
                            }
                        }
                    });
                    console.log(trackIds);
                    return trackIds;
                })
                .then(function (tracks) {
                    createSpotifyPlaylist(spotifyApi, tracks, originalName);
                });*/

        /*var calls = [];
        artists.forEach(function(element, index) {
            calls.push(spotifyApi.getArtistTopTracks(element.id, 'SE')
                .then(function (data) {
                    console.log("hello", data);
                }));
        });

        Promise.all(calls)
                .then(function(results) {
                    trackIds = []
                    console.log("results: ", results);
                    console.log(results.length)
                    results.forEach(function(element, index) {
                        console.log("Top tracks: ", element);
                        for (var i = 0; i < nrOfTracks; i++) {
                            console.log(element);
                            if (i < element.tracks.length) {
                                trackIds.push(element.tracks.uri);
                            }
                        }
                    });
                    console.log(trackIds);
                    return trackIds;
                })
                .then(function (tracks) {
                    createSpotifyPlaylist(spotifyApi, tracks, originalName);
                });
            */
        //var trackIds = waitForElement(artists, getSpotifyTracks(spotifyApi, artists, getSongsPerArtist(artists.length)));
        //console.log(trackIds);
       //var playlist = waitForElement(trackIds, createSpotifyPlaylist(spotifyApi, trackIds, originalName));
        //console.log(playlist);
    });
}

function waitForElement(v, f){
    if(v && v !== undefined && v.length > 0){
        return f();
    } else {
        setTimeout(function(){
            waitForElement();
        },250);
    }
}

function getArtists(eventId) {
    Promise.all([
        get("https://api.songkick.com/api/3.0/events/" + eventId + ".json?apikey=5AiwvQRMAnjap1X8", null, null)
    ])
    .then(function (result) {
        var a = result[0]['resultsPage']['results']['event']['performance']
        var artists = [];

        for (var i = 0; i < a.length; i++) {
            artists.push(a[i]["artist"]["displayName"]);
        }
        return artists;
    });
}

function getSpotifyArtists(artistNames, api) {
    var artists = [];
    artistNames.forEach(function(artist) {
        api.searchArtists(artist, {limit: 1})
            .then(function(data) {
                if (!data.artists.items === undefined || !data.artists.items.length == 0) {
                    artists.push(data.artists.items[0]);
                } else {
                    console.log("Could not find artist: " + artist)
                }
            }, function(err) {
                console.error(err);
            });
    });

    return artists;
}

function getSpotifyTracks(spotifyApi, artists, nrOfTracks) {

    artists.forEach(function(element, index) {

        var calls = [];
        calls.push(spotifyApi.getArtistTopTracks(element.id, 'SE'));
        Promise.all(calls)
            .then(function(results) {

                trackIds = []
                results.forEach(function(element, index) {
                    for (var i = 0; i < nrOfTracks; i++) {
                        console.log(element);
                        if (i < element.tracks.length) {
                            trackIds.push(element.tracks.uri);
                        }
                    }
                });
                console.log(trackIds);
                return trackIds;
            });


        spotifyApi.getArtistTopTracks(element.id, 'SE')
            .then(function (data) {
                console.log(data);
                for (var i = 0; i < nrOfTracks; i++) {
                    if (i <= data.tracks.length) {
                        trackIds.push(data.tracks.uri);
                    }
                }
            });
    });
    return trackIds;
}

function createSpotifyPlaylist(spotifyApi, trackUris, eventName) {
    userId = null;
    playlist = null;
    spotifyApi.getMe()
        .then(function (data) {
            userId = data.id;
            console.log(data);
        })
        .then(function (data) {
            return spotifyApi.createPlaylist(userId, {name: eventName, public: true});
        })
        .then(function (data) {
            playlist = data;
            spotifyApi.addTracksToPlaylist(userId, playlist.id, trackUris);
            console.log(playlist.uri);
            $("a.best_playlist_link").attr("href", playlist.external_urls.spotify);
            return playlist.uri;
        }, function(err) {
            console.error(err);
        });
}

function addTracksToPlaylist(spotifyApi, userId, playlistId, uris) {
    spotifyApi.addTracksToPlaylist(userId, playlistId, uris, null, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log("Added to playlist ", uris);
        }
    });
}

function getSongsPerArtist(artists) {
    if (artists >= 12) {
        return 3;
    } else if (artists >= 10) {
        return 4;
    } else if (artists >= 8) {
        return 5;
    } else if (artists == 7) {
        return 6;
    } else if (artists == 6) {
        return 7;
    } else if (artists == 5) {
        return 8;
    } else {
        return 10;
    }
}
