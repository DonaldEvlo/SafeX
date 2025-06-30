import React, { useEffect, useState } from 'react'
import { LogOut } from 'lucide-react' // Icône logout

const AdminProfileSection = ({ onLogout }) => {
  const [adminInfo, setAdminInfo] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setAdminInfo({
        name: payload.name || payload.username || 'Administrateur',
        email: payload.email || 'Email inconnu',
      })
    } catch {
      setAdminInfo({ name: 'Administrateur', email: 'Email inconnu' })
    }
  }, [])

  if (!adminInfo) return (
    <div className="h-screen flex items-center justify-center text-gray-400 text-lg">
      Chargement du profil...
    </div>
  )

  return (
    <div className="h-screen flex items-center justify-center bg-[#14181d]">
      
      <div className="bg-[#1f252d] p-8 rounded-2xl shadow-2xl border border-[#2c333f] w-full max-w-sm text-center text-gray-200 backdrop-blur-sm">
        
        {/* Avatar */}
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-700 to-purple-900 flex items-center justify-center text-3xl text-white shadow-md">
          {adminInfo.name.charAt(0).toUpperCase()}
        </div>

        {/* Infos */}
        <h2 className="text-2xl font-bold mb-1">{adminInfo.name}</h2>
        <p className="text-gray-400 mb-6 text-sm">{adminInfo.email}</p>

        {/* Bouton Déconnexion */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow transition hover:scale-105 active:scale-95"
        >
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>

    </div>
  )
}

export default AdminProfileSection
