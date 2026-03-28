import React from 'react'
import { getApiBaseUrl } from '../api/config'

interface ShareCardProps {
  sessionId: string
  score: number
  correct: number
  total: number
  userName: string
  type?: 'session' | 'tier_up'
  referenceId?: string
}

const ShareCard: React.FC<ShareCardProps> = ({
  sessionId,
  score,
  correct,
  total,
  userName,
  type = 'session',
  referenceId,
}) => {
  const apiBase = getApiBaseUrl()
  const shareUrl =
    type === 'tier_up' && referenceId
      ? `${apiBase}/api/share/render/tier-up/${referenceId}`
      : `${apiBase}/api/share/render/session/${sessionId}`

  const shareText = `BibleQuiz - ${correct}/${total} câu đúng!`

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BibleQuiz',
          text: shareText,
          url: shareUrl,
        })
      } catch {
        // User cancelled or share failed — open in new tab
        window.open(shareUrl, '_blank')
      }
    } else {
      window.open(shareUrl, '_blank')
    }
  }

  const handleDownload = () => {
    window.open(shareUrl, '_blank')
  }

  // Determine star display
  const stars = Array.from({ length: total }, (_, i) => (i < correct ? '★' : '☆')).join(' ')

  // Score percentage for color
  const pct = total > 0 ? (correct / total) * 100 : 0
  const scoreColor = pct >= 80 ? '#22C55E' : pct >= 60 ? '#EAB308' : pct >= 40 ? '#F97316' : '#EF4444'

  return (
    <div>
      {/* Inline preview card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1A1730 0%, #0E0B1A 100%)',
          border: '1px solid rgba(212, 168, 67, 0.3)',
          borderRadius: '1rem',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          maxWidth: '360px',
          margin: '0 auto',
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '1.2rem',
            fontWeight: 900,
            color: '#D4A843',
            marginBottom: '0.5rem',
            letterSpacing: '0.1em',
          }}
        >
          ✝ BIBLEQUIZ
        </div>

        {/* Subtitle */}
        <div style={{ color: '#8B7E6A', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Thử thách hằng ngày
        </div>

        {/* Score */}
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '3.5rem',
            fontWeight: 900,
            color: scoreColor,
            textShadow: `0 0 20px ${scoreColor}66`,
            lineHeight: 1,
          }}
        >
          {correct}/{total}
        </div>
        <div style={{ color: '#8B7E6A', fontSize: '1rem', marginTop: '0.25rem', marginBottom: '1rem' }}>
          câu đúng
        </div>

        {/* Stars */}
        <div style={{ fontSize: '1.5rem', letterSpacing: '0.4rem', color: '#D4A843', marginBottom: '1rem' }}>
          {stars}
        </div>

        {userName && (
          <div style={{ color: '#F5F0E8', fontSize: '0.9rem', fontWeight: 700 }}>
            {userName}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center',
          marginTop: '1rem',
        }}
      >
        <button
          onClick={handleShare}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(212, 168, 67, 0.3)',
            background: 'linear-gradient(135deg, #D4A843, #B8860B)',
            color: '#0E0B1A',
            fontWeight: 800,
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Chia sẻ 📤
        </button>
        <button
          onClick={handleDownload}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(212, 168, 67, 0.3)',
            background: 'rgba(212, 168, 67, 0.08)',
            color: '#D4A843',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Tải xuống 📥
        </button>
      </div>
    </div>
  )
}

export default ShareCard
