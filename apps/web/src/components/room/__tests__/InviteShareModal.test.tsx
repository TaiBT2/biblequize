import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InviteShareModal from '../InviteShareModal';

describe('InviteShareModal', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('does not render when closed', () => {
    const { container } = render(
      <InviteShareModal open={false} roomCode="1A6MZZ" onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders room code prominently when open', () => {
    render(<InviteShareModal open={true} roomCode="1A6MZZ" onClose={() => {}} />);
    expect(screen.getByText('1A6MZZ')).toBeInTheDocument();
    expect(screen.getByText('Mã phòng')).toBeInTheDocument();
  });

  it('renders QR code as svg', () => {
    const { container } = render(
      <InviteShareModal open={true} roomCode="1A6MZZ" onClose={() => {}} />
    );
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('copies code on Copy mã click', async () => {
    render(<InviteShareModal open={true} roomCode="1A6MZZ" onClose={() => {}} />);
    fireEvent.click(screen.getByText(/Copy mã/i));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('1A6MZZ');
  });

  it('copies join URL on Copy link click', () => {
    render(<InviteShareModal open={true} roomCode="1A6MZZ" onClose={() => {}} />);
    fireEvent.click(screen.getByText(/Copy link/i));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('/join?code=1A6MZZ')
    );
  });

  it('calls onClose on close button click', () => {
    const onClose = vi.fn();
    render(<InviteShareModal open={true} roomCode="1A6MZZ" onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Đóng'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(<InviteShareModal open={true} roomCode="1A6MZZ" onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on backdrop click', () => {
    const onClose = vi.fn();
    render(<InviteShareModal open={true} roomCode="1A6MZZ" onClose={onClose} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalled();
  });
});
