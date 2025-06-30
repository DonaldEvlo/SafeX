import React, { useEffect, useState, useMemo } from 'react'
import SectionCard from './SectionCard'

const Table = ({ columns, data, onSort, sortConfig }) => {
  const getSortIcon = (col) => {
    if (!sortConfig) return '↕️'
    if (sortConfig.key !== col) return '↕️'
    return sortConfig.direction === 'asc' ? '⬆️' : '⬇️'
  }

  return (
    <div className="overflow-x-auto rounded-xl shadow-lg bg-[#181d23]">
      <table className="min-w-full text-sm text-left">
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col}
                className="px-4 py-3 bg-[#22272e] text-[#9caaba] font-semibold cursor-pointer select-none"
                onClick={() => onSort(col)}
              >
                {col} {getSortIcon(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="text-center py-4 text-[#9caaba]">
                Aucun résultat
              </td>
            </tr>
          )}
          {data.map((row, idx) => (
            <tr
              key={idx}
              className="border-b border-[#22272e] hover:bg-[#23282f] transition"
            >
              {columns.map(col => (
                <td key={col} className="px-4 py-3">{row[col] ?? '-'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const LogsSection = () => {
  const [logs, setLogs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState(null)
  const logsPerPage = 10

  useEffect(() => {
    const fetchLogs = async () => {
      try {
         const token = localStorage.getItem('token')

    const headers = {
      Authorization: `Bearer ${token}`
    }
        const res = await fetch('http://localhost:3000/api/audit', { headers })
        const data = await res.json()
        const parsed = data.map(log => ({
          Action: log.action,
          Utilisateur: log.userId,
          Détails: log.details?.message || '-',
          Destinataire: log.details?.to || '-',
          Date: log.timestamp
            ? new Date(log.timestamp._seconds * 1000).toLocaleString()
            : '-',
        }))
        setLogs(parsed)
      } catch (err) {
        console.error('❌ Erreur récupération des logs :', err)
      }
    }
    fetchLogs()
  }, [])

  // Tri
  const sortedLogs = useMemo(() => {
    if (!sortConfig) return logs
    const sorted = [...logs].sort((a, b) => {
      const aValue = a[sortConfig.key] ?? ''
      const bValue = b[sortConfig.key] ?? ''
      // Tri numérique si possible
      if (!isNaN(Date.parse(aValue)) && !isNaN(Date.parse(bValue))) {
        return sortConfig.direction === 'asc'
          ? new Date(aValue) - new Date(bValue)
          : new Date(bValue) - new Date(aValue)
      }
      // Tri chaîne de caractères
      return sortConfig.direction === 'asc'
        ? aValue.toString().localeCompare(bValue.toString())
        : bValue.toString().localeCompare(aValue.toString())
    })
    return sorted
  }, [logs, sortConfig])

  // Filtrage recherche (sur toutes les colonnes)
  const filteredLogs = useMemo(() => {
    if (!searchTerm) return sortedLogs
    return sortedLogs.filter(log =>
      Object.values(log).some(val =>
        val.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [searchTerm, sortedLogs])

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage)
  const indexOfLastLog = currentPage * logsPerPage
  const indexOfFirstLog = indexOfLastLog - logsPerPage
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog)

  // Gestion du changement de page
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // Gestion du clic sur un en-tête pour trier
  const handleSort = (column) => {
    if (sortConfig && sortConfig.key === column) {
      // Changer direction
      setSortConfig({
        key: column,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc',
      })
    } else {
      // Nouveau tri asc
      setSortConfig({ key: column, direction: 'asc' })
    }
    setCurrentPage(1) // reset page à 1 à chaque tri
  }

  return (
    <SectionCard
      icon="📝"
      title="Logs d’audit"
      description="Historique des actions et événements importants dans SafeX."
    >
      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher dans les logs"
          className="w-full bg-[#283039] text-white placeholder-[#9caaba] p-3 rounded-xl focus:outline-none"
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value)
            setCurrentPage(1)
          }}
        />
      </div>

      <Table
        columns={['Action', 'Utilisateur', 'Détails', 'Destinataire', 'Date']}
        data={currentLogs}
        onSort={handleSort}
        sortConfig={sortConfig}
      />

      {/* Pagination controls */}
      <div className="flex justify-center items-center gap-4 mt-4 text-white">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded ${
            currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#283039]'
          }`}
        >
          Précédent
        </button>

        <span>
          Page {currentPage} sur {totalPages}
        </span>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded ${
            currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#283039]'
          }`}
        >
          Suivant
        </button>
      </div>
    </SectionCard>
  )
}

export default LogsSection
