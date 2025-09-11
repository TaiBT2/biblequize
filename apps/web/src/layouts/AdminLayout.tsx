import React from 'react'
import { Link, Outlet } from 'react-router-dom'

export default function AdminLayout() {
  return (
    <div>
      <header>
        <h1>Admin</h1>
        <nav>
          <Link to="/admin/ai-generator">AI Generator</Link> |{' '}
          <Link to="/admin/questions">Questions</Link> |{' '}
          <Link to="/">Home</Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}


