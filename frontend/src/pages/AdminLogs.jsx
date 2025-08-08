import React, { useState } from 'react';
import UsersSection from '../components/Admin/UsersSection';
import LogsSection from '../components/Admin/LogsSection';
import DashboardSection from '../components/Admin/DashboardSection';
import AdminProfileSection from '../components/Admin/AdminProfileSection';

const AdminLogs = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const navItems = [
    { key: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { key: 'users', icon: '👥', label: 'Utilisateurs' },
    { key: 'logs', icon: '🔍', label: 'Logs d’audit' },
    // { key: 'profile', icon: '👤', label: 'Profil' },
  ];

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#0f1114',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Sidebar */}
      <aside style={{
        width: '288px',
        backgroundColor: '#111418',
        padding: '24px',
        borderRight: '1px solid #1f2937',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '4px',
              color: '#ffffff'
            }}>
              🛡️ SafeX Admin
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#9caaba'
            }}>
              Panneau de contrôle
            </p>
          </div>

          <nav style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {navItems.map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  transition: 'all 0.2s',
                  backgroundColor: activeSection === key ? '#1f2937' : 'transparent',
                  color: activeSection === key ? '#ffffff' : '#9caaba',
                  fontSize: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (activeSection !== key) e.target.style.backgroundColor = '#1a1e23';
                  if (activeSection !== key) e.target.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  if (activeSection !== key) e.target.style.backgroundColor = 'transparent';
                  if (activeSection !== key) e.target.style.color = '#9caaba';
                }}
              >
                <span style={{ fontSize: '18px' }}>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Logout Button */}
        <div style={{
          paddingTop: '24px',
          borderTop: '1px solid #1f2937'
        }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '8px 16px',
              fontSize: '14px',
              borderRadius: '9999px',
              color: '#f87171',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#dc2626';
              e.target.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#f87171';
            }}
          >
            🚪 Se déconnecter
          </button>
        </div>
      </aside>

      {/* Content */}
      <main style={{
        flex: '1',
        padding: '40px 32px'
      }}>
        <header style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '30px',
            fontWeight: '700',
            marginBottom: '4px'
          }}>
            Administration
          </h2>
          <p style={{
            color: '#9caaba',
            fontSize: '14px'
          }}>
            Gérer les utilisateurs et surveiller les activités de l’application SafeX.
          </p>
        </header>

        <div style={{
          transition: 'all 0.3s'
        }}>
          {activeSection === 'users' && <UsersSection />}
          {activeSection === 'logs' && <LogsSection />}
          {activeSection === 'dashboard' && <DashboardSection />}
          {/* {activeSection === 'profile' && <AdminProfileSection onLogout={handleLogout} />} */}
        </div>
      </main>
    </div>
  );
};

export default AdminLogs;