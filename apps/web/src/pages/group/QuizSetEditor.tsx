// BL-AD-8 — Shared Quiz Set Editor (group + personal owner scopes).
// PQS-5: refactored to receive an injectable API adapter + routing prop so
// the same editor renders for /groups/:id/quiz-sets/:setId/edit (group) and
// /my-sets/:setId/edit (personal). Group route mounts via GroupQuizSetEditor
// wrapper; personal route mounts via PersonalQuizSetEditor (PQS-6).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type {
  AIGenerateForSetBody, AIGenerateForSetResponse, AIRewriteResponse,
  AddQuestionBody, CreateQuizSetBody, EditorQuestion, QuizSet, QuizSetFull,
} from '../../api/quizSets'
import EditorTopBar from './quizset-editor/EditorTopBar'
import MetadataAccordion from './quizset-editor/MetadataAccordion'
import QuestionSidebar from './quizset-editor/QuestionSidebar'
import QuestionEditor from './quizset-editor/QuestionEditor'
import AIGeneratePanel from './quizset-editor/AIGeneratePanel'
import AIRewriteModal from './quizset-editor/AIRewriteModal'
import PublishConfirmModal from './quizset-editor/PublishConfirmModal'
import { COLOR } from './quizset-editor/styles'
import { useAutoSave } from './quizset-editor/useAutoSave'
import { MIN_QUESTIONS_TO_PUBLISH } from './quizset-editor/validation'

type Mode = 'create' | 'edit'

export interface QuizSetEditorApi {
  createQuizSet: (body: CreateQuizSetBody) => Promise<QuizSet>
  updateQuizSet: (setId: string, body: Partial<CreateQuizSetBody>) => Promise<QuizSet>
  publishQuizSet: (setId: string) => Promise<QuizSet>
  getQuizSetFull: (setId: string) => Promise<QuizSetFull>
  addQuestion: (setId: string, body: AddQuestionBody) => Promise<{ question: EditorQuestion; totalQuestions: number }>
  updateQuestion: (setId: string, qid: string, body: Partial<AddQuestionBody>) => Promise<EditorQuestion>
  deleteQuestion: (setId: string, qid: string) => Promise<number>
  aiGenerateForSet: (setId: string, body: AIGenerateForSetBody) => Promise<AIGenerateForSetResponse>
  aiRewriteQuestion: (setId: string, qid: string, hint?: string) => Promise<AIRewriteResponse>
  getAIQuota: () => Promise<{ used: number; limit: number; remaining: number }>
}

interface Props {
  mode?: Mode
  setIdFromRoute?: string
  ownership: 'group' | 'personal'
  ownerName?: string
  backHref: string
  /** Where to navigate after a successful create (will append `${newId}/edit`). Trailing slash required. */
  editPathBase: string
  /** Where to navigate after publish (will append `${setId}`). Trailing slash required. */
  detailPathBase: string
  api: QuizSetEditorApi
  /** Toggle AI Generate + AI Rewrite UI. Defaults to true for group, false for personal. */
  aiEnabled?: boolean
}

