import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ConfigurationAdmin from '../Configuration'

describe('Configuration Admin', () => {
  it('renders config categories', () => {
    render(<ConfigurationAdmin />)
    expect(screen.getByText('Game')).toBeInTheDocument()
    expect(screen.getByText('Scoring')).toBeInTheDocument()
    expect(screen.getByText('AI')).toBeInTheDocument()
    expect(screen.getByText('Room')).toBeInTheDocument()
  })

  it('renders config keys', () => {
    render(<ConfigurationAdmin />)
    expect(screen.getByText('Năng lượng mỗi ngày')).toBeInTheDocument()
    expect(screen.getByText('Câu/ngày/admin')).toBeInTheDocument()
  })

  it('renders default values', () => {
    render(<ConfigurationAdmin />)
    const inputs = document.querySelectorAll('input')
    expect(inputs.length).toBeGreaterThan(5)
  })

  it('title renders', () => {
    render(<ConfigurationAdmin />)
    expect(screen.getByText('Cấu hình hệ thống')).toBeInTheDocument()
  })
})
