package com.biblequiz.modules.group.repository;

import com.biblequiz.modules.group.entity.GroupQuizSetMastery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupQuizSetMasteryRepository extends JpaRepository<GroupQuizSetMastery, String> {

    Optional<GroupQuizSetMastery> findByQuizSetIdAndUserId(String quizSetId, String userId);

    @Query("SELECT m FROM GroupQuizSetMastery m, GroupQuizSet s " +
           "WHERE m.quizSetId = s.id AND m.userId = :userId AND s.group.id = :groupId")
    List<GroupQuizSetMastery> findByUserIdAndGroupId(@Param("userId") String userId,
                                                      @Param("groupId") String groupId);
}
