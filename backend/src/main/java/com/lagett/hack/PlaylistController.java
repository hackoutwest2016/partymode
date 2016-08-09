package com.lagett.hack;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lagett.hack.pojo.AuthorizationCode;
import com.lagett.hack.pojo.Playlist;
import com.lagett.hack.pojo.Song;
import com.mashape.unirest.http.HttpResponse;
import com.mashape.unirest.http.JsonNode;
import com.mashape.unirest.http.Unirest;
import com.mashape.unirest.http.exceptions.UnirestException;
import com.wrapper.spotify.Api;
import com.wrapper.spotify.exceptions.WebApiException;
import com.wrapper.spotify.methods.ArtistSearchRequest;
import com.wrapper.spotify.models.Artist;
import com.wrapper.spotify.models.Page;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Created by per on 09/08/16.
 */
@RestController
public class PlaylistController {

    private static final String template = "Playlist, %s!";
    private final AtomicLong counter = new AtomicLong();

//    @RequestMapping("/redirect")
//    public AuthorizationCode redirect(@RequestParam(value="code") String code, @RequestParam(value="state", defaultValue = "plz") String state) throws UnirestException {
//
//        ObjectMapper mapper = new ObjectMapper();
//
//        System.out.println(code);
//        HttpResponse<JsonNode> jsonResponse = Unirest.post("https://accounts.spotify.com/api/token").
//                header("accept", "application/json")
//                .queryString("grant_type", "authentication_code")
//                .queryString("code", code)
//                .queryString("redirect_uri", "http://localhost:8080/redirect")
//                .asJson();
//
//        System.out.println(jsonResponse.toString());
//        System.out.println(jsonResponse.getBody().toString());
//
//        return new AuthorizationCode(jsonResponse.getBody().getObject().get("access_token").toString(), state);
//    }

    @RequestMapping("/songs")
    public Artist songs(@RequestParam(value = "token", defaultValue = "BQD_77Y44UBBH8x9UVy3-n3GM67Zg9AHNShrm0a9vnfHqxDd2Z0Ehc4s0H-zzAgSxcpBs899AmfmDKTa2Qfkp1TED6wdewyYlQymLmWyeuUhlg0g-v30caDjiM_s40F_LWTtYQMHedswaDyyg7bCiDgq2Fw2MEe8OVIa6W3db_T7C7_Lpxnvl4Vr7a5SnjqGcXNVEViS18hPKf1rs_INeprr4feZUGwxi4ll") String token) {
        Api api = Api.builder()
                .accessToken(token)
                .refreshToken("AQAuNMpZO-peDsAFcY25-HP7zu2L-xX1FITtLtV-Td_4Kv9BVUifjsxjSUOYq3jaqrbJULZFAOVB1NIFP_j0vVh1UauVZTR92tfi9wT0Ncoh9CIFNC1083Cr81gzWa2DPx0")
                .build();

        final ArtistSearchRequest request = api.searchArtists("kanye west").limit(1).build();

        Artist artist = null;
        try {
            final Page<Artist> artistSearchResult = request.get();
            final List<Artist> artists = artistSearchResult.getItems();
            artist = artists.get(0);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return artist;
    }

    private List<Artist> getArtist() {
        return null;
    }

    @RequestMapping("/playlist")
    public Playlist getPlaylist(@RequestParam(value = "token", defaultValue = "BQD_77Y44UBBH8x9UVy3-n3GM67Zg9AHNShrm0a9vnfHqxDd2Z0Ehc4s0H-zzAgSxcpBs899AmfmDKTa2Qfkp1TED6wdewyYlQymLmWyeuUhlg0g-v30caDjiM_s40F_LWTtYQMHedswaDyyg7bCiDgq2Fw2MEe8OVIa6W3db_T7C7_Lpxnvl4Vr7a5SnjqGcXNVEViS18hPKf1rs_INeprr4feZUGwxi4ll") String token) {
        return new Playlist("https://open.spotify.com/user/hannamaterne/playlist/7nLf3xNGvhPwkbuOUmHfaq");
    }
}
