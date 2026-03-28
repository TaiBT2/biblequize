package com.biblequiz.modules.group.repository;

import com.biblequiz.modules.group.entity.GroupQuizSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupQuizSetRepository extends JpaRepository<GroupQuizSet, String> {

    List<GroupQuizSet> findByGroupId(String groupId);
}
