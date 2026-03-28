import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '../Input'

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('renders label when provided', () => {
    render(<Input label="Email" />)
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('does not render label when not provided', () => {
    const { container } = render(<Input />)
    expect(container.querySelector('label')).toBeNull()
  })

  it('renders error message when provided', () => {
    render(<Input error="This field is required" />)
    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  it('applies error styling when error is present', () => {
    render(<Input error="Error" data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input.className).toContain('border-red-500')
  })

  it('does not show error styling when no error', () => {
    render(<Input data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input.className).not.toContain('border-red-500')
  })

  it('handles value changes', () => {
    const onChange = vi.fn()
    render(<Input onChange={onChange} placeholder="Type" />)
    fireEvent.change(screen.getByPlaceholderText('Type'), { target: { value: 'hello' } })
    expect(onChange).toHaveBeenCalled()
  })

  it('passes through HTML attributes', () => {
    render(<Input type="password" required data-testid="pass-input" />)
    const input = screen.getByTestId('pass-input')
    expect(input).toHaveAttribute('type', 'password')
    expect(input).toBeRequired()
  })

  it('is disabled when disabled prop is set', () => {
    render(<Input disabled data-testid="disabled-input" />)
    expect(screen.getByTestId('disabled-input')).toBeDisabled()
  })

  it('associates label with input via htmlFor', () => {
    render(<Input label="Username" id="username" />)
    const label = screen.getByText('Username')
    expect(label).toHaveAttribute('for', 'username')
  })
})
