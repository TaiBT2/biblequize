import React from 'react'
import { Text } from 'react-native'
import { render } from '@testing-library/react-native'
import { GlassCard } from './GlassCard'

describe('GlassCard', () => {
  test('renders children', () => {
    const { getByText } = render(
      <GlassCard>
        <Text>Card content</Text>
      </GlassCard>
    )
    expect(getByText('Card content')).toBeTruthy()
  })

  test('accepts custom styles', () => {
    const { root } = render(
      <GlassCard style={{ marginTop: 10 }}>
        <Text>Styled card</Text>
      </GlassCard>
    )
    expect(root).toBeTruthy()
  })

  test('passes additional ViewProps', () => {
    const { getByTestId } = render(
      <GlassCard testID="test-card">
        <Text>Props test</Text>
      </GlassCard>
    )
    expect(getByTestId('test-card')).toBeTruthy()
  })
})
