import { useState } from 'react'
import type { QuizSetFull } from '../../../api/quizSets'
import { COLOR, DARK_INPUT_STYLE } from './styles'

interface Props {
  quizSet: QuizSetFull
  onChange: (patch: Partial<QuizSetFull>) => void
  defaultOpen?: boolean
  defaultBook?: string
  defaultChapterFrom?: number
  defaultChapterTo?: number
  onScopeChange?: (s: { book: string; chapterFrom: number; chapterTo: number }) => void
}

const BIBLE_BOOKS = [
  'Sáng Thế Ký', 'Xuất Ê-díp-tô Ký', 'Lê-vi Ký', 'Dân-số Ký', 'Phục Truyền',
  'Giô-suê', 'Các Quan Xét', 'Ru-tơ', '1 Sa-mu-ên', '2 Sa-mu-ên',
  '1 Các Vua', '2 Các Vua', '1 Sử Ký', '2 Sử Ký', 'E-xơ-ra',
  'Nê-hê-mi', 'Ê-xơ-tê', 'Gióp', 'Thi-thiên', 'Châm Ngôn',
  'Truyền Đạo', 'Nhã Ca', 'Ê-sai', 'Giê-rê-mi', 'Ca Thương',
  'Ê-xê-chi-ên', 'Đa-ni-ên', 'Ô-sê', 'Giô-ên', 'A-mốt',
  'Áp-đia', 'Giô-na', 'Mi-chê', 'Na-hum', 'Ha-ba-cúc',
  'Sô-phô-ni', 'A-ghê', 'Xa-cha-ri', 'Ma-la-chi',
  'Ma-thi-ơ', 'Mác', 'Lu-ca', 'Giăng', 'Công Vụ',
  'Rô-ma', '1 Cô-rinh-tô', '2 Cô-rinh-tô', 'Ga-la-ti', 'Ê-phê-sô',
  'Phi-líp', 'Cô-lô-se', '1 Tê-sa-lô-ni-ca', '2 Tê-sa-lô-ni-ca',
  '1 Ti-mô-thê', '2 Ti-mô-thê', 'Tít', 'Phi-lê-môn', 'Hê-bơ-rơ',
  'Gia-cơ', '1 Phi-e-rơ', '2 Phi-e-rơ', '1 Giăng', '2 Giăng',
  '3 Giăng', 'Giu-đe', 'Khải Huyền',
]

export default function MetadataAccordion({
  quizSet, onChange, defaultOpen = true,
  defaultBook = 'Sáng Thế Ký', defaultChapterFrom = 1, defaultChapterTo = 1,
  onScopeChange,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const [book, setBook] = useState(defaultBook)
  const [chapterFrom, setChapterFrom] = useState(defaultChapterFrom)
  const [chapterTo, setChapterTo] = useState(defaultChapterTo)

  const emitScope = (b: string, cf: number, ct: number) => {
    onScopeChange?.({ book: b, chapterFrom: cf, chapterTo: Math.max(cf, ct) })
  }

  return (
    <div style={{
      background: 'rgba(50,52,64,0.25)',
      borderBottom: `1px solid ${COLOR.borderXSubtle}`,
      padding: '14px 24px',
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: open ? 10 : 0, cursor: 'pointer' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14, color: COLOR.textMuted }} aria-hidden>{open ? 'expand_more' : 'chevron_right'}</span>
        <span style={{ fontSize: 11, fontWeight: 500, color: COLOR.textMuted, letterSpacing: 0.6 }}>
          THÔNG TIN BỘ CÂU HỎI
        </span>
        <span style={{ color: COLOR.textDisabled, fontSize: 11, marginLeft: 4 }}>
          · {book} {chapterFrom}{chapterTo > chapterFrom ? `-${chapterTo}` : ''}
          {quizSet.coverScripture ? ` · ${quizSet.coverScripture}` : ''}
        </span>
      </div>

      {open && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr', gap: 12 }}>
          <input
            type="text"
            placeholder="Tên bộ câu hỏi *"
            value={quizSet.name || ''}
            onChange={e => onChange({ name: e.target.value })}
            style={DARK_INPUT_STYLE}
          />
          <div style={{ position: 'relative' }}>
            <select
              value={book}
              onChange={e => { setBook(e.target.value); emitScope(e.target.value, chapterFrom, chapterTo) }}
              style={{
                ...DARK_INPUT_STYLE,
                borderColor: COLOR.goldFocus,
                paddingRight: 30,
                appearance: 'none',
                cursor: 'pointer',
              }}
            >
              {BIBLE_BOOKS.map(b => <option key={b} value={b} style={{ background: COLOR.inputBg }}>{b}</option>)}
            </select>
            <span className="material-symbols-outlined" style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              fontSize: 13, color: COLOR.textDisabled, pointerEvents: 'none',
            }} aria-hidden>expand_more</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 5, alignItems: 'center' }}>
            <input
              type="number" min={1} value={chapterFrom}
              onChange={e => { const v = Math.max(1, +e.target.value || 1); setChapterFrom(v); emitScope(book, v, chapterTo) }}
              style={{ ...DARK_INPUT_STYLE, textAlign: 'center', padding: 9 }}
            />
            <span style={{ color: COLOR.textDisabled, fontSize: 11 }}>đến</span>
            <input
              type="number" min={chapterFrom} value={chapterTo}
              onChange={e => { const v = Math.max(chapterFrom, +e.target.value || chapterFrom); setChapterTo(v); emitScope(book, chapterFrom, v) }}
              style={{ ...DARK_INPUT_STYLE, textAlign: 'center', padding: 9 }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
