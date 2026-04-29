package com.samp.auth.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import com.samp.auth.config.AuthProperties;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;

import org.springframework.stereotype.Service;

@Service
public class TotpService {

    private final GoogleAuthenticator googleAuthenticator;
    private final AuthProperties authProperties;

    public TotpService(AuthProperties authProperties) {
        this.googleAuthenticator = new GoogleAuthenticator();
        this.authProperties = authProperties;
    }

    public String generateSecret() {
        GoogleAuthenticatorKey key = googleAuthenticator.createCredentials();
        return key.getKey();
    }

    public boolean verifyCode(String secret, String code) {
        return googleAuthenticator.authorize(secret, Integer.parseInt(code));
    }

    public String provisioningUri(String email, String secret) {
        String issuer = urlEncode(authProperties.getTotpIssuer());
        String label = urlEncode(authProperties.getTotpIssuer() + ":" + email);
        return "otpauth://totp/" + label + "?secret=" + secret + "&issuer=" + issuer;
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
