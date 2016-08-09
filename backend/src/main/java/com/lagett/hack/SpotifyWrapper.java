package com.lagett.hack;

import com.lagett.hack.pojo.Song;
import com.mashape.unirest.http.HttpResponse;
import com.mashape.unirest.http.JsonNode;
import com.mashape.unirest.http.Unirest;
import com.mashape.unirest.http.exceptions.UnirestException;

import java.util.List;

/**
 * Created by per on 09/08/16.
 */
public class SpotifyWrapper {

    private String token;

    public SpotifyWrapper(String token) {
        this.token = token;
    }

    public List<Song> getSongs(String eventName) {




//        HttpResponse<JsonNode> jsonResponse = Unirest.post("https://accounts.spotify.com/api/token").
//                header("accept", "application/json")
//                .queryString("grant_type", "authentication_code")
//                .asJson();
        return null;
    }

    private String getArtistId(String artist) throws UnirestException {
//        HttpResponse<JsonNode> jsonResponse = Unirest.get("http://api.spotify.com")
//                .routeParam("search", "kanye+west")
//                .routeParam("type", "artist")
//                .routeParam("limit", "1")
//                .asJson();
//
//        jsonResponse.getBody().
        return null;
    }

}
