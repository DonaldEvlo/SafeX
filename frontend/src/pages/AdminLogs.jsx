import React, { useState } from 'react'
import UsersSection from '../components/Admin/UsersSection'
import LogsSection from '../components/Admin/LogsSection'
import DashboardSection from '../components/Admin/DashboardSection'
import AdminProfileSection from '../components/Admin/AdminProfileSection'

const AdminLogs = () => {
  const [activeSection, setActiveSection] = useState('dashboard')

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  const navItems = [
    { key: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { key: 'users', icon: '👥', label: 'Utilisateurs' },
    { key: 'logs', icon: '🔍', label: 'Logs d’audit' },
    // { key: 'profile', icon: '👤', label: 'Profil' },
  ]

  return (
    <div className="flex min-h-screen bg-[#0f1114] text-white font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-[#111418] p-6 border-r border-[#1f2937] shadow-lg flex flex-col justify-between">
        <div>
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1 text-white">🛡️ SafeX Admin</h1>
            <p className="text-sm text-[#9caaba]">Panneau de contrôle</p>
          </div>

          <nav className="flex flex-col gap-2">
            {navItems.map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`flex items-center gap-3 px-4 py-2 rounded-full transition-all duration-200 
                  ${
                    activeSection === key
                      ? 'bg-[#1f2937] text-white'
                      : 'text-[#9caaba] hover:bg-[#1a1e23] hover:text-white'
                  }`}
              >
                <span className="text-lg">{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="pt-6 border-t border-[#1f2937]">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm rounded-full text-red-400 hover:bg-red-600 hover:text-white transition duration-200"
          >
            🚪 Se déconnecter
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 px-8 py-10">
        <header className="mb-8">
          <h2 className="text-3xl font-bold mb-1">Administration</h2>
          <p className="text-[#9caaba] text-sm">
            Gérer les utilisateurs et surveiller les activités de l’application SafeX.
          </p>
        </header>

        <div className="transition-all duration-300">
          {activeSection === 'users' && <UsersSection />}
          {activeSection === 'logs' && <LogsSection />}
          {activeSection === 'dashboard' && <DashboardSection />}
          {/* {activeSection === 'profile' && <AdminProfileSection onLogout={handleLogout} />} */}
        </div>
      </main>
    </div>
  )
}

export default AdminLogs
