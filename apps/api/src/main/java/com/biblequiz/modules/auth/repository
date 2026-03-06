package com.biblequiz.repository;

import com.biblequiz.entity.AuthIdentity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AuthIdentityRepository extends JpaRepository<AuthIdentity, String> {
    
    Optional<AuthIdentity> findByProviderAndProviderUserId(String provider, String providerUserId);
    
    boolean existsByProviderAndProviderUserId(String provider, String providerUserId);
}
