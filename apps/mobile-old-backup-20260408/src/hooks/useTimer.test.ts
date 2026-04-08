import { renderHook, act } from '@testing-library/react-native'
import { useTimer } from './useTimer'

beforeEach(() => jest.useFakeTimers())
afterEach(() => jest.useRealTimers())

function advanceSeconds(n: number) {
  for (let i = 0; i < n; i++) {
    act(() => jest.advanceTimersByTime(1000))
  }
}

describe('useTimer', () => {
  test('initializes with totalTime', () => {
    const { result } = renderHook(() => useTimer({ totalTime: 30 }))
    expect(result.current.timeLeft).toBe(30)
    expect(result.current.isRunning).toBe(false)
  })

  test('autoStart starts counting', () => {
    const { result } = renderHook(() =>
      useTimer({ totalTime: 30, autoStart: true })
    )
    expect(result.current.isRunning).toBe(true)

    advanceSeconds(1)
    expect(result.current.timeLeft).toBe(29)
  })

  test('start/pause controls', () => {
    const { result } = renderHook(() => useTimer({ totalTime: 10 }))

    act(() => result.current.start())
    expect(result.current.isRunning).toBe(true)

    advanceSeconds(3)
    expect(result.current.timeLeft).toBe(7)

    act(() => result.current.pause())
    expect(result.current.isRunning).toBe(false)

    advanceSeconds(3)
    expect(result.current.timeLeft).toBe(7) // No change after pause
  })

  test('reset restores totalTime', () => {
    const { result } = renderHook(() =>
      useTimer({ totalTime: 10, autoStart: true })
    )

    advanceSeconds(5)
    expect(result.current.timeLeft).toBe(5)

    act(() => result.current.reset())
    expect(result.current.timeLeft).toBe(10)
    expect(result.current.isRunning).toBe(false)
  })

  test('calls onTimeout when reaches 0', () => {
    const onTimeout = jest.fn()
    const { result } = renderHook(() =>
      useTimer({ totalTime: 3, autoStart: true, onTimeout })
    )

    advanceSeconds(3)
    expect(result.current.timeLeft).toBe(0)
    expect(onTimeout).toHaveBeenCalledTimes(1)
    expect(result.current.isRunning).toBe(false)
  })

  test('does not go below 0', () => {
    const { result } = renderHook(() =>
      useTimer({ totalTime: 2, autoStart: true })
    )

    advanceSeconds(5)
    expect(result.current.timeLeft).toBe(0)
  })
})
