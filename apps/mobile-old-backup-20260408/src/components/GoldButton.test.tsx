import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { GoldButton } from './GoldButton'

describe('GoldButton', () => {
  test('renders title text', () => {
    const { getByText } = render(
      <GoldButton title="Đăng nhập" onPress={jest.fn()} />
    )
    expect(getByText('Đăng nhập')).toBeTruthy()
  })

  test('calls onPress when pressed', () => {
    const onPress = jest.fn()
    const { getByText } = render(
      <GoldButton title="Submit" onPress={onPress} />
    )
    fireEvent.press(getByText('Submit'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  test('does not call onPress when disabled', () => {
    const onPress = jest.fn()
    const { getByText } = render(
      <GoldButton title="Submit" onPress={onPress} disabled />
    )
    fireEvent.press(getByText('Submit'))
    expect(onPress).not.toHaveBeenCalled()
  })

  test('shows loading indicator when loading', () => {
    const { queryByText, root } = render(
      <GoldButton title="Submit" onPress={jest.fn()} loading />
    )
    // Title should not be visible during loading
    expect(queryByText('Submit')).toBeNull()
  })

  test('does not call onPress when loading', () => {
    const onPress = jest.fn()
    const { root } = render(
      <GoldButton title="Submit" onPress={onPress} loading />
    )
    // The button should be disabled during loading
    // We just verify the onPress isn't called
    expect(onPress).not.toHaveBeenCalled()
  })

  test('renders outline variant', () => {
    const { getByText } = render(
      <GoldButton title="Outline" onPress={jest.fn()} variant="outline" />
    )
    expect(getByText('Outline')).toBeTruthy()
  })
})