export default function QuizSetEditor({
  mode: forcedMode, setIdFromRoute, ownership, ownerName, backHref,
  editPathBase, detailPathBase, api, aiEnabled: aiEnabledProp,
}: Props) {
  const navigate = useNavigate()
  const mode: Mode = forcedMode ?? (setIdFromRoute ? 'edit' : 'create')
  const aiEnabled = aiEnabledProp ?? (ownership === 'group')

  const [quizSet, setQuizSet] = useState<QuizSetFull | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const [, forceTick] = useState(0)

  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiQuota, setAiQuota] = useState({ used: 0, limit: 200, remaining: 200 })

  const [rewriteOpen, setRewriteOpen] = useState(false)
  const [rewriteBusy, setRewriteBusy] = useState(false)

  const [publishOpen, setPublishOpen] = useState(false)
  const [publishBusy, setPublishBusy] = useState(false)

  const [scope, setScope] = useState({ book: 'Sáng Thế Ký', chapterFrom: 1, chapterTo: 1 })
  const [topic, setTopic] = useState('')
  const dirtyMetaRef = useRef(false)

  useEffect(() => {
    const id = setInterval(() => forceTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Initial load: create flow auto-creates a DRAFT, then navigates to edit page.
  useEffect(() => {
    let cancelled = false
    setLoading(true); setLoadError(null)
    ;(async () => {
      try {
        if (mode === 'create' && !setIdFromRoute) {
          const created = await api.createQuizSet({ name: 'Bộ câu hỏi mới' })
          if (cancelled) return
          navigate(`${editPathBase}${created.id}/edit`, { replace: true })
          return
        }
        if (!setIdFromRoute) return
        const full = await api.getQuizSetFull(setIdFromRoute)
        if (cancelled) return
        setQuizSet(full)
        setActiveId(full.questions?.[0]?.id ?? null)
        const first = full.questions?.[0]
        if (first?.book) {
          setScope({ book: first.book, chapterFrom: first.chapter ?? 1, chapterTo: first.chapter ?? 1 })
        }
        if (aiEnabled) {
          try { setAiQuota(await api.getAIQuota()) } catch { /* ignore */ }
        }
      } catch (e: any) {
        if (!cancelled) setLoadError(e?.response?.data?.message || e?.message || 'Không tải được bộ câu hỏi')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, setIdFromRoute])

  const activeQuestion = useMemo(
    () => quizSet?.questions.find(q => q.id === activeId) ?? null,
    [quizSet, activeId],
  )

  const persistQuestion = useCallback(async (payload: { qid: string; patch: Partial<EditorQuestion> }) => {
    if (!quizSet) return
    setSaving(true)
    try {
      await api.updateQuestion(quizSet.id, payload.qid, payload.patch as Partial<AddQuestionBody>)
      setLastSavedAt(Date.now())
    } finally { setSaving(false) }
  }, [api, quizSet])

  const { schedule: scheduleQuestionSave, flush: flushQuestionSave } = useAutoSave(persistQuestion)

  const persistMetadata = useCallback(async (patch: Partial<QuizSetFull>) => {
    if (!quizSet) return
    setSaving(true)
    try {
      await api.updateQuizSet(quizSet.id, patch as Partial<CreateQuizSetBody>)
      setLastSavedAt(Date.now())
      dirtyMetaRef.current = false
    } finally { setSaving(false) }
  }, [api, quizSet])

  const { schedule: scheduleMetaSave, flush: flushMetaSave } = useAutoSave(persistMetadata)

  const handleQuestionChange = (qid: string, patch: Partial<EditorQuestion>) => {
    setQuizSet(prev => {
      if (!prev) return prev
      const idx = prev.questions.findIndex(q => q.id === qid)
      if (idx < 0) return prev
      const next = [...prev.questions]
      next[idx] = { ...next[idx], ...patch }
      return { ...prev, questions: next }
    })
    scheduleQuestionSave({ qid, patch })
  }

  const handleMetaChange = (patch: Partial<QuizSetFull>) => {
    setQuizSet(prev => prev ? { ...prev, ...patch } : prev)
    dirtyMetaRef.current = true
    scheduleMetaSave(patch)
  }

  const handleAddManual = async () => {
    if (!quizSet) return
    try {
      await flushQuestionSave()
      const { question, totalQuestions } = await api.addQuestion(quizSet.id, {
        content: '', book: scope.book, chapter: scope.chapterFrom,
        difficulty: 'medium', options: ['', '', '', ''], correctAnswer: [0],
        explanation: '', language: 'vi',
      })
      setQuizSet(prev => prev ? {
        ...prev,
        questions: [...prev.questions, question],
        questionIds: [...prev.questionIds, question.id],
        totalQuestions,
      } : prev)
      setActiveId(question.id)
    } catch (e) { console.error(e) }
  }

  const handleDelete = async (qid: string) => {
    if (!quizSet) return
    if (!window.confirm('Xoá câu này khỏi bộ?')) return
    try {
      const total = await api.deleteQuestion(quizSet.id, qid)
      setQuizSet(prev => prev ? {
        ...prev,
        questions: prev.questions.filter(q => q.id !== qid),
        questionIds: prev.questionIds.filter(id => id !== qid),
        totalQuestions: total,
      } : prev)
      if (activeId === qid) {
        const remaining = quizSet.questions.filter(q => q.id !== qid)
        setActiveId(remaining[0]?.id ?? null)
      }
    } catch (e) { console.error(e) }
  }

  const handleAIGenerate = async (req: {
    countEasy: number; countMedium: number; countHard: number;
    chapterFrom: number; chapterTo: number;
    verseFrom: number | null; verseTo: number | null; topic?: string;
  }) => {
    if (!quizSet) return
    setAiBusy(true); setAiError(null)
    try {
      await flushQuestionSave()
      const res = await api.aiGenerateForSet(quizSet.id, {
        countEasy: req.countEasy, countMedium: req.countMedium, countHard: req.countHard,
        book: scope.book, chapterFrom: req.chapterFrom, chapterTo: req.chapterTo,
        verseFrom: req.verseFrom ?? undefined, verseTo: req.verseTo ?? undefined,
        topic: req.topic || topic || undefined, language: 'vi',
      })
      setQuizSet(prev => prev ? {
        ...prev,
        questions: [...prev.questions, ...res.questions],
        questionIds: [...prev.questionIds, ...res.questions.map(q => q.id)],
        totalQuestions: res.totalQuestions,
      } : prev)
      setAiQuota({ used: res.used, limit: res.limit, remaining: res.remaining })
      if (res.questions.length > 0) setActiveId(res.questions[0].id)
      setAiPanelOpen(false)
    } catch (e: any) {
      if (e?.response?.status === 429) {
        setAiError('Đã hết quota AI hôm nay (200 câu). Thử lại ngày mai.')
        const u = e.response.data
        if (u?.used != null) setAiQuota({ used: u.used, limit: u.limit, remaining: u.remaining })
      } else {
        setAiError(e?.response?.data?.message || e?.message || 'Lỗi khi tạo AI')
      }
    } finally { setAiBusy(false) }
  }

  const handleAIRewrite = async (hint: string) => {
    if (!quizSet || !activeQuestion) return null
    setRewriteBusy(true)
    try {
      const res = await api.aiRewriteQuestion(quizSet.id, activeQuestion.id, hint)
      setAiQuota({ used: res.used, limit: res.limit, remaining: res.remaining })
      return res.draft
    } finally { setRewriteBusy(false) }
  }

  const handleAcceptRewrite = (draft: { content?: string; options?: string[]; correctAnswer?: number[] | number; explanation?: string }) => {
    if (!activeQuestion) return
    const correct = Array.isArray(draft.correctAnswer)
      ? draft.correctAnswer
      : (typeof draft.correctAnswer === 'number' ? [draft.correctAnswer] : activeQuestion.correctAnswer)
    handleQuestionChange(activeQuestion.id, {
      content: draft.content ?? activeQuestion.content,
      options: draft.options ?? activeQuestion.options,
      correctAnswer: correct,
      explanation: draft.explanation ?? activeQuestion.explanation,
    })
  }

  const handlePublishClick = async () => {
    await flushQuestionSave()
    await flushMetaSave()
    setPublishOpen(true)
  }

  const handleConfirmPublish = async () => {
    if (!quizSet) return
    setPublishBusy(true)
    try {
      const updated = await api.publishQuizSet(quizSet.id)
      setQuizSet(prev => prev ? { ...prev, ...updated } : prev)
      setPublishOpen(false)
      navigate(`${detailPathBase}${quizSet.id}`)
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Lỗi khi xuất bản')
    } finally { setPublishBusy(false) }
  }

  const handleSaveDraftClick = async () => {
    await flushQuestionSave()
    await flushMetaSave()
  }

  const handleActivate = async (id: string) => {
    if (id === activeId) return
    await flushQuestionSave()
    setActiveId(id)
  }

  if (loading) return <PageShell><div style={spinnerStyle()}>Đang tải...</div></PageShell>
  if (loadError) return <PageShell><div style={errorStyle()}>{loadError}</div></PageShell>
  if (!quizSet) return <PageShell><div style={errorStyle()}>Không tìm thấy bộ câu hỏi</div></PageShell>

  const lastSavedAgoSec = lastSavedAt ? Math.floor((Date.now() - lastSavedAt) / 1000) : null
  const questions = quizSet.questions ?? []
  const activeIdx = activeQuestion ? questions.findIndex(q => q.id === activeQuestion.id) : -1
  const canPublish = quizSet.publishStatus === 'DRAFT'
    && questions.length >= MIN_QUESTIONS_TO_PUBLISH
    && (quizSet.name || '').trim().length >= 3

  return (
    <div style={{ background: COLOR.bgDeep, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <EditorTopBar
        backHref={backHref}
        ownerName={ownerName}
        quizSetName={quizSet.name}
        status={quizSet.publishStatus}
        lastSavedAgoSec={lastSavedAgoSec}
        saving={saving}
        questionCount={questions.length}
        aiUsed={aiEnabled ? aiQuota.used : undefined}
        aiLimit={aiEnabled ? aiQuota.limit : undefined}
        onPublish={handlePublishClick}
        onSaveDraft={handleSaveDraftClick}
        canPublish={canPublish}
      />

      <MetadataAccordion
        quizSet={quizSet}
        onChange={handleMetaChange}
        defaultBook={scope.book}
        defaultChapterFrom={scope.chapterFrom}
        defaultChapterTo={scope.chapterTo}
        onScopeChange={setScope}
      />

      <div className="qse-body" style={{ display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)', flex: 1, minHeight: 0 }}>
        <QuestionSidebar
          questions={questions}
          activeId={activeId}
          onActivate={handleActivate}
          onAIGenerate={aiEnabled ? () => setAiPanelOpen(true) : undefined}
          onAddManual={handleAddManual}
          aiBusy={aiBusy}
        />

        {activeQuestion ? (
          <QuestionEditor
            index={activeIdx}
            question={activeQuestion}
            onChange={patch => handleQuestionChange(activeQuestion.id, patch)}
            onDelete={() => handleDelete(activeQuestion.id)}
            onAIRewrite={aiEnabled ? () => setRewriteOpen(true) : undefined}
            rewriting={rewriteBusy}
          />
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: COLOR.bgSection, color: COLOR.textMuted, fontSize: 14, padding: 32, textAlign: 'center',
          }}>
            {aiEnabled
              ? 'Chưa có câu nào. Bấm "⚡ AI tạo nháp" hoặc "+ Thêm thủ công" ở đầu sidebar bên trái.'
              : 'Chưa có câu nào. Bấm "+ Thêm thủ công" ở đầu sidebar bên trái để bắt đầu.'}
          </div>
        )}
      </div>

      {aiEnabled && (
        <AIGeneratePanel
          open={aiPanelOpen}
          scope={scope}
          remaining={aiQuota.remaining}
          limit={aiQuota.limit}
          topic={topic}
          onClose={() => setAiPanelOpen(false)}
          onGenerate={async req => { setTopic(req.topic || ''); await handleAIGenerate(req) }}
          busy={aiBusy}
          error={aiError}
        />
      )}

      {aiEnabled && rewriteOpen && activeQuestion && (
        <AIRewriteModal
          open
          current={activeQuestion}
          remaining={aiQuota.remaining}
          limit={aiQuota.limit}
          onClose={() => setRewriteOpen(false)}
          onGenerate={handleAIRewrite}
          onAccept={handleAcceptRewrite}
        />
      )}

      <PublishConfirmModal
        open={publishOpen}
        questions={questions}
        nameValid={(quizSet.name || '').trim().length >= 3}
        onClose={() => setPublishOpen(false)}
        onConfirm={handleConfirmPublish}
        onGotoQuestion={id => setActiveId(id)}
        busy={publishBusy}
      />

      <style>{`
        @media (max-width: 768px) {
          .qse-body {
            grid-template-columns: minmax(0, 1fr) !important;
            grid-template-rows: auto 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: COLOR.bgDeep, minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>{children}</div>
  )
}

function spinnerStyle(): React.CSSProperties {
  return { color: COLOR.textMuted, fontSize: 14 }
}
function errorStyle(): React.CSSProperties {
  return { color: COLOR.danger, fontSize: 14, textAlign: 'center', maxWidth: 480 }
}
