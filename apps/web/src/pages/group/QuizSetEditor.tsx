// BL-AD-8 — Unified Quiz Set Editor page.
// Replaces the 2-tab CreateQuizSetModal (deleted in Phase I) and the
// metadata-only QuizSetCreate flow.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useBlocker } from 'react-router-dom'
import {
  addQuestion, aiGenerateForSet, aiRewriteQuestion, createQuizSet, deleteQuestion,
  getAIQuota, getQuizSetFull, publishQuizSet, updateQuestion, updateQuizSet,
  type EditorQuestion, type QuizSetFull,
} from '../../api/quizSets'
import { api } from '../../api/client'
import EditorTopBar from './quizset-editor/EditorTopBar'
import MetadataAccordion from './quizset-editor/MetadataAccordion'
import QuestionSidebar from './quizset-editor/QuestionSidebar'
import QuestionEditor from './quizset-editor/QuestionEditor'
import AIGeneratePanel from './quizset-editor/AIGeneratePanel'
import AIRewriteModal from './quizset-editor/AIRewriteModal'
import PublishConfirmModal from './quizset-editor/PublishConfirmModal'
import { COLOR } from './quizset-editor/styles'
import { useAutoSave } from './quizset-editor/useAutoSave'

type Mode = 'create' | 'edit'

interface Props { mode?: Mode }

