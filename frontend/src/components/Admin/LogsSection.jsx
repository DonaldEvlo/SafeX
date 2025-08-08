import React, { useEffect, useMemo, useState } from 'react';

const SectionCard = ({ icon, title, description, children }) => {
  return (
    <div style={{
      backgroundColor: '#181d23',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      padding: '24px',
      marginBottom: '24px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <span style={{ fontSize: '24px', marginRight: '12px' }}>{icon}</span>
        <div>
          <h2 style={{
            color: '#ffffff',
            fontSize: '20px',
            fontWeight: '600',
            margin: '0'
          }}>{title}</h2>
          <p style={{
            color: '#9caaba',
            fontSize: '14px',
            margin: '8px 0 0 0'
          }}>{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
};

const Table = ({ columns, data, onSort, sortConfig }) => {
  const getSortIcon = (col) => {
    if (!sortConfig) return '↕️';
    if (sortConfig.key !== col) return '↕️';
    return sortConfig.direction === 'asc' ? '⬆️' : '⬇️';
  };

  return (
    <div style={{
      overflowX: 'auto',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      backgroundColor: '#181d23'
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px',
        color: '#ffffff',
        textAlign: 'left'
      }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col}
                style={{
                  backgroundColor: '#22272e',
                  color: '#9caaba',
                  fontWeight: '600',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
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
              <td
                colSpan={columns.length}
                style={{
                  textAlign: 'center',
                  padding: '16px',
                  color: '#9caaba'
                }}
              >
                Aucun résultat
              </td>
            </tr>
          )}
          {data.map((row, idx) => (
            <tr
              key={idx}
              style={{
                borderBottom: '1px solid #22272e',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#23282f'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {columns.map(col => (
                <td
                  key={col}
                  style={{
                    padding: '12px 16px'
                  }}
                >
                  {row[col] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const LogsSection = () => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState(null);
  const logsPerPage = 10;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = {
          Authorization: `Bearer ${token}`
        };
        const res = await fetch('http://localhost:5000/api/audit', { headers });
        const data = await res.json();
        const parsed = data.map(log => ({
          Action: log.action,
          Utilisateur: log.userId,
          Détails: log.details?.message || '-',
          Destinataire: log.details?.to || '-',
          Date: log.timestamp
            ? new Date(log.timestamp._seconds * 1000).toLocaleString()
            : '-',
        }));
        setLogs(parsed);
      } catch (err) {
        console.error('❌ Erreur récupération des logs :', err);
      }
    };
    fetchLogs();
  }, []);

  const sortedLogs = useMemo(() => {
    if (!sortConfig) return logs;
    const sorted = [...logs].sort((a, b) => {
      const aValue = a[sortConfig.key] ?? '';
      const bValue = b[sortConfig.key] ?? '';
      if (!isNaN(Date.parse(aValue)) && !isNaN(Date.parse(bValue))) {
        return sortConfig.direction === 'asc'
          ? new Date(aValue) - new Date(bValue)
          : new Date(bValue) - new Date(aValue);
      }
      return sortConfig.direction === 'asc'
        ? aValue.toString().localeCompare(bValue.toString())
        : bValue.toString().localeCompare(aValue.toString());
    });
    return sorted;
  }, [logs, sortConfig]);

  const filteredLogs = useMemo(() => {
    if (!searchTerm) return sortedLogs;
    return sortedLogs.filter(log =>
      Object.values(log).some(val =>
        val.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, sortedLogs]);

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSort = (column) => {
    if (sortConfig && sortConfig.key === column) {
      setSortConfig({
        key: column,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc',
      });
    } else {
      setSortConfig({ key: column, direction: 'asc' });
    }
    setCurrentPage(1);
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <SectionCard
        icon="📝"
        title="Logs d’audit"
        description="Historique des actions et événements importants dans SafeX."
      >
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Rechercher dans les logs"
            style={{
              width: '100%',
              backgroundColor: '#283039',
              color: '#ffffff',
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '14px'
            }}
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <Table
          columns={['Action', 'Utilisateur', 'Détails', 'Destinataire', 'Date']}
          data={currentLogs}
          onSort={handleSort}
          sortConfig={sortConfig}
        />

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
          marginTop: '16px',
          color: '#ffffff',
          fontSize: '14px'
        }}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              color: '#ffffff',
              border: 'none',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? '0.5' : '1'
            }}
            onMouseEnter={(e) => {
              if (currentPage !== 1) e.currentTarget.style.backgroundColor = '#283039';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Précédent
          </button>

          <span>Page {currentPage} sur {totalPages}</span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              color: '#ffffff',
              border: 'none',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? '0.5' : '1'
            }}
            onMouseEnter={(e) => {
              if (currentPage !== totalPages) e.currentTarget.style.backgroundColor = '#283039';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Suivant
          </button>
        </div>
      </SectionCard>
    </div>
  );
};

export default LogsSection;