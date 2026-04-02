package com.biblequiz.api;

import com.biblequiz.modules.group.entity.ChurchGroup;
import com.biblequiz.modules.group.repository.ChurchGroupRepository;
import com.biblequiz.modules.user.entity.User;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminGroupControllerTest {

    @Mock private ChurchGroupRepository groupRepository;
    @InjectMocks private AdminGroupController controller;

    private ChurchGroup testGroup;
    private Authentication mockAuth;

    @BeforeEach
    void setUp() {
        User leader = new User(); leader.setId("l1"); leader.setName("Leader");
        testGroup = new ChurchGroup();
        testGroup.setId("g1");
        testGroup.setName("Test Group");
        testGroup.setGroupCode("ABC123");
        testGroup.setMemberCount(15);
        testGroup.setMaxMembers(200);
        testGroup.setIsPublic(true);
        testGroup.setIsLocked(false);
        testGroup.setLeader(leader);

        mockAuth = mock(Authentication.class);
        lenient().when(mockAuth.getName()).thenReturn("admin@test.com");
    }

    @Test
    void listGroups_returnsList() {
        when(groupRepository.findAll()).thenReturn(List.of(testGroup));
        var res = controller.listGroups();
        assertEquals(200, res.getStatusCode().value());
    }

    @Test
    void getGroup_found() {
        when(groupRepository.findById("g1")).thenReturn(Optional.of(testGroup));
        var res = controller.getGroup("g1");
        assertEquals(200, res.getStatusCode().value());
    }

    @Test
    void lockGroup_success() {
        when(groupRepository.findById("g1")).thenReturn(Optional.of(testGroup));
        when(groupRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var res = controller.lockGroup("g1", Map.of("reason", "Vi phạm nội quy cộng đồng"), mockAuth);
        assertEquals(200, res.getStatusCode().value());
        assertTrue(testGroup.getIsLocked());
    }

    @Test
    void lockGroup_shortReason_rejected() {
        var res = controller.lockGroup("g1", Map.of("reason", "short"), mockAuth);
        assertEquals(400, res.getStatusCode().value());
    }

    @Test
    void unlockGroup_success() {
        testGroup.setIsLocked(true);
        when(groupRepository.findById("g1")).thenReturn(Optional.of(testGroup));
        when(groupRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var res = controller.unlockGroup("g1", mockAuth);
        assertEquals(200, res.getStatusCode().value());
        assertFalse(testGroup.getIsLocked());
    }

    @Test
    void deleteGroup_success() {
        when(groupRepository.findById("g1")).thenReturn(Optional.of(testGroup));
        when(groupRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var res = controller.deleteGroup("g1", null, mockAuth);
        assertEquals(200, res.getStatusCode().value());
        assertNotNull(testGroup.getDeletedAt());
    }

    @Test
    void getGroup_notFound() {
        when(groupRepository.findById("x")).thenReturn(Optional.empty());
        var res = controller.getGroup("x");
        assertEquals(404, res.getStatusCode().value());
    }
}
