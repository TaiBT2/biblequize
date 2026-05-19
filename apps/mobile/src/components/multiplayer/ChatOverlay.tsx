import React, { useEffect, useRef, useState } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native'
import { colors, typography, spacing, borderRadius } from '../../theme'

export interface ChatMessage {
  senderId?: string
  sender: string
  text: string
  /** Client-side timestamp khi nhận (BE không gửi). */
  receivedAt: number
}

interface Props {
  visible: boolean
  onClose: () => void
  messages: ChatMessage[]
  onSend: (text: string) => void
  myUsername?: string
}

const MAX_CHARS = 500

/**
 * Bottom-sheet modal chat overlay. Parent manages messages state + STOMP send
 * (extracted CHAT_MESSAGE events appended; onSend dispatches `/app/room/{id}/chat`).
 *
 * BE rate limit + 500 char clamp enforced server-side; client clamps preemptively.
 */
export default function ChatOverlay({ visible, onClose, messages, onSend, myUsername }: Props) {
  const [draft, setDraft] = useState('')
  const listRef = useRef<FlatList<ChatMessage>>(null)

  useEffect(() => {
    if (visible && messages.length > 0) {
      // Defer to next tick so layout settles before scroll
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50)
    }
  }, [visible, messages.length])

  const handleSend = () => {
    const text = draft.trim().slice(0, MAX_CHARS)
    if (!text) return
    onSend(text)
    setDraft('')
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.sheet}
      >
        <View style={s.handle} />
        <View style={s.headerRow}>
          <Text style={s.title}>Trò chuyện</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={s.closeText}>✕</Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          style={s.list}
          renderItem={({ item }) => {
            const isMe = !!myUsername && item.sender === myUsername
            return (
              <View style={[s.bubble, isMe && s.bubbleMe]}>
                {!isMe && <Text style={s.sender}>{item.sender}</Text>}
                <Text style={[s.text, isMe && s.textMe]}>{item.text}</Text>
              </View>
            )
          }}
          ListEmptyComponent={
            <Text style={s.empty}>Chưa có tin nhắn nào</Text>
          }
        />

        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={draft}
            onChangeText={(v) => setDraft(v.slice(0, MAX_CHARS))}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={colors.textMuted}
            maxLength={MAX_CHARS}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <Pressable onPress={handleSend} style={[s.sendBtn, !draft.trim() && s.sendBtnDisabled]}>
            <Text style={s.sendText}>Gửi</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    maxHeight: '70%',
  },
  handle: { width: 40, height: 4, backgroundColor: colors.textMuted, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  title: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.textPrimary },
  closeText: { fontSize: 22, color: colors.textMuted, paddingHorizontal: spacing.sm },
  list: { paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  bubble: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  bubbleMe: { backgroundColor: colors.gold, alignSelf: 'flex-end' },
  sender: { fontSize: typography.size.xs, color: colors.gold, fontWeight: typography.weight.bold, marginBottom: 2 },
  text: { fontSize: typography.size.sm, color: colors.textPrimary },
  textMe: { color: colors.onSecondary },
  empty: { fontSize: typography.size.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl },
  inputRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xl },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.size.sm,
  },
  sendBtn: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendText: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.onSecondary },
})
