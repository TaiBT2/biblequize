package com.biblequiz.modules.share.repository;

import com.biblequiz.modules.share.entity.ShareCard;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShareCardRepository extends JpaRepository<ShareCard, String> {

    Optional<ShareCard> findByTypeAndReferenceIdAndUserId(ShareCard.ShareCardType type, String referenceId, String userId);

    List<ShareCard> findByUserId(String userId);

    @Modifying
    @Transactional
    @Query("UPDATE ShareCard s SET s.viewCount = s.viewCount + 1 WHERE s.id = :id")
    void incrementViewCount(@Param("id") String id);
}
