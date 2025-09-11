import React, { useState } from 'react'

export default function AIQuestionGenerator() {
  const [book, setBook] = useState('')
  const [chapter, setChapter] = useState('')
  const [verseStart, setVerseStart] = useState('')
  const [verseEnd, setVerseEnd] = useState('')
  const [text, setText] = useState('')
  const [prompt, setPrompt] = useState('')
  const [count, setCount] = useState(5)

  return (
    <div>
      <h2>Admin · AI Question Generator</h2>
      <div style={{ display: 'grid', gap: 8, maxWidth: 720 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Book" value={book} onChange={e => setBook(e.target.value)} />
          <input placeholder="Chapter" value={chapter} onChange={e => setChapter(e.target.value)} />
          <input placeholder="Verse Start" value={verseStart} onChange={e => setVerseStart(e.target.value)} />
          <input placeholder="Verse End" value={verseEnd} onChange={e => setVerseEnd(e.target.value)} />
        </div>
        <textarea placeholder="Scripture Text (optional)" value={text} onChange={e => setText(e.target.value)} rows={4} />
        <textarea placeholder="Prompt (optional)" value={prompt} onChange={e => setPrompt(e.target.value)} rows={6} />
        <div>
          <label>Count: </label>
          <input type="number" min={1} max={20} value={count} onChange={e => setCount(Number(e.target.value))} />
        </div>
        <div>
          <button type="button">Generate</button>
        </div>
      </div>
      <hr />
      <div>
        <h3>Drafts</h3>
        <p>Chưa có dữ liệu (mock).</p>
      </div>
    </div>
  )
}


