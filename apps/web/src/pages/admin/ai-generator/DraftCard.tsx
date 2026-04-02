import React from 'react'
import { DraftQuestion, DraftStatus, CLAUDE_MODELS } from './types'

interface DraftCardProps {
  draft: DraftQuestion
  isEditing: boolean
  isSaving: boolean
  editData: Partial<DraftQuestion>
  onEdit: () => void
  onChange: (field: string, val: any) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onApprove: () => void
  onReject: () => void
  onRestore: () => void
  onRemove: () => void
}

const OPT_LABELS = ['A', 'B', 'C', 'D', 'E']
const DIFF_STYLE: Record<string, string> = { easy: 'bg-emerald-500/10 text-emerald-400', medium: 'bg-yellow-500/10 text-yellow-400', hard: 'bg-red-500/10 text-red-400' }
const DIFF_LABEL: Record<string, string> = { easy: 'Dễ', medium: 'TB', hard: 'Khó' }
const STATUS_STYLE: Record<DraftStatus, string> = { pending: 'bg-yellow-500/10 text-yellow-400', approved: 'bg-emerald-500/10 text-emerald-400', rejected: 'bg-white/5 text-[#d5c4af]/40' }
const STATUS_LABEL: Record<DraftStatus, string> = { pending: 'Chờ duyệt', approved: '✓ Đã lưu', rejected: 'Từ chối' }

