package com.lagett.hack;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.base.CaseFormat;
import com.google.common.collect.Lists;
import com.lagett.hack.pojo.Playlist;
import com.mashape.unirest.http.HttpResponse;
import com.mashape.unirest.http.JsonNode;
import com.mashape.unirest.http.Unirest;
import com.mashape.unirest.http.exceptions.UnirestException;
import com.wrapper.spotify.Api;
import com.wrapper.spotify.exceptions.BadRequestException;
import com.wrapper.spotify.exceptions.WebApiException;
import com.wrapper.spotify.methods.ArtistSearchRequest;
import com.wrapper.spotify.models.Artist;
import com.wrapper.spotify.models.Page;
import com.wrapper.spotify.models.User;
import org.apache.commons.lang.StringUtils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;

/**
 * Created by per on 09/08/16.
 */
@RestController
public class PlaylistController {

//    private String TOKEN = "BQAODknoRoe0WtPtG1RgpiNrRSAHAapFSf_-XiBWP0NI_KZRfFqDBGY_eurBmlVXaeZ23SLCe-Pk6TZOxKdD5uMGmgV3nZ8x7GJq4RAlLBsKoJet3YlCrAycpJ9b9bsZkEyQMCu2FX1_7PvnrPPao9bM04gJbpKnqUaRdI-KL2YX_7S0mPbd9iI51VhFy7fh1bNZ2TRIsUj7aOzH0lKo0NmTPryT31PL6IIt";

    @RequestMapping("/playlist")
    public Playlist getPlaylist(@RequestParam(value="event_name") String eventName, @RequestParam(value = "token") String token) throws UnirestException, IOException, WebApiException, InterruptedException {
        String originalName = eventName;
        eventName = eventName.replaceAll("\\s+","_");
        eventName = eventName.toLowerCase();

        HashMap<String, String> festivals = new HashMap<>();

        // CANT ACCESS THIS CRAP. WHOEVER MADE THE SONGKICK API, YOU SUCK!!!!
        festivals.put("coachella", "23977814"); //2016
        festivals.put("hard_summer_festival", "23261803"); //2015
        festivals.put("crssd_festival", "25908648"); //2016
        festivals.put("emmaboda_festival", "19733794"); //2014
        festivals.put("way_out_west", "19499249"); //2014

        String eventId = festivals.get(eventName);

        if (eventId == null) {
            throw new IllegalArgumentException("event id cannot be null");
        }

//        String tokenToUse;
//        tokenToUse = token.isEmpty() ? TOKEN : token;

        Api api = Api.builder()
                .accessToken(token)
                .build();

        List<String> artistNames = getArtists(eventId);

        List<Artist> artists = getSpotifyArtists(artistNames, api);

        List<String> trackIds = getSpotifyTracks(artists, calcSongsPerArtist(artists.size()), api);

        return new Playlist(createSpotifyPlaylist(trackIds, originalName, api, token));

    }

    private List<String> getArtists(String eventId) throws UnirestException {

        HttpResponse<JsonNode> response = Unirest.get("http://api.songkick.com/api/3.0/events/" +
                eventId + ".json?apikey=5AiwvQRMAnjap1X8").asJson();

        JSONArray jsonArray = response.getBody().getObject().getJSONObject("resultsPage").getJSONObject("results").getJSONObject("event").getJSONArray("performance");

        List<String> artists = Lists.newArrayList();

        for (int i = 0; i < jsonArray.length(); i++) {
            String name = jsonArray.getJSONObject(i).getJSONObject("artist").getString("displayName");
            artists.add(name);
        }

        return artists;
    }

    private List<Artist> getSpotifyArtists(List<String> artistNames, Api api) throws IOException, WebApiException {

        List<Artist> artists = new ArrayList<>();

        for (String artistName : artistNames) {
            final ArtistSearchRequest request = api.searchArtists(artistName).limit(1).build();
            try {
                final Page<Artist> artistSearchResult = request.get();
                final List<Artist> artistsResult = artistSearchResult.getItems();
                if (artistsResult.size() > 0) {
                    artists.add(artistsResult.get(0));
                } else {
                    System.out.println("No artist found for: " + artistName);
                    System.out.println(artistSearchResult.toString());
                }
            } catch (BadRequestException e) {
                if (e.getMessage().equals("429")) {
                    System.out.println("Too many requests");
                    break;
                }
            }
        }
        return artists;
    }

    private List<String> getSpotifyTracks(List<Artist> artists, int nrOfTracks, Api api) throws UnirestException, InterruptedException {

        List<String> trackIds = new ArrayList<>();

        for (Artist artist : artists) {
            HttpResponse<JsonNode> hej = Unirest.get("https://api.spotify.com/v1/artists/" + artist.getId() + "/top-tracks?country=SE").asJson();

            for (int i = 0; i < nrOfTracks; i++) {
                if (hej.getStatus() == 429) {
                    System.out.println("Too many requests for " + artist.getName());
                    Thread.sleep(1000);
                } else {
                    JSONArray tracks = hej.getBody().getObject().getJSONArray("tracks");
                    // Need to check that we got enough tracks
                    if (i < tracks.length()) {
                        String trackId = tracks.getJSONObject(i).getString("uri").toString();
                        System.out.println(trackId);
                        trackIds.add(trackId);
                    } else {
                        System.out.println("Could not find enough songs for artist: " + artist.getName());
                    }
                }
            }
        }

        return trackIds;

    }

    private String createSpotifyPlaylist(List<String> trackUris, String eventName, Api api, String token) throws IOException, WebApiException, UnirestException {
        User user = api.getMe().build().get();

        String userId = user.getId();

        com.wrapper.spotify.models.Playlist playlist = api.createPlaylist(userId, eventName).build().get();

        // Api cap on 100 songs per request
        if (trackUris.size() > 99) {
            Iterator<String> iterator = trackUris.iterator();

            List<String> currentBatch = new ArrayList<>();
            while(iterator.hasNext()) {
                currentBatch.add(iterator.next());
                if (currentBatch.size() == 99) {
                    addTracksToPlaylist(userId, playlist.getId(), currentBatch, token);
                    currentBatch.clear();
                }
            }
        } else {
            addTracksToPlaylist(userId, playlist.getId(), trackUris, token);
        }

        return playlist.getExternalUrls().get("spotify");

    }

    private void addTracksToPlaylist(String userId, String playlistId, List<String> uris, String token) throws UnirestException, JsonProcessingException {

        ObjectMapper objectMapper = new ObjectMapper();

        String jsonBody = objectMapper.writeValueAsString(uris);



        HttpResponse<JsonNode> httpResponse = Unirest.post("https://api.spotify.com/v1/users/" + userId + "/playlists/" + playlistId + "/tracks")
                .header("accept", "application/json")
                .header("Authorization", "Bearer " + token)
                .body(jsonBody)
                .asJson();

        System.out.println(httpResponse.getBody());
    }

    private int calcSongsPerArtist(int artists) {
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

}
