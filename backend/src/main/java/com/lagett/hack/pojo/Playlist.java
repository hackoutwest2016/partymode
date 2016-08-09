package com.lagett.hack.pojo;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Created by per on 09/08/16.
 */
public class Playlist {

    @JsonProperty("playlist_url")
    private String url;

    public Playlist(String url) {
        this.url = url;
    }

    public String getUrl() {
        return url;
    }
}
