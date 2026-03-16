import React from 'react'

export default function UsersAdmin() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Users</h2>
        <p className="text-white/70">Quản lý người dùng</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-white/60">Tổng người dùng</div>
          <div className="text-3xl font-bold">—</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-white/60">Admin</div>
          <div className="text-3xl font-bold">—</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-white/60">Active hôm nay</div>
          <div className="text-3xl font-bold">—</div>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-medium">Danh sách người dùng</div>
          <button type="button" className="px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-500">Tạo người dùng</button>
        </div>
        <div className="text-white/60 text-sm">Placeholder table…</div>
      </div>
    </div>
  )
}



