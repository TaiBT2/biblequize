import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { LoginScreen } from './LoginScreen'

// Mock auth store
const mockLogin = jest.fn()
jest.mock('../../stores/authStore', () => ({
  useAuthStore: () => ({ login: mockLogin }),
}))

// Mock API
jest.mock('../../api/client', () => ({
  api: {
    post: jest.fn(),
  },
}))

// Mock daily verse
jest.mock('../../data/verses', () => ({
  getDailyVerse: () => ({ text: 'Test verse', ref: 'John 3:16' }),
}))

// Mock Google config
jest.mock('../../config/google', () => ({
  GOOGLE_ENABLED: false,
  GOOGLE_WEB_CLIENT_ID: '',
}))

import { api } from '../../api/client'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('LoginScreen', () => {
  test('renders logo and title', () => {
    const { getByText } = render(<LoginScreen />)
    expect(getByText('BibleQuiz')).toBeTruthy()
    expect(getByText('✝')).toBeTruthy()
  })

  test('renders daily verse', () => {
    const { getByText } = render(<LoginScreen />)
    expect(getByText(/"Test verse"/)).toBeTruthy()
    expect(getByText(/John 3:16/)).toBeTruthy()
  })

  test('renders email and password inputs', () => {
    const { getByPlaceholderText } = render(<LoginScreen />)
    expect(getByPlaceholderText('Email')).toBeTruthy()
    expect(getByPlaceholderText('Mật khẩu')).toBeTruthy()
  })

  test('renders login button', () => {
    const { getByText } = render(<LoginScreen />)
    expect(getByText('Đăng nhập')).toBeTruthy()
  })

  test('shows error when email is empty', () => {
    const { getByText } = render(<LoginScreen />)
    fireEvent.press(getByText('Đăng nhập'))
    expect(getByText('Vui lòng nhập email và mật khẩu')).toBeTruthy()
  })

  test('shows error when password is empty', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />)
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@test.com')
    fireEvent.press(getByText('Đăng nhập'))
    expect(getByText('Vui lòng nhập email và mật khẩu')).toBeTruthy()
  })

  test('calls API on valid login', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: {
        accessToken: 'token',
        refreshToken: 'refresh',
        name: 'Test',
        email: 'test@test.com',
        role: 'USER',
      },
    })

    const { getByPlaceholderText, getByText } = render(<LoginScreen />)
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@test.com')
    fireEvent.changeText(getByPlaceholderText('Mật khẩu'), 'password123')
    fireEvent.press(getByText('Đăng nhập'))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/auth/mobile/login', {
        email: 'test@test.com',
        password: 'password123',
      })
    })
  })

  test('calls login store on successful API response', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: {
        accessToken: 'tok',
        refreshToken: 'ref',
        name: 'User',
        email: 'u@test.com',
        role: 'USER',
      },
    })

    const { getByPlaceholderText, getByText } = render(<LoginScreen />)
    fireEvent.changeText(getByPlaceholderText('Email'), 'u@test.com')
    fireEvent.changeText(getByPlaceholderText('Mật khẩu'), 'pass')
    fireEvent.press(getByText('Đăng nhập'))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: 'tok',
          refreshToken: 'ref',
          name: 'User',
          email: 'u@test.com',
        })
      )
    })
  })

  test('shows error on API failure', async () => {
    (api.post as jest.Mock).mockRejectedValueOnce({
      response: { data: { message: 'Sai mật khẩu' } },
    })

    const { getByPlaceholderText, getByText } = render(<LoginScreen />)
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@test.com')
    fireEvent.changeText(getByPlaceholderText('Mật khẩu'), 'wrong')
    fireEvent.press(getByText('Đăng nhập'))

    await waitFor(() => {
      expect(getByText('Sai mật khẩu')).toBeTruthy()
    })
  })

  test('toggles to register mode', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />)
    fireEvent.press(getByText('Chưa có tài khoản? Đăng ký'))
    expect(getByText('Đăng ký')).toBeTruthy()
    expect(getByPlaceholderText('Tên hiển thị')).toBeTruthy()
  })

  test('register mode requires name', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />)
    fireEvent.press(getByText('Chưa có tài khoản? Đăng ký'))
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@test.com')
    fireEvent.changeText(getByPlaceholderText('Mật khẩu'), 'pass')
    fireEvent.press(getByText('Đăng ký'))
    expect(getByText('Vui lòng nhập tên')).toBeTruthy()
  })

  test('does not show Google button when disabled', () => {
    const { queryByText } = render(<LoginScreen />)
    expect(queryByText('Đăng nhập với Google')).toBeNull()
  })
})
