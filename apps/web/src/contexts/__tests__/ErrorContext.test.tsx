import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { ErrorProvider, useError } from '../ErrorContext'

// Mock ErrorToast to simplify testing
vi.mock('../../components/ErrorToast', () => ({
  default: ({ message, type, onClose }: { message: string; type: string; onClose: () => void }) => (
    <div data-testid={`error-toast-${type}`}>
      <span>{message}</span>
      <button onClick={onClose} data-testid={`close-${message}`}>Close</button>
    </div>
  ),
}))

// Helper component to access context in tests
function TestConsumer({ onMount }: { onMount?: (ctx: ReturnType<typeof useError>) => void }) {
  const ctx = useError()
  React.useEffect(() => {
    onMount?.(ctx)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div>
      <button data-testid="show-error" onClick={() => ctx.showError('Test error')}>
        Show Error
      </button>
      <button data-testid="show-warning" onClick={() => ctx.showError('Test warning', 'warning')}>
        Show Warning
      </button>
      <button data-testid="show-info" onClick={() => ctx.showError('Test info', 'info')}>
        Show Info
      </button>
      <button data-testid="clear-all" onClick={() => ctx.clearErrors()}>
        Clear All
      </button>
    </div>
  )
}

describe('ErrorContext', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('showError() adds error to list', async () => {
    render(
      <ErrorProvider>
        <TestConsumer />
      </ErrorProvider>
    )

    await act(async () => {
      screen.getByTestId('show-error').click()
    })

    expect(screen.getByText('Test error')).toBeInTheDocument()
  })

  it('auto-removes error after 5 seconds', async () => {
    render(
      <ErrorProvider>
        <TestConsumer />
      </ErrorProvider>
    )

    await act(async () => {
      screen.getByTestId('show-error').click()
    })

    expect(screen.getByText('Test error')).toBeInTheDocument()

    // Advance past the 5 second timeout
    await act(async () => {
      vi.advanceTimersByTime(5100)
    })

    expect(screen.queryByText('Test error')).not.toBeInTheDocument()
  })

  it('clearErrors() removes all errors', async () => {
    render(
      <ErrorProvider>
        <TestConsumer />
      </ErrorProvider>
    )

    await act(async () => {
      screen.getByTestId('show-error').click()
    })
    await act(async () => {
      screen.getByTestId('show-warning').click()
    })

    expect(screen.getByText('Test error')).toBeInTheDocument()
    expect(screen.getByText('Test warning')).toBeInTheDocument()

    await act(async () => {
      screen.getByTestId('clear-all').click()
    })

    expect(screen.queryByText('Test error')).not.toBeInTheDocument()
    expect(screen.queryByText('Test warning')).not.toBeInTheDocument()
  })

  it('renders ErrorToast for each error', async () => {
    render(
      <ErrorProvider>
        <TestConsumer />
      </ErrorProvider>
    )

    await act(async () => {
      screen.getByTestId('show-error').click()
    })

    // ErrorToast mock renders with data-testid based on type
    expect(screen.getByTestId('error-toast-error')).toBeInTheDocument()
  })

  it('supports error, warning, and info types', async () => {
    render(
      <ErrorProvider>
        <TestConsumer />
      </ErrorProvider>
    )

    await act(async () => {
      screen.getByTestId('show-error').click()
    })
    await act(async () => {
      screen.getByTestId('show-warning').click()
    })
    await act(async () => {
      screen.getByTestId('show-info').click()
    })

    expect(screen.getByTestId('error-toast-error')).toBeInTheDocument()
    expect(screen.getByTestId('error-toast-warning')).toBeInTheDocument()
    expect(screen.getByTestId('error-toast-info')).toBeInTheDocument()
  })

  it('displays multiple errors simultaneously', async () => {
    render(
      <ErrorProvider>
        <TestConsumer />
      </ErrorProvider>
    )

    // Use different Date.now for unique IDs
    await act(async () => {
      screen.getByTestId('show-error').click()
    })
    vi.advanceTimersByTime(10) // ensure different Date.now
    await act(async () => {
      screen.getByTestId('show-warning').click()
    })
    vi.advanceTimersByTime(10)
    await act(async () => {
      screen.getByTestId('show-info').click()
    })

    expect(screen.getByText('Test error')).toBeInTheDocument()
    expect(screen.getByText('Test warning')).toBeInTheDocument()
    expect(screen.getByText('Test info')).toBeInTheDocument()
  })

  it('onClose removes the specific error', async () => {
    render(
      <ErrorProvider>
        <TestConsumer />
      </ErrorProvider>
    )

    await act(async () => {
      screen.getByTestId('show-error').click()
    })
    vi.advanceTimersByTime(10)
    await act(async () => {
      screen.getByTestId('show-warning').click()
    })

    expect(screen.getByText('Test error')).toBeInTheDocument()
    expect(screen.getByText('Test warning')).toBeInTheDocument()

    // Close only the first error
    await act(async () => {
      screen.getByTestId('close-Test error').click()
    })

    expect(screen.queryByText('Test error')).not.toBeInTheDocument()
    expect(screen.getByText('Test warning')).toBeInTheDocument()
  })

  it('useError() throws when used outside Provider', () => {
    function BadComponent() {
      useError()
      return null
    }

    // Suppress React error boundary console output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<BadComponent />)
    }).toThrow('useError must be used within an ErrorProvider')

    consoleSpy.mockRestore()
  })
})
