package com.biblequiz.infrastructure.seed;

import com.biblequiz.modules.group.entity.ChurchGroup;
import com.biblequiz.modules.group.entity.GroupAnnouncement;
import com.biblequiz.modules.group.entity.GroupMember;
import com.biblequiz.modules.group.repository.ChurchGroupRepository;
import com.biblequiz.modules.group.repository.GroupAnnouncementRepository;
import com.biblequiz.modules.group.repository.GroupMemberRepository;
import com.biblequiz.modules.user.entity.User;
import com.biblequiz.modules.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Component
@Profile("!prod")
public class GroupSeeder {

    private static final Logger log = LoggerFactory.getLogger(GroupSeeder.class);
    @Autowired private UserRepository userRepository;
    @Autowired private ChurchGroupRepository groupRepository;
    @Autowired private GroupMemberRepository memberRepository;
    @Autowired private GroupAnnouncementRepository announcementRepository;

    public int seed() {
        if (groupRepository.count() > 0) {
            log.info("GroupSeeder: groups exist, skipping");
            return 0;
        }

        List<User> allTestUsers = userRepository.findAll().stream()
                .filter(u -> u.getEmail() != null && u.getEmail().endsWith("@biblequiz.test"))
                .filter(u -> !Boolean.TRUE.equals(u.getIsBanned()))
                .toList();

        // Use Mục Sư Minh and Chị Hương as leaders
        User leader1 = allTestUsers.stream().filter(u -> "mucsu.minh@biblequiz.test".equals(u.getEmail())).findFirst().orElse(null);
        User leader2 = allTestUsers.stream().filter(u -> "huong@biblequiz.test".equals(u.getEmail())).findFirst().orElse(null);
        List<User> leaders = new ArrayList<>();
        if (leader1 != null) leaders.add(leader1);
        if (leader2 != null) leaders.add(leader2);

        List<User> users = allTestUsers.stream()
                .filter(u -> !"ADMIN".equalsIgnoreCase(u.getRole()))
                .filter(u -> !leaders.contains(u))
                .toList();

        if (leaders.size() < 2 || users.size() < 5) {
            log.warn("GroupSeeder: not enough seeded users, skipping");
            return 0;
        }

        createGroup("Nhóm Thanh Niên Tin Lành", "TNT001", leaders.get(0), true, users.subList(0, Math.min(8, users.size())),
                new String[]{"Chào mừng các bạn mới! Hãy bắt đầu với Daily Challenge nhé", "Tuần này chúng ta ôn sách Sáng Thế Ký"});

        createGroup("Lớp Kinh Thánh Chúa Nhật", "LKT002", leaders.get(1), true, users.subList(3, Math.min(7, users.size())),
                new String[]{"Bài học tuần này: Các dụ ngôn của Chúa Giê-su"});

        createGroup("Nhóm Tế Bào Khu Vực 3", "NTB003", leaders.get(0), false, users.subList(5, Math.min(9, users.size())),
                new String[]{});

        createGroup("Nhóm Thiếu Nhi Giáo Xứ", "TNH004", leaders.get(1), true, users.subList(0, Math.min(12, users.size())),
                new String[]{"Giải đố Kinh Thánh tuần 42 đã mở!", "Cập nhật hạng hội viên mới"});

        createGroup("Nhóm Mới Thành Lập", "NML005", leaders.get(0), true, List.of(), new String[]{});

        log.info("GroupSeeder: created 5 groups with members + announcements");
        return 5;
    }

    private void createGroup(String name, String code, User leader, boolean isPublic, List<User> members, String[] announcements) {
        ChurchGroup g = new ChurchGroup();
        g.setId(UUID.randomUUID().toString());
        g.setName(name);
        g.setGroupCode(code);
        g.setDescription("Nhóm " + name + " — được tạo bởi test seeder");
        g.setLeader(leader);
        g.setIsPublic(isPublic);
        g.setMemberCount(members.size() + 1);
        g.setMaxMembers(200);
        groupRepository.save(g);

        // Leader as member
        saveMember(g, leader, "LEADER");
        for (User u : members) saveMember(g, u, "MEMBER");

        for (String text : announcements) {
            GroupAnnouncement a = new GroupAnnouncement();
            a.setId(UUID.randomUUID().toString());
            a.setGroup(g);
            a.setAuthor(leader);
            a.setContent(text);
            a.setCreatedAt(UserSeeder.randomRecent(14));
            announcementRepository.save(a);
        }
    }

    private void saveMember(ChurchGroup g, User u, String role) {
        GroupMember m = new GroupMember();
        m.setId(UUID.randomUUID().toString());
        m.setGroup(g);
        m.setUser(u);
        m.setRole(GroupMember.GroupRole.valueOf(role));
        m.setJoinedAt(UserSeeder.randomPast(7, 90));
        memberRepository.save(m);
    }

    public void clear() {
        announcementRepository.deleteAll();
        memberRepository.deleteAll();
        groupRepository.deleteAll();
        log.info("GroupSeeder: cleared");
    }
}
