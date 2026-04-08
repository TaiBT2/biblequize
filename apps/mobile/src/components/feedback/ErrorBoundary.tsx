import React, { Component, ErrorInfo } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { colors, typography, spacing } from '../../theme'

interface Props { children: React.ReactNode }
interface State { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>😵</Text>
          <Text style={styles.title}>Đã xảy ra lỗi</Text>
          <Text style={styles.message}>{this.state.error?.message ?? 'Unknown error'}</Text>
          <Pressable onPress={this.handleRetry} style={styles.button}>
            <Text style={styles.buttonText}>Thử lại</Text>
          </Pressable>
        </View>
      )
    }
    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  icon: { fontSize: 64, marginBottom: spacing.lg },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary },
  message: { fontSize: typography.size.sm, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.xl },
  button: { backgroundColor: colors.gold, borderRadius: 12, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  buttonText: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.onSecondary },
})
