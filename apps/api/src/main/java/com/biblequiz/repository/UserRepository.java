package com.biblequiz.repository;

import com.biblequiz.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    
    Optional<User> findByEmail(String email);
    
    @Query("SELECT u FROM User u JOIN u.authIdentities ai WHERE ai.provider = :provider AND ai.providerUserId = :providerUserId")
    Optional<User> findByProviderAndProviderUserId(@Param("provider") String provider, @Param("providerUserId") String providerUserId);
    
    boolean existsByEmail(String email);
}
