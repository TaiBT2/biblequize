export default function EventsAdmin() {
  return (
    <div style={{ padding: '32px', fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: 'var(--hp-text)', margin: '0 0 6px' }}>
          Sự kiện
        </h2>
        <p style={{ color: 'var(--hp-muted)', fontSize: '.875rem' }}>Quản lý sự kiện đặc biệt và giải đấu.</p>
      </div>
      <div style={{
        background: 'var(--hp-card)', border: '1px solid rgba(212,168,67,.12)',
        borderRadius: '12px', padding: '48px 32px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🏟️</div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: 'var(--hp-text)', marginBottom: '8px' }}>
          Chưa có sự kiện nào
        </div>
        <p style={{ color: 'var(--hp-muted)', fontSize: '.875rem', marginBottom: '24px', maxWidth: '360px', margin: '0 auto 24px' }}>
          Tính năng quản lý sự kiện đang được phát triển.
        </p>
        <button
          type="button"
          style={{
            padding: '10px 24px', background: 'var(--hp-gold)',
            border: 'none', borderRadius: '8px',
            color: '#0A0A0E', fontFamily: "'Nunito', sans-serif",
            fontWeight: 800, fontSize: '.875rem', cursor: 'not-allowed', opacity: .6,
          }}
          disabled
        >
          Tạo sự kiện
        </button>
      </div>
    </div>
  )
}