export default function DraftCard({ draft, isEditing, isSaving, editData, onEdit, onChange, onSaveEdit, onCancelEdit, onApprove, onReject, onRestore, onRemove }: DraftCardProps) {
  const cur = isEditing ? { ...draft, ...editData } as DraftQuestion : draft
  const opts = Array.isArray(cur.options) ? cur.options : []
  const isCorrect = (i: number) => Array.isArray(cur.correctAnswer) ? cur.correctAnswer.includes(i) : cur.correctAnswer === i

  return (
    <div className={`bg-[#1d1f29] rounded-lg p-5 border-2 transition-all duration-200 ${
      draft.status === 'approved' ? 'border-emerald-500/30 opacity-80' :
      draft.status === 'rejected' ? 'border-transparent opacity-50' :
      isEditing ? 'border-[#e8a832]/50 shadow-lg' : 'border-[#504535]/10 hover:border-[#504535]/30'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[draft.status]}`}>{STATUS_LABEL[draft.status]}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${DIFF_STYLE[cur.difficulty] || 'bg-white/5 text-[#d5c4af]/60'}`}>{DIFF_LABEL[cur.difficulty] || cur.difficulty}</span>
        <span className="text-xs text-[#d5c4af]/60 font-medium">
          {cur.book} {cur.chapter}{(cur.verseStart || cur.verseEnd) ? `:${cur.verseStart || '?'}–${cur.verseEnd || '?'}` : ''}
        </span>
        {draft.generatedBy && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#e8a832]/10 text-[#e8a832] border border-[#e8a832]/20">
            {CLAUDE_MODELS.find(m => m.id === draft.generatedBy)?.label ?? draft.generatedBy}
          </span>
        )}
        {draft.status !== 'approved' && (
          <button onClick={onRemove} className="ml-auto text-[#d5c4af]/40 hover:text-red-400 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* View mode */}
      {!isEditing && (
        <div className="space-y-3">
          <p className="text-[#e1e1ef] font-semibold text-sm leading-snug">{cur.content}</p>
          {opts.length > 0 && (
            <div className="space-y-1.5">
              {opts.map((opt, i) => (
                <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm border ${
                  isCorrect(i) ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-semibold' : 'bg-[#11131c] border-[#504535]/20 text-[#d5c4af]'
                }`}>
                  <span className={`w-5 h-5 rounded-full text-xs font-black flex items-center justify-center flex-shrink-0 ${
                    isCorrect(i) ? 'bg-[#e8a832] text-[#281900]' : 'bg-[#32343e] text-[#d5c4af]'
                  }`}>{OPT_LABELS[i]}</span>
                  <span className="flex-1">{opt}</span>
                </div>
              ))}
            </div>
          )}
          {cur.explanation && (
            <div className="px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
              <span className="font-bold">Giải thích: </span>{cur.explanation}
            </div>
          )}
        </div>
      )}

      {/* Edit mode */}
      {isEditing && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-[#d5c4af] uppercase tracking-wider mb-1.5">Câu hỏi</label>
            <textarea rows={2} value={cur.content} onChange={e => onChange('content', e.target.value)} className="form-input resize-none text-sm w-full" />
          </div>
          {opts.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-[#d5c4af] uppercase tracking-wider mb-1.5">Lựa chọn</label>
              {opts.map((opt, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center flex-shrink-0 ${
                    isCorrect(i) ? 'bg-[#e8a832] text-[#281900]' : 'bg-[#32343e] text-[#d5c4af]'
                  }`}>{OPT_LABELS[i]}</span>
                  <input type="text" value={opt} onChange={e => { const n = [...opts]; n[i] = e.target.value; onChange('options', n) }} className="form-input text-sm py-2 flex-1" />
                  <button onClick={() => onChange('correctAnswer', i)} className={`w-8 h-8 rounded-lg text-sm font-black transition-all flex-shrink-0 ${
                    isCorrect(i) ? 'bg-[#e8a832] text-[#281900]' : 'bg-[#32343e] text-[#d5c4af]/60 hover:bg-[#373943]'
                  }`}>✓</button>
                </div>
              ))}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-[#d5c4af] uppercase tracking-wider mb-1.5">Giải thích</label>
            <textarea rows={2} value={cur.explanation || ''} onChange={e => onChange('explanation', e.target.value)} className="form-input resize-none text-sm w-full" />
          </div>
          <div className="flex gap-2">
            <button onClick={onSaveEdit} className="flex-1 bg-[#e8a832] text-[#281900] text-sm font-bold py-2.5 rounded-xl hover:brightness-110 transition-colors">Lưu chỉnh sửa</button>
            <button onClick={onCancelEdit} className="px-5 text-sm font-bold text-[#d5c4af] bg-[#32343e] py-2.5 rounded-xl hover:bg-[#373943] transition-colors">Huỷ</button>
          </div>
        </div>
      )}

      {/* Save error */}
      {draft.saveError && (
        <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200">
          <p className="text-red-600 text-xs font-semibold leading-snug">{draft.saveError}</p>
        </div>
      )}

      {/* Actions */}
      {draft.status === 'pending' && !isEditing && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-[#eeeae0]">
          <button onClick={onApprove} disabled={isSaving}
            className="flex-1 bg-[#e8a832] text-[#281900] text-sm font-bold py-2.5 rounded-xl hover:brightness-110 transition-colors disabled:opacity-60">
            {isSaving ? 'Đang lưu...' : 'Lưu câu hỏi'}
          </button>
          <button onClick={onEdit} className="px-4 text-sm font-bold text-[#d5c4af] bg-[#32343e] py-2.5 rounded-xl hover:bg-[#373943] transition-colors">Sửa</button>
          <button onClick={onReject} className="w-10 flex items-center justify-center text-[#d5c4af]/60 bg-[#f0ece4] rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-colors" title="Từ chối">✕</button>
        </div>
      )}

      {draft.status === 'rejected' && (
        <div className="mt-3 pt-3 border-t border-[#504535]/20">
          <button onClick={onRestore} className="text-xs text-[#d5c4af]/60 hover:text-[#e8a832] transition-colors font-semibold">↩ Khôi phục</button>
        </div>
      )}

      {draft.status === 'approved' && (
        <div className="mt-3 pt-3 border-t border-emerald-200 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
          ✓ Đã lưu vào cơ sở dữ liệu
          {draft.approvedId && <span className="text-emerald-400 font-normal ml-1">#{draft.approvedId.slice(0, 8)}</span>}
        </div>
      )}
    </div>
  )
}
