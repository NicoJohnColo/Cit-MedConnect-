package com.appdevg4.CitMedConnect.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * Security Configuration for Cit-MedConnect Backend
 * Configures authentication, authorization, and CORS settings
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final CorsConfigurationSource corsConfigurationSource;

    /**
     * Constructor injection for CORS configuration
     */
    public SecurityConfig(CorsConfigurationSource corsConfigurationSource) {
        this.corsConfigurationSource = corsConfigurationSource;
    }

    /**
     * Password encoder bean for hashing passwords
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Security filter chain configuration
     * Configures CORS, CSRF, and endpoint permissions
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                // Allow public endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/notifications/user/**").permitAll()
                // Allow appointment and timeslot endpoints for testing
                .requestMatchers("/api/appointments/**").permitAll()
                .requestMatchers("/api/timeslots/**").permitAll()
                // Protect notification endpoints
                .requestMatchers("/api/notifications/broadcast/**").hasRole("STAFF")
                .anyRequest().authenticated()
            );
        return http.build();
    }
}