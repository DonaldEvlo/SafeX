import React, { useEffect, useState } from 'react';

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

const UsersSection = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await fetch('http://localhost:5000/api/users', { headers });
      const data = await res.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error('Erreur récupération utilisateurs:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(
      (u) =>
        u.uid.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, users]);

  const handleAction = async (uid, action) => {
    let endpoint = '';
    let method = 'POST';

    switch (action) {
      case 'delete':
        endpoint = `/api/users/${uid}`;
        method = 'DELETE';
        break;
      case 'suspend':
      case 'unsuspend':
      case 'signout':
        endpoint = `/api/users/${uid}/${action}`;
        break;
      default:
        return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await fetch(`http://localhost:5000${endpoint}`, { method, headers });
      fetchUsers();
    } catch (err) {
      console.error(`Erreur action ${action}`, err);
    }
  };

  const handleGlobalSignout = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await fetch(`http://localhost:5000/api/users/signout-all`, { method: 'POST', headers });
      fetchUsers();
    } catch (err) {
      console.error('Erreur déconnexion globale', err);
    }
  };

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  return (
    <SectionCard
      icon="👥"
      title="Utilisateurs"
      description="Visualisez et gérez les comptes utilisateurs de la plateforme."
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px',
        '@media (min-width: 768px)': {
          flexDirection: 'row',
          justifyContent: 'space-between'
        }
      }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '33.333%' }}>
          <input
            type="text"
            placeholder="🔍 Rechercher un utilisateur..."
            style={{
              width: '100%',
              padding: '8px 16px 8px 40px',
              backgroundColor: '#20262e',
              border: '1px solid #2d333c',
              color: '#e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s',
              outline: 'none',
              fontSize: '14px'
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #9333ea'}
            onBlur={(e) => e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)'}
          />
          <span style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af',
            pointerEvents: 'none',
            fontSize: '16px'
          }}></span>
        </div>

        <button
          onClick={handleGlobalSignout}
          style={{
            background: 'linear-gradient(to right, #9333ea, #7e22ce)',
            color: '#ffffff',
            padding: '8px 20px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            border: 'none',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            fontSize: '14px',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
          onMouseUp={(e) => e.target.style.transform = 'scale(1.05)'}
        >
          🔁 Déconnexion Globale
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          backgroundColor: '#181d23',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
          borderCollapse: 'collapse'
        }}>
          <thead>
            <tr style={{
              backgroundColor: '#222933',
              color: '#9ca3af',
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <th style={{ padding: '16px 24px', textAlign: 'left' }}>UID</th>
              <th style={{ padding: '16px 24px', textAlign: 'left' }}>Nom</th>
              <th style={{ padding: '16px 24px', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '16px 24px', textAlign: 'left' }}>Rôle</th>
              <th style={{ padding: '16px 24px', textAlign: 'left' }}>État</th>
              <th style={{ padding: '16px 24px', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.length > 0 ? (
              currentUsers.map((u, idx) => (
                <tr
                  key={idx}
                  style={{
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#232b35'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '16px 24px', borderTop: '1px solid #2a313c' }}>{u.uid}</td>
                  <td style={{ padding: '16px 24px', borderTop: '1px solid #2a313c' }}>{u.name || '-'}</td>
                  <td style={{ padding: '16px 24px', borderTop: '1px solid #2a313c' }}>{u.email || '-'}</td>
                  <td style={{ padding: '16px 24px', borderTop: '1px solid #2a313c', textTransform: 'capitalize' }}>{u.role || 'user'}</td>
                  <td style={{ padding: '16px 24px', borderTop: '1px solid #2a313c' }}>
                    {u.disabled ? (
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: '#eab308',
                        color: '#000000',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        Suspendu
                      </span>
                    ) : (
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        Actif
                      </span>
                    )}
                  </td>
                  <td style={{
                    padding: '16px 24px',
                    borderTop: '1px solid #2a313c',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <button
                      onClick={() => handleAction(u.uid, 'suspend')}
                      style={{
                        fontSize: '12px',
                        backgroundColor: '#eab308',
                        color: '#000000',
                        padding: '4px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#ca8a04'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#eab308'}
                    >
                      Suspendre
                    </button>
                    <button
                      onClick={() => handleAction(u.uid, 'unsuspend')}
                      style={{
                        fontSize: '12px',
                        backgroundColor: '#16a34a',
                        color: '#000000',
                        padding: '4px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#15803d'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#16a34a'}
                    >
                      Réactiver
                    </button>
                    <button
                      onClick={() => handleAction(u.uid, 'signout')}
                      style={{
                        fontSize: '12px',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        padding: '4px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
                    >
                      Déconnecter
                    </button>
                    <button
                      onClick={() => handleAction(u.uid, 'delete')}
                      style={{
                        fontSize: '12px',
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                        padding: '4px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  style={{
                    padding: '32px 24px',
                    textAlign: 'center',
                    color: '#6b7280'
                  }}
                >
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '24px',
          gap: '8px'
        }}>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '14px',
                transition: 'all 0.2s',
                backgroundColor: currentPage === i + 1 ? '#9333ea' : '#2d333c',
                color: currentPage === i + 1 ? '#ffffff' : '#9ca3af',
                boxShadow: currentPage === i + 1 ? '0 2px 4px rgba(0, 0, 0, 0.2)' : 'none',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== i + 1) e.target.style.backgroundColor = '#353d47';
              }}
              onMouseLeave={(e) => {
                if (currentPage !== i + 1) e.target.style.backgroundColor = '#2d333c';
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </SectionCard>
  );
};

export default UsersSection;