package com.samp.auth.web;

import com.samp.auth.AuthModels.LoginRequest;
import com.samp.auth.AuthModels.LoginResponse;
import com.samp.auth.AuthModels.LogoutRequest;
import com.samp.auth.AuthModels.LogoutResponse;
import com.samp.auth.AuthModels.MfaVerifyRequest;
import com.samp.auth.AuthModels.RefreshRequest;
import com.samp.auth.AuthModels.RegisterRequest;
import com.samp.auth.AuthModels.RegisterResponse;
import com.samp.auth.AuthModels.TokenResponse;
import com.samp.auth.service.AuthService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public RegisterResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/mfa/verify")
    public TokenResponse verifyMfa(@Valid @RequestBody MfaVerifyRequest request) {
        return authService.verifyMfa(request);
    }

    @PostMapping("/refresh")
    public TokenResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request);
    }

    @PostMapping("/logout")
    public LogoutResponse logout(@Valid @RequestBody LogoutRequest request) {
        return authService.logout(request.refreshToken());
    }
}
