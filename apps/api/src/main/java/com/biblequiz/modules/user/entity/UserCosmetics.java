package com.biblequiz.modules.user.entity;

import com.biblequiz.shared.converter.JsonListConverter;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "user_cosmetics")
public class UserCosmetics {

    @Id
    @Column(name = "user_id", length = 36)
    private String userId;

    @Convert(converter = JsonListConverter.class)
    @Column(name = "unlocked_frames", nullable = false, columnDefinition = "JSON")
    private List<String> unlockedFrames = new ArrayList<>(List.of("frame_tier1"));

    @Column(name = "active_frame", nullable = false, length = 50)
    private String activeFrame = "frame_tier1";

    @Convert(converter = JsonListConverter.class)
    @Column(name = "unlocked_themes", nullable = false, columnDefinition = "JSON")
    private List<String> unlockedThemes = new ArrayList<>(List.of("theme_default"));

    @Column(name = "active_theme", nullable = false, length = 50)
    private String activeTheme = "theme_default";

    public UserCosmetics() {}

    public UserCosmetics(String userId) {
        this.userId = userId;
    }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public List<String> getUnlockedFrames() { return unlockedFrames; }
    public void setUnlockedFrames(List<String> unlockedFrames) { this.unlockedFrames = unlockedFrames; }

    public String getActiveFrame() { return activeFrame; }
    public void setActiveFrame(String activeFrame) { this.activeFrame = activeFrame; }

    public List<String> getUnlockedThemes() { return unlockedThemes; }
    public void setUnlockedThemes(List<String> unlockedThemes) { this.unlockedThemes = unlockedThemes; }

    public String getActiveTheme() { return activeTheme; }
    public void setActiveTheme(String activeTheme) { this.activeTheme = activeTheme; }
}
