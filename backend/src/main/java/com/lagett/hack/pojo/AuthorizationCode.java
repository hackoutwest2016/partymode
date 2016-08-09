package com.lagett.hack.pojo;

/**
 * Created by per on 09/08/16.
 */
public class AuthorizationCode {

    private String code;
    private String state;

    public AuthorizationCode(String code, String state) {
        this.code = code;
        this.state = state;
    }

    public String getCode() {
        return code;
    }

    public String getState() {
        return state;
    }
}
