import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import AIQuestionGenerator from './pages/admin/AIQuestionGenerator'
import QuestionsAdmin from './pages/admin/Questions'

function Home() {
  return (
    <div>
      <h1>Bible Quiz</h1>
      <nav>
        <Link to="/player/ranked">Ranked</Link> |{' '}
        <Link to="/player/practice">Practice</Link> |{' '}
        <Link to="/admin/ai-generator">Admin AI</Link>
      </nav>
    </div>
  )
}

function Ranked() {
  return <div>Ranked placeholder</div>
}

function Practice() {
  return <div>Practice placeholder</div>
}

function AdminAIGenerator() {
  return (
    <div>
      <h2>AI Question Generator</h2>
      <form>
        <input placeholder="Book" />
        <input placeholder="Chapter" />
        <input placeholder="Verse Start" />
        <input placeholder="Verse End" />
        <textarea placeholder="Scripture Text (optional)" />
        <textarea placeholder="Prompt" />
        <button type="button">Generate</button>
      </form>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/player/ranked" element={<Ranked />} />
        <Route path="/player/practice" element={<Practice />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="ai-generator" element={<AIQuestionGenerator />} />
          <Route path="questions" element={<QuestionsAdmin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)


