import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from '../ErrorBoundary'

// A component that throws an error on demand
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div data-testid="child-content">Hello World</div>
}

// Suppress console.error for expected error boundary logs
const originalConsoleError = console.error
beforeEach(() => {
  console.error = vi.fn()
  vi.restoreAllMocks()
  // Mock fetch globally for logErrorToService
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response())
})

afterEach(() => {
  console.error = originalConsoleError
})

import { afterEach } from 'vitest'

describe('ErrorBoundary', () => {
  it('renders children normally when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('catches error and renders default fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument()
    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument()
  })

  it('displays error title text in fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Oops! Có lỗi xảy ra')).toBeInTheDocument()
  })

  it('renders retry button with correct data-testid', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    const retryBtn = screen.getByTestId('error-boundary-retry-btn')
    expect(retryBtn).toBeInTheDocument()
    expect(retryBtn).toHaveTextContent('Thử lại')
  })

  it('clicking retry resets error and re-renders children', () => {
    // We need a component that can toggle throwing
    let shouldThrow = true
    function ConditionalThrow() {
      if (shouldThrow) {
        throw new Error('Test error')
      }
      return <div data-testid="child-content">Recovered</div>
    }

    render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>
    )

    // Should be in error state
    expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument()

    // Stop throwing before retry
    shouldThrow = false

    // Click retry
    fireEvent.click(screen.getByTestId('error-boundary-retry-btn'))

    // Should re-render children successfully
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
    expect(screen.getByText('Recovered')).toBeInTheDocument()
    expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument()
  })

  it('renders custom fallback prop instead of default', () => {
    const customFallback = <div data-testid="custom-fallback">Custom Error UI</div>

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
    expect(screen.getByText('Custom Error UI')).toBeInTheDocument()
    expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument()
  })

  it('logs error via fetch to /api/errors', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/errors',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Test error message'),
      })
    )
  })

  it('shows help text in fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(
      screen.getByText('Nếu lỗi vẫn tiếp tục, vui lòng liên hệ hỗ trợ.')
    ).toBeInTheDocument()
  })

  it('shows description text about trying again or reloading', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(
      screen.getByText(/Ứng dụng gặp phải lỗi không mong muốn/)
    ).toBeInTheDocument()
  })

  it('renders reload button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Tải lại trang')).toBeInTheDocument()
  })
})
