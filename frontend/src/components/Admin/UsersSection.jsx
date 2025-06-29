import React, { useEffect, useState } from 'react'
import SectionCard from './SectionCard'

const UsersSection = () => {
  const [users, setUsers] = useState([])

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/users')
      const data = await res.json()
      setUsers(data)
    } catch (err) {
      console.error('❌ Erreur récupération utilisateurs:', err)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleAction = async (uid, action) => {
    let endpoint = ''
    let method = 'POST'

    switch (action) {
      case 'delete':
        endpoint = `/api/users/${uid}`
        method = 'DELETE'
        break
      case 'suspend':
      case 'unsuspend':
      case 'signout':
        endpoint = `/api/users/${uid}/${action}`
        break
      default:
        return
    }

    try {
      await fetch(`http://localhost:3000${endpoint}`, { method })
      alert(`✅ Action ${action} réussie pour ${uid}`)
      fetchUsers()
    } catch (err) {
      alert(`❌ Erreur action ${action}`)
    }
  }

  const handleGlobalSignout = async () => {
    try {
      await fetch(`http://localhost:3000/api/users/signout-all`, { method: 'POST' })
      alert('✅ Tous les utilisateurs ont été déconnectés.')
    } catch (err) {
      alert('❌ Erreur lors de la déconnexion globale')
    }
  }

  return (
    <SectionCard
      icon="👤"
      title="Utilisateurs"
      description="Liste des utilisateurs enregistrés sur la plateforme."
    >
      <div className="flex justify-end mb-4">
        <button
          onClick={handleGlobalSignout}
          className="bg-purple-700 px-4 py-2 text-sm rounded hover:bg-purple-800"
        >
          🔁 Déconnexion globale
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl shadow-lg bg-[#181d23]">
        <table className="min-w-full text-sm text-left">
          <thead>
            <tr>
              {['UID', 'Nom', 'Email', 'Rôle', 'État', 'Actions'].map(col => (
                <th key={col} className="px-4 py-3 bg-[#22272e] text-[#9caaba] font-semibold">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, idx) => (
              <tr key={idx} className="border-b border-[#22272e] hover:bg-[#23282f] transition">
                <td className="px-4 py-3">{u.uid}</td>
                <td className="px-4 py-3">{u.name || '-'}</td>
                <td className="px-4 py-3">{u.email || '-'}</td>
                <td className="px-4 py-3">{u.role || 'user'}</td>
                <td className="px-4 py-3">
                  {u.disabled ? (
                    <span className="text-yellow-400">Suspendu</span>
                  ) : (
                    <span className="text-green-400">Actif</span>
                  )}
                </td>
                <td className="px-4 py-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleAction(u.uid, 'suspend')}
                    className="text-xs bg-yellow-600 px-2 py-1 rounded"
                  >
                    Suspendre
                  </button>
                  <button
                    onClick={() => handleAction(u.uid, 'unsuspend')}
                    className="text-xs bg-green-700 px-2 py-1 rounded"
                  >
                    Réactiver
                  </button>
                  <button
                    onClick={() => handleAction(u.uid, 'signout')}
                    className="text-xs bg-blue-700 px-2 py-1 rounded"
                  >
                    Déconnecter
                  </button>
                  <button
                    onClick={() => handleAction(u.uid, 'delete')}
                    className="text-xs bg-red-600 px-2 py-1 rounded"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}

export default UsersSection
