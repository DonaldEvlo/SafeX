import React from 'react'
import LogsTable from '@/components/Admin/LogsTable'

const AdminLogs = () => {
  return (
    <div className="flex min-h-screen bg-[#111418] text-white">
      {/* Sidebar */}
      <aside className="w-80 bg-[#111418] p-6 border-r border-[#283039] flex flex-col justify-between">
        <div>
          <h1 className="text-lg font-medium">SafeX Admin</h1>
          <p className="text-sm text-[#9caaba] mb-6">Admin Panel</p>
          <nav className="flex flex-col gap-2">
            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm font-medium">
              <span>🏠</span> Dashboard
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm font-medium">
              <span>👥</span> Users
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm font-medium">
              <span>👪</span> Groups
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm font-medium bg-[#283039] rounded-full">
              <span>🔍</span> Audit Logs
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm font-medium">
              <span>⚙️</span> Settings
            </a>
          </nav>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 px-6 py-8">
        <header className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Audit Logs</h2>
          <p className="text-[#9caaba] text-sm">Monitor real-time activities and events within the SafeX messaging app.</p>
        </header>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search logs"
            className="w-full bg-[#283039] text-white placeholder-[#9caaba] p-3 rounded-xl focus:outline-none"
          />
        </div>

        <LogsTable />
      </main>
    </div>
  )
}

export default AdminLogs