export default function QuizSetEditor({ mode: forcedMode }: Props) {
  const { id: groupId, setId: routeSetId } = useParams<{ id: string; setId?: string }>()
  const navigate = useNavigate()
  const mode: Mode = forcedMode ?? (routeSetId ? 'edit' : 'create')

  const [quizSet, setQuizSet] = useState<QuizSetFull | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const [, forceTick] = useState(0)
  const [groupName, setGroupName] = useState<string | undefined>(undefined)

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

  // ── Tick every 1s to refresh "Đã lưu Ns trước" badge.
  useEffect(() => {
    const id = setInterval(() => forceTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // ── Initial load: create flow auto-creates a DRAFT, then navigates to /edit/:newId
  useEffect(() => {
    if (!groupId) return
    let cancelled = false
    setLoading(true); setLoadError(null)
    ;(async () => {
      try {
        if (mode === 'create' && !routeSetId) {
          const created = await createQuizSet(groupId, { name: 'Bộ câu hỏi mới' })
          if (cancelled) return
          navigate(`/groups/${groupId}/quiz-sets/${created.id}/edit`, { replace: true })
          return
        }
        if (!routeSetId) return
        const full = await getQuizSetFull(groupId, routeSetId)
        if (cancelled) return
        setQuizSet(full)
        setActiveId(full.questions?.[0]?.id ?? null)
        // Seed scope from first question if available
        const first = full.questions?.[0]
        if (first?.book) {
          setScope({
            book: first.book,
            chapterFrom: first.chapter ?? 1,
            chapterTo: first.chapter ?? 1,
          })
        }
        // Try fetch group name (best-effort, ignore failure)
        try {
          const r = await api.get(`/api/groups/${groupId}`)
          setGroupName(r.data?.group?.name)
        } catch { /* ignore */ }
        // Quota
        try {
          const q = await getAIQuota(groupId)
          setAiQuota(q)
        } catch { /* ignore */ }
      } catch (e: any) {
        if (!cancelled) setLoadError(e?.response?.data?.message || e?.message || 'Không tải được bộ câu hỏi')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [groupId, mode, routeSetId, navigate])

  const activeQuestion = useMemo(
    () => quizSet?.questions.find(q => q.id === activeId) ?? null,
    [quizSet, activeId],
  )

  // ── Per-question auto-save
  const persistQuestion = useCallback(async (payload: { qid: string; patch: Partial<EditorQuestion> }) => {
    if (!groupId || !quizSet) return
    setSaving(true)
    try {
      await updateQuestion(groupId, quizSet.id, payload.qid, payload.patch as any)
      setLastSavedAt(Date.now())
    } finally {
      setSaving(false)
    }
  }, [groupId, quizSet])

  const { schedule: scheduleQuestionSave, flush: flushQuestionSave, hasPending } = useAutoSave(persistQuestion)

  const persistMetadata = useCallback(async (patch: Partial<QuizSetFull>) => {
    if (!groupId || !quizSet) return
    setSaving(true)
    try {
      await updateQuizSet(groupId, quizSet.id, patch as any)
      setLastSavedAt(Date.now())
      dirtyMetaRef.current = false
    } finally {
      setSaving(false)
    }
  }, [groupId, quizSet])

  const { schedule: scheduleMetaSave, flush: flushMetaSave } = useAutoSave(persistMetadata)

  // ── Navigation guard
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    (hasPending() || dirtyMetaRef.current || saving) && currentLocation.pathname !== nextLocation.pathname
  )
  useEffect(() => {
    if (blocker.state === 'blocked') {
      ;(async () => {
        if (hasPending()) await flushQuestionSave()
        if (dirtyMetaRef.current) await flushMetaSave()
        blocker.proceed()
      })()
    }
  }, [blocker, flushMetaSave, flushQuestionSave, hasPending])

  // ── Handlers
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
    if (!groupId || !quizSet) return
    try {
      await flushQuestionSave()
      const { question, totalQuestions } = await addQuestion(groupId, quizSet.id, {
        content: '',
        book: scope.book,
        chapter: scope.chapterFrom,
        difficulty: 'medium',
        options: ['', '', '', ''],
        correctAnswer: [0],
        explanation: '',
        language: 'vi',
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
    if (!groupId || !quizSet) return
    if (!window.confirm('Xoá câu này khỏi bộ?')) return
    try {
      const total = await deleteQuestion(groupId, quizSet.id, qid)
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

  const handleAIGenerate = async (req: { countEasy: number; countMedium: number; countHard: number; topic?: string }) => {
    if (!groupId || !quizSet) return
    setAiBusy(true); setAiError(null)
    try {
      await flushQuestionSave()
      const res = await aiGenerateForSet(groupId, quizSet.id, {
        countEasy: req.countEasy,
        countMedium: req.countMedium,
        countHard: req.countHard,
        book: scope.book,
        chapterFrom: scope.chapterFrom,
        chapterTo: scope.chapterTo,
        verseFrom: 1,
        verseTo: 50,
        topic: req.topic || topic || undefined,
        language: 'vi',
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
    } finally {
      setAiBusy(false)
    }
  }

  const handleAIRewrite = async (hint: string) => {
    if (!groupId || !quizSet || !activeQuestion) return null
    setRewriteBusy(true)
    try {
      const res = await aiRewriteQuestion(groupId, quizSet.id, activeQuestion.id, hint)
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
    if (!groupId || !quizSet) return
    setPublishBusy(true)
    try {
      const updated = await publishQuizSet(groupId, quizSet.id)
      setQuizSet(prev => prev ? { ...prev, ...updated } : prev)
      setPublishOpen(false)
      // Navigate to detail page after publish
      navigate(`/groups/${groupId}/quiz-sets/${quizSet.id}`)
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Lỗi khi xuất bản')
    } finally {
      setPublishBusy(false)
    }
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

  // ── Render
  if (loading) {
    return <PageShell><div style={spinnerStyle()}>Đang tải...</div></PageShell>
  }
  if (loadError) {
    return <PageShell><div style={errorStyle()}>{loadError}</div></PageShell>
  }
  if (!quizSet) {
    return <PageShell><div style={errorStyle()}>Không tìm thấy bộ câu hỏi</div></PageShell>
  }

  const lastSavedAgoSec = lastSavedAt ? Math.floor((Date.now() - lastSavedAt) / 1000) : null
  const questions = quizSet.questions ?? []
  const activeIdx = activeQuestion ? questions.findIndex(q => q.id === activeQuestion.id) : -1
  const canPublish = quizSet.publishStatus === 'DRAFT' && questions.length > 0 && (quizSet.name || '').trim().length >= 3

  return (
    <div style={{ background: COLOR.bgDeep, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <EditorTopBar
        groupId={groupId!}
        groupName={groupName}
        quizSetName={quizSet.name}
        status={quizSet.publishStatus}
        lastSavedAgoSec={lastSavedAgoSec}
        saving={saving}
        questionCount={questions.length}
        aiUsed={aiQuota.used}
        aiLimit={aiQuota.limit}
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

      <div className="qse-body" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', flex: 1, minHeight: 0 }}>
        <QuestionSidebar
          questions={questions}
          activeId={activeId}
          onActivate={handleActivate}
          onAIGenerate={() => setAiPanelOpen(true)}
          onAddManual={handleAddManual}
          aiBusy={aiBusy}
        />

        {activeQuestion ? (
          <QuestionEditor
            index={activeIdx}
            question={activeQuestion}
            onChange={patch => handleQuestionChange(activeQuestion.id, patch)}
            onDelete={() => handleDelete(activeQuestion.id)}
            onAIRewrite={() => setRewriteOpen(true)}
            rewriting={rewriteBusy}
          />
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: COLOR.bgSection, color: COLOR.textMuted, fontSize: 14, padding: 32, textAlign: 'center',
          }}>
            Chưa có câu nào. Dùng "⚡ AI tạo nháp" hoặc "+ Thêm thủ công" trong sidebar.
          </div>
        )}
      </div>

      <AIGeneratePanel
        open={aiPanelOpen}
        scopeLabel={`${scope.book} ${scope.chapterFrom}${scope.chapterTo > scope.chapterFrom ? `-${scope.chapterTo}` : ''}`}
        scope={scope}
        remaining={aiQuota.remaining}
        limit={aiQuota.limit}
        topic={topic}
        onClose={() => setAiPanelOpen(false)}
        onGenerate={async req => { setTopic(req.topic || ''); await handleAIGenerate(req) }}
        busy={aiBusy}
        error={aiError}
      />

      {rewriteOpen && activeQuestion && (
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
          .qse-body { grid-template-columns: 1fr !important; grid-template-rows: auto 1fr !important; }
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
