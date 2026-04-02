import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ExportCenter from '../ExportCenter'

describe('Export Center', () => {
  it('renders export cards', () => {
    render(<ExportCenter />)
    expect(screen.getByText('Câu hỏi')).toBeInTheDocument()
    expect(screen.getByText('Người dùng')).toBeInTheDocument()
    expect(screen.getByText('Bảng xếp hạng')).toBeInTheDocument()
    expect(screen.getByText('Nhóm')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
  })

  it('renders format buttons', () => {
    render(<ExportCenter />)
    expect(screen.getAllByText('CSV').length).toBeGreaterThan(0)
    expect(screen.getAllByText('JSON').length).toBeGreaterThan(0)
  })

  it('renders title', () => {
    render(<ExportCenter />)
    expect(screen.getByText('Export Center')).toBeInTheDocument()
  })
})
