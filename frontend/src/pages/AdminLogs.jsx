  import React, { useState } from 'react'
  import UsersSection from '../components/Admin/UsersSection'
  import LogsSection from '../components/Admin/LogsSection'

  const AdminLogs = () => {
    const [activeSection, setActiveSection] = useState('users')

    return (
      <div className="flex min-h-screen bg-[#111418] text-white">
        {/* Sidebar */}
        <aside className="w-80 bg-[#111418] p-6 border-r border-[#283039]">
          <h1 className="text-lg font-medium mb-2">SafeX Admin</h1>
          <p className="text-sm text-[#9caaba] mb-6">Admin Panel</p>
          <nav className="flex flex-col gap-2">
            {[
              { key: 'dashboard', icon: '🏠', label: 'Dashboard' },
              { key: 'users', icon: '👥', label: 'Users' },
              { key: 'groups', icon: '👪', label: 'Groups' },
              { key: 'logs', icon: '🔍', label: 'Audit Logs' },
              { key: 'settings', icon: '⚙️', label: 'Settings' },
            ].map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-full ${
                  activeSection === key ? 'bg-[#283039]' : ''
                }`}
              >
                <span>{icon}</span> {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 px-6 py-8">
          <header className="mb-6">
            <h2 className="text-3xl font-bold mb-2">Administration</h2>
            <p className="text-[#9caaba] text-sm">
              Gérez les utilisateurs et surveillez les activités de l’application SafeX.
            </p>
          </header>

          {activeSection === 'users' && <UsersSection />}
          {activeSection === 'logs' && <LogsSection />}
        </main>
      </div>
    )
  }

  export default AdminLogs
