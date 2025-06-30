import React, { useEffect, useState } from 'react'
import SectionCard from './SectionCard'

const UsersSection = () => {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const usersPerPage = 5

  const fetchUsers = async () => {
    const token = localStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }

    try {
      const res = await fetch('http://localhost:3000/api/users', { headers })
      const data = await res.json()
      setUsers(data)
      setFilteredUsers(data)
    } catch (err) {
      console.error('Erreur récupération utilisateurs:', err)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    const filtered = users.filter(
      (u) =>
        u.uid.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredUsers(filtered)
    setCurrentPage(1)
  }, [searchTerm, users])

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
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      await fetch(`http://localhost:3000${endpoint}`, { method, headers })
      fetchUsers()
    } catch (err) {
      console.error(`Erreur action ${action}`, err)
    }
  }

  const handleGlobalSignout = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      await fetch(`http://localhost:3000/api/users/signout-all`, { method: 'POST', headers })
      fetchUsers()
    } catch (err) {
      console.error('Erreur déconnexion globale', err)
    }
  }

  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)

  return (
    <SectionCard
      icon="👥"
      title="Utilisateurs"
      description="Visualisez et gérez les comptes utilisateurs de la plateforme."
    >
      {/* Barre de recherche moderne */}
      <div className="flex flex-col md:flex-row md:justify-between items-center gap-4 mb-6">
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="🔍 Rechercher un utilisateur..."
            className="w-full pl-10 pr-4 py-2 bg-[#20262e] border border-[#2d333c] text-gray-200 rounded-xl backdrop-blur-sm shadow focus:ring-2 focus:ring-purple-600 focus:outline-none transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-3 top-2.5 text-gray-400 pointer-events-none">🔍</span>
        </div>

        <button
          onClick={handleGlobalSignout}
          className="bg-gradient-to-r from-purple-700 to-purple-900 text-white px-5 py-2 rounded-xl shadow hover:scale-105 active:scale-95 transition"
        >
          🔁 Déconnexion Globale
        </button>
      </div>

      {/* Tableau style dashboard moderne */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-[#181d23] rounded-2xl overflow-hidden shadow-lg">
          <thead>
            <tr className="bg-[#222933] text-gray-400 text-sm uppercase tracking-wider">
              <th className="px-6 py-4 text-left">UID</th>
              <th className="px-6 py-4 text-left">Nom</th>
              <th className="px-6 py-4 text-left">Email</th>
              <th className="px-6 py-4 text-left">Rôle</th>
              <th className="px-6 py-4 text-left">État</th>
              <th className="px-6 py-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.length > 0 ? (
              currentUsers.map((u, idx) => (
                <tr key={idx} className="hover:bg-[#232b35] transition group">
                  <td className="px-6 py-4 border-t border-[#2a313c]">{u.uid}</td>
                  <td className="px-6 py-4 border-t border-[#2a313c]">{u.name || '-'}</td>
                  <td className="px-6 py-4 border-t border-[#2a313c]">{u.email || '-'}</td>
                  <td className="px-6 py-4 border-t border-[#2a313c] capitalize">{u.role || 'user'}</td>
                  <td className="px-6 py-4 border-t border-[#2a313c]">
                    {u.disabled ? (
                      <span className="px-3 py-1 bg-yellow-500 text-black rounded-full text-xs font-medium">
                        Suspendu
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-medium">
                        Actif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 border-t border-[#2a313c] flex flex-wrap gap-2">
                    <button
                      onClick={() => handleAction(u.uid, 'suspend')}
                      className="text-xs bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded-lg transition"
                    >
                      Suspendre
                    </button>
                    <button
                      onClick={() => handleAction(u.uid, 'unsuspend')}
                      className="text-xs bg-green-500 hover:bg-green-600 text-black px-3 py-1 rounded-lg transition"
                    >
                      Réactiver
                    </button>
                    <button
                      onClick={() => handleAction(u.uid, 'signout')}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition"
                    >
                      Déconnecter
                    </button>
                    <button
                      onClick={() => handleAction(u.uid, 'delete')}
                      className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded-xl text-sm transition ${
                currentPage === i + 1
                  ? 'bg-purple-700 text-white shadow'
                  : 'bg-[#2d333c] text-gray-400 hover:bg-[#353d47]'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

export default UsersSection
