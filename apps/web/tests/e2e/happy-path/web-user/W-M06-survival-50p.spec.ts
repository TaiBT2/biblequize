/**
 * W-M06 — Survival mode (BATTLE_ROYALE) full game with 1 host + 50 players.
 *
 * Spec ref: SPEC_MULTIPLAYER §3.2 (Battle Royale / "Sinh tồn"), §4 (STOMP).
 * Scenario: a Quản trò (host, hostPlaysGame=false) runs a 50-player survival
 * room end-to-end over STOMP — lobby → ready → start → elimination rounds →
 * QUIZ_END. Verifies PLAYER_ELIMINATED / BATTLE_ROYALE_UPDATE / final ranks.
 *
 * The 50-player cap relies on the maxPlayers limit raised 20→100 (DECISIONS.md
 * 2026-05-22).
 */
import { test, expect } from '@playwright/test'
import {
  provisionUsers,
  createRoom,
  joinRoom,
  startRoom,
  getRoom,
  getLeaderboard,
} from '../../helpers/multiplayer-api'
import { StompTestClient } from '../../helpers/stomp-client'

const PLAYER_COUNT = 50

test.describe('W-M06 Survival 50 players — L2 Happy Path @happy-path @multiplayer @survival @websocket', () => {

  test('W-M06-L2-013: 1 host + 50 players — full Battle Royale elimination game @write @serial', async () => {
    test.setTimeout(240_000)

    const clients: StompTestClient[] = []
    let observer: StompTestClient | null = null

    try {
      // ============================================================
      // SECTION 1: SETUP — provision 1 host + 50 player accounts
      // ============================================================
      const [host] = await provisionUsers('e2e-survival-host-', 1)
      const players = await provisionUsers('e2e-survivor-', PLAYER_COUNT)

      // ============================================================
      // SECTION 2: ACTIONS
      // ============================================================
      // 2a. Host (Quản trò) creates a survival room sized for 50 players.
      const room = await createRoom(host.token, {
        roomName: 'E2E Sinh tồn 50 người',
        mode: 'BATTLE_ROYALE',
        maxPlayers: PLAYER_COUNT,
        questionCount: 20,
        timePerQuestion: 8,
        hostPlaysGame: false,
      })
      expect(room.mode).toBe('BATTLE_ROYALE')

      // 2b. All 50 players join by code (sequential — avoids the room-full
      //     check racing with the denormalised currentPlayers counter).
      for (const player of players) {
        const res = await joinRoom(player.token, room.roomCode)
        expect(res.ok, `join failed for ${player.email}`).toBe(true)
      }
      const lobby = await getRoom(host.token, room.id)
      expect(lobby.players.length).toBe(PLAYER_COUNT)

      // 2c. Open a STOMP connection per player + one host observer.
      observer = new StompTestClient(host.token, room.id)
      await observer.connect()
      for (const player of players) {
        clients.push(new StompTestClient(player.token, room.id))
      }
      await Promise.all(clients.map((c) => c.connect()))

      // 2d. Each player auto-answers every round. The answer index is a
      //     hash of (player, question) so it stays ~uniformly spread over
      //     the 4 options even within the surviving subset — each round
      //     eliminates the ~75% who missed, driving 50 → ~12 → ~3 → 1.
      const answerFor = (idx: number, questionIndex: number): number => {
        let h = (idx + 1) * 2654435761 + (questionIndex + 1) * 974711
        h = (h ^ (h >>> 13)) >>> 0
        return h % 4
      }
      clients.forEach((client, idx) => {
        client.onEvent((evt) => {
          if (evt.type !== 'QUESTION_START') return
          const questionIndex = evt.data.questionIndex as number
          client.send(`/app/room/${room.id}/answer`, {
            questionIndex,
            answerIndex: answerFor(idx, questionIndex),
            reactionTimeMs: 400 + idx,
          })
        })
      })

      // 2e. Every player marks ready, then wait until the server agrees.
      for (const client of clients) {
        client.send(`/app/room/${room.id}/ready`, {})
      }
      await expect
        .poll(
          async () => {
            const r = await getRoom(host.token, room.id)
            return r.players.filter((p) => p.isReady).length
          },
          { timeout: 30_000, intervals: [500] },
        )
        .toBe(PLAYER_COUNT)

      // 2f. Host starts the game; runQuiz drives elimination rounds async.
      const startRes = await startRoom(host.token, room.id)
      expect(startRes.ok, 'host start failed').toBe(true)

      // ============================================================
      // SECTION 3: UI ASSERTIONS — N/A (STOMP gameplay test)
      // ============================================================

      // ============================================================
      // SECTION 4: GAMEPLAY VERIFICATION
      // ============================================================
      const quizEnd = await observer.waitForEvent('QUIZ_END', 180_000)
      expect(quizEnd.data.finalResults).toBeTruthy()

      // Elimination mechanic fired across rounds — last-man-standing should
      // knock out the overwhelming majority of the 50-player field.
      const eliminatedCount = observer.count('PLAYER_ELIMINATED')
      expect(eliminatedCount).toBeGreaterThanOrEqual(40)
      expect(eliminatedCount).toBeLessThan(PLAYER_COUNT)

      // Battle Royale counter broadcast and the active field shrank.
      const brUpdates = observer.events.filter((e) => e.type === 'BATTLE_ROYALE_UPDATE')
      expect(brUpdates.length).toBeGreaterThan(0)
      const lastActive = brUpdates[brUpdates.length - 1].data.activeCount as number
      expect(lastActive).toBeLessThan(PLAYER_COUNT)

      // Every player ended up ranked; rank 1 is the lone survivor / winner.
      const leaderboard = await getLeaderboard(host.token, room.id)
      expect(leaderboard.length).toBe(PLAYER_COUNT)
      const ranks = leaderboard.map((e) => e.rank ?? e.finalRank)
      expect(ranks).toContain(1)

      // Survivors + eliminated account for the whole field.
      expect(PLAYER_COUNT - eliminatedCount).toBeGreaterThanOrEqual(1)

      // eslint-disable-next-line no-console
      console.log(
        `[survival-50p] rounds=${observer.count('QUESTION_START')} ` +
          `eliminated=${eliminatedCount} survivors=${PLAYER_COUNT - eliminatedCount}`,
      )
    } finally {
      // ============================================================
      // CLEANUP — close every STOMP connection
      // ============================================================
      await Promise.all(clients.map((c) => c.disconnect()))
      if (observer) await observer.disconnect()
    }
  })

})
