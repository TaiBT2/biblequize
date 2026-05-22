import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Modal from '../Modal'

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        <p>body</p>
      </Modal>
    )
    expect(screen.queryByText('body')).not.toBeInTheDocument()
  })

  it('renders children when open', () => {
    render(
      <Modal isOpen onClose={() => {}}>
        <p>body</p>
      </Modal>
    )
    expect(screen.getByText('body')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes on Escape key', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen onClose={onClose}>
        <p>body</p>
      </Modal>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on backdrop click by default', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen onClose={onClose}>
        <p>body</p>
      </Modal>
    )
    fireEvent.click(screen.getByRole('presentation'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close on backdrop click when closeOnBackdropClick=false', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen onClose={onClose} closeOnBackdropClick={false}>
        <p>body</p>
      </Modal>
    )
    fireEvent.click(screen.getByRole('presentation'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('does not close when clicking inside the dialog', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen onClose={onClose}>
        <p>body</p>
      </Modal>
    )
    fireEvent.click(screen.getByText('body'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('close button triggers onClose', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen onClose={onClose}>
        <p>body</p>
      </Modal>
    )
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
