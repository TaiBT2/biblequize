package com.biblequiz.modules.group.repository;

import com.biblequiz.modules.group.entity.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, String> {

    List<GroupMember> findByGroupId(String groupId);

    Optional<GroupMember> findByGroupIdAndUserId(String groupId, String userId);

    List<GroupMember> findByUserId(String userId);

    int countByGroupId(String groupId);
}
