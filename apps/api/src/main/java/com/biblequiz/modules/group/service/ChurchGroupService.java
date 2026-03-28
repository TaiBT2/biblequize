package com.biblequiz.modules.group.service;

import com.biblequiz.modules.group.entity.ChurchGroup;
import com.biblequiz.modules.group.entity.GroupMember;
import com.biblequiz.modules.group.entity.GroupQuizSet;
import com.biblequiz.modules.group.repository.ChurchGroupRepository;
import com.biblequiz.modules.group.repository.GroupAnnouncementRepository;
import com.biblequiz.modules.group.repository.GroupMemberRepository;
import com.biblequiz.modules.group.repository.GroupQuizSetRepository;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChurchGroupService {

    @Autowired
    private ChurchGroupRepository churchGroupRepository;

    @Autowired
    private GroupMemberRepository groupMemberRepository;

    @Autowired
    private GroupAnnouncementRepository groupAnnouncementRepository;

    @Autowired
    private GroupQuizSetRepository groupQuizSetRepository;

    @Autowired
    private UserRepository userRepository;

    private static final String CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int CODE_LENGTH = 6;
    private final SecureRandom random = new SecureRandom();

    public Map<String, Object> createGroup(String name, String description, User leader) {
        String code = generateGroupCode();

        ChurchGroup group = new ChurchGroup();
        group.setId(UUID.randomUUID().toString());
        group.setName(name);
        group.setGroupCode(code);
        group.setDescription(description);
        group.setLeader(leader);
        group.setMemberCount(1);
        churchGroupRepository.save(group);

        GroupMember leaderMember = new GroupMember();
        leaderMember.setId(UUID.randomUUID().toString());
        leaderMember.setGroup(group);
        leaderMember.setUser(leader);
        leaderMember.setRole(GroupMember.GroupRole.LEADER);
        groupMemberRepository.save(leaderMember);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", group.getId());
        result.put("name", group.getName());
        result.put("code", group.getGroupCode());
        result.put("memberCount", group.getMemberCount());
        return result;
    }

    public Map<String, Object> joinGroup(String groupCode, User user) {
        ChurchGroup group = churchGroupRepository.findByGroupCode(groupCode.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Nhom khong ton tai"));

        if (group.isFull()) {
            throw new RuntimeException("Nhom da day");
        }

        Optional<GroupMember> existing = groupMemberRepository.findByGroupIdAndUserId(group.getId(), user.getId());
        if (existing.isPresent()) {
            throw new RuntimeException("Ban da la thanh vien cua nhom nay");
        }

        GroupMember member = new GroupMember();
        member.setId(UUID.randomUUID().toString());
        member.setGroup(group);
        member.setUser(user);
        member.setRole(GroupMember.GroupRole.MEMBER);
        groupMemberRepository.save(member);

        group.setMemberCount(group.getMemberCount() + 1);
        churchGroupRepository.save(group);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("groupId", group.getId());
        result.put("role", member.getRole().name());
        return result;
    }

    public Map<String, Object> leaveGroup(String groupId, User user) {
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, user.getId())
                .orElseThrow(() -> new RuntimeException("Ban khong phai thanh vien cua nhom"));

        if (member.getRole() == GroupMember.GroupRole.LEADER) {
            throw new RuntimeException("LEADER_CANNOT_LEAVE");
        }

        groupMemberRepository.delete(member);

        ChurchGroup group = churchGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Nhom khong ton tai"));
        group.setMemberCount(Math.max(0, group.getMemberCount() - 1));
        churchGroupRepository.save(group);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        return result;
    }

    public Map<String, Object> getGroupDetails(String groupId) {
        ChurchGroup group = churchGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Nhom khong ton tai"));

        List<GroupMember> members = groupMemberRepository.findByGroupId(groupId);

        List<Map<String, Object>> memberList = members.stream().map(m -> {
            Map<String, Object> memberMap = new LinkedHashMap<>();
            memberMap.put("id", m.getUser().getId());
            memberMap.put("name", m.getUser().getName());
            memberMap.put("avatarUrl", m.getUser().getAvatarUrl());
            memberMap.put("role", m.getRole().name());
            memberMap.put("joinedAt", m.getJoinedAt());
            return memberMap;
        }).collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", group.getId());
        result.put("name", group.getName());
        result.put("code", group.getGroupCode());
        result.put("description", group.getDescription());
        result.put("avatarUrl", group.getAvatarUrl());
        result.put("isPublic", group.getIsPublic());
        result.put("maxMembers", group.getMaxMembers());
        result.put("memberCount", group.getMemberCount());
        result.put("leaderId", group.getLeader().getId());
        result.put("createdAt", group.getCreatedAt());
        result.put("members", memberList);
        return result;
    }

    public List<Map<String, Object>> getLeaderboard(String groupId, String period) {
        List<GroupMember> members = groupMemberRepository.findByGroupId(groupId);

        return members.stream().map(m -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("userId", m.getUser().getId());
            entry.put("name", m.getUser().getName());
            entry.put("avatarUrl", m.getUser().getAvatarUrl());
            entry.put("role", m.getRole().name());
            entry.put("period", period);
            // Placeholder - will need UserDailyProgress integration
            entry.put("score", 0);
            entry.put("questionsAnswered", 0);
            return entry;
        }).collect(Collectors.toList());
    }

    public Map<String, Object> getAnalytics(String groupId, String requesterId) {
        GroupMember requester = groupMemberRepository.findByGroupIdAndUserId(groupId, requesterId)
                .orElseThrow(() -> new RuntimeException("Ban khong phai thanh vien cua nhom"));

        if (requester.getRole() != GroupMember.GroupRole.LEADER && requester.getRole() != GroupMember.GroupRole.MOD) {
            throw new RuntimeException("Khong co quyen truy cap");
        }

        int totalMembers = groupMemberRepository.countByGroupId(groupId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalMembers", totalMembers);
        // Placeholder - will need integration with activity tracking
        result.put("activeToday", 0);
        return result;
    }

    public Map<String, Object> createQuizSet(String groupId, String userId, String name, List<String> questionIds) {
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new RuntimeException("Ban khong phai thanh vien cua nhom"));

        if (member.getRole() != GroupMember.GroupRole.LEADER && member.getRole() != GroupMember.GroupRole.MOD) {
            throw new RuntimeException("Khong co quyen tao quiz set");
        }

        ChurchGroup group = churchGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Nhom khong ton tai"));

        GroupQuizSet quizSet = new GroupQuizSet();
        quizSet.setId(UUID.randomUUID().toString());
        quizSet.setGroup(group);
        quizSet.setCreatedBy(member.getUser());
        quizSet.setName(name);
        quizSet.setQuestionIds(questionIds);
        groupQuizSetRepository.save(quizSet);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", quizSet.getId());
        result.put("name", quizSet.getName());
        result.put("questionIds", questionIds);
        result.put("createdAt", quizSet.getCreatedAt());
        return result;
    }

    private String generateGroupCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                sb.append(CODE_CHARS.charAt(random.nextInt(CODE_CHARS.length())));
            }
            code = sb.toString();
        } while (churchGroupRepository.findByGroupCode(code).isPresent());
        return code;
    }
}
