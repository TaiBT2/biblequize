package com.biblequiz.modules.room.entity;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Sprint 4: verify Room.hostPlaysGame defaults to true (legacy mode) so existing
 * rooms / code paths that don't set the field keep their old behavior.
 */
class RoomEntityTest {

    @Test
    void hostPlaysGame_defaultsToTrue_forLegacyCompat() {
        Room room = new Room();
        assertThat(room.isHostPlaysGame()).isTrue();
    }

    @Test
    void hostPlaysGame_canBeSetFalse_forQuanTroMode() {
        Room room = new Room();
        room.setHostPlaysGame(false);
        assertThat(room.isHostPlaysGame()).isFalse();
    }
}
