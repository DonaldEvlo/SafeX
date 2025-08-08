import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const StatsCardsSection = ({ stats }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px'
    }}>
      {[
        { label: 'Total utilisateurs', value: stats.totalUsers, color: '#16a34a' },
        { label: 'Utilisateurs actifs', value: stats.activeUsers, color: '#0ea5e9' },
        { label: 'Suspendus', value: stats.suspendedUsers, color: '#dc2626' },
        { label: 'Messages envoyés', value: stats.totalMessages, color: '#f59e0b' }
      ].map((s, i) => (
        <div key={i} style={{ position: 'relative' }}>
          {/* Outer glow effect */}
          <div style={{
            position: 'absolute',
            top: '-4px',
            left: '-4px',
            right: '-4px',
            bottom: '-4px',
            borderRadius: '16px',
            filter: 'blur(8px)',
            opacity: '0',
            transition: 'opacity 1s',
            backgroundColor: `${s.color}33`,
            ':hover': { opacity: '1' }
          }}></div>

          <div style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #181d23e6, #0f1419e6)',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
            border: `1px solid ${s.color}66`,
            backdropFilter: 'blur(10px)',
            transition: 'transform 0.5s',
            overflow: 'hidden',
            ':hover': { transform: 'scale(1.02)' }
          }}>
            {/* Top scan effect */}
            <div style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              height: '2px',
              backgroundColor: s.color,
              opacity: '0',
              transition: 'opacity 0.5s',
              animation: 'pulse 2s infinite',
              ':hover': { opacity: '1' }
            }}></div>

            {/* Subtle background grid */}
            <div style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              backgroundImage: `radial-gradient(circle at 2px 2px, ${s.color} 1px, transparent 0)`,
              backgroundSize: '15px 15px',
              opacity: '0.05'
            }}></div>

            <div style={{ position: 'relative', zIndex: '10', textAlign: 'center' }}>
              {/* Status indicator */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: s.color,
                  boxShadow: `0 0 15px ${s.color}99`,
                  animation: 'pulse 1.5s infinite'
                }}></div>
              </div>

              {/* Main value */}
              <div style={{ marginBottom: '8px' }}>
                <p style={{
                  fontSize: '36px',
                  fontWeight: '700',
                  color: s.color,
                  letterSpacing: '-0.025em'
                }}>
                  {s.value}
                </p>
              </div>

              {/* Label */}
              <p style={{
                fontSize: '14px',
                color: '#9caaba',
                fontWeight: '500',
                letterSpacing: '0.05em'
              }}>
                {s.label}
              </p>

              {/* Activity bars */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '4px',
                marginTop: '12px'
              }}>
                {[...Array(4)].map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: '4px',
                      height: `${Math.random() * 8 + 8}px`,
                      borderRadius: '9999px',
                      backgroundColor: `${s.color}99`,
                      animation: `pulse ${1.5 + idx * 0.2}s infinite`,
                      animationDelay: `${idx * 0.2}s`
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
        `}
      </style>
    </div>
  );
};

const DashboardSection = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    totalMessages: 0
  });

  const [loginsData, setLoginsData] = useState([]);

  const barData = [
    { name: 'Actifs', value: stats.activeUsers, color: '#16a34a' },
    { name: 'Suspendus', value: stats.suspendedUsers, color: '#dc2626' }
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [usersRes, messagesRes, loginsRes] = await Promise.all([
          fetch('http://localhost:5000/api/users', { headers }),
          fetch('http://localhost:5000/api/messages/count', { headers }),
          fetch('http://localhost:5000/api/audit/logins-week', { headers })
        ]);

        if (!usersRes.ok || !messagesRes.ok || !loginsRes.ok) {
          throw new Error("Échec de l'authentification");
        }

        const users = await usersRes.json();
        const { count } = await messagesRes.json();
        const logins = await loginsRes.json();

        const active = users.filter(u => !u.disabled).length;
        const suspended = users.filter(u => u.disabled).length;

        setStats({
          totalUsers: users.length,
          activeUsers: active,
          suspendedUsers: suspended,
          totalMessages: count
        });

        setLoginsData(logins);
      } catch (err) {
        console.error('❌ Erreur chargement dashboard:', err);
      }
    };

    fetchStats();
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: '#0f1419e6',
          backdropFilter: 'blur(10px)',
          border: '1px solid #16a34a4d',
          borderRadius: '12px',
          padding: '12px',
          boxShadow: '0 8px 16px rgba(0,0,0,0.3)'
        }}>
          <p style={{ color: '#9caaba', fontSize: '14px' }}>{label}</p>
          <p style={{ color: '#16a34a', fontWeight: '600' }}>
            Connexions: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Stats Cards */}
      <StatsCardsSection stats={stats} />

      {/* Weekly Logins Chart */}
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute',
          top: '-4px',
          left: '-4px',
          right: '-4px',
          bottom: '-4px',
          background: 'linear-gradient(to right, #16a34a1a, transparent, #16a34a1a)',
          borderRadius: '24px',
          filter: 'blur(8px)',
          opacity: '0',
          transition: 'opacity 0.7s',
          ':hover': { opacity: '1' }
        }}></div>

        <div style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #181d23e6, #0f1419e6)',
          padding: '24px',
          borderRadius: '24px',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
          border: '1px solid #23282f80',
          backdropFilter: 'blur(10px)',
          transition: 'transform 0.5s',
          overflow: 'hidden',
          ':hover': { transform: 'scale(1.01)' }
        }}>
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            borderRadius: '24px',
            background: 'linear-gradient(to right, #16a34a33, #0ea5e933, #16a34a33)',
            opacity: '0',
            transition: 'opacity 0.5s',
            filter: 'blur(4px)',
            ':hover': { opacity: '1' }
          }}></div>

          <div style={{ position: 'relative', zIndex: '10' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <div style={{
                fontSize: '24px',
                padding: '8px',
                background: 'linear-gradient(135deg, #16a34a33, #0ea5e933)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)'
              }}>
                📈
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                background: 'linear-gradient(to right, #ffffff, #9caaba)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent'
              }}>
                Connexion hebdomadaire
              </h3>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundImage: `linear-gradient(#16a34a 1px, transparent 1px), linear-gradient(90deg, #16a34a 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
                opacity: '0.1'
              }}></div>

              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={loginsData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorLogin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.2} />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid stroke="#23282f" strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    stroke="#9caaba"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#9caaba"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#16a34a"
                    strokeWidth={3}
                    fill="url(#colorLogin)"
                    filter="url(#glow)"
                    dot={{ r: 4, fill: '#16a34a', stroke: '#0f1419', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* User Distribution Chart */}
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute',
          top: '-4px',
          left: '-4px',
          right: '-4px',
          bottom: '-4px',
          background: 'linear-gradient(to right, #16a34a1a, transparent, #dc26261a)',
          borderRadius: '24px',
          filter: 'blur(8px)',
          opacity: '0',
          transition: 'opacity 0.7s',
          ':hover': { opacity: '1' }
        }}></div>

        <div style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #181d23e6, #0f1419e6)',
          padding: '24px',
          borderRadius: '24px',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
          border: '1px solid #23282f80',
          backdropFilter: 'blur(10px)',
          transition: 'transform 0.5s',
          overflow: 'hidden',
          ':hover': { transform: 'scale(1.01)' }
        }}>
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            borderRadius: '24px',
            background: 'linear-gradient(to right, #16a34a33, #0ea5e933, #dc262633)',
            opacity: '0',
            transition: 'opacity 0.5s',
            filter: 'blur(4px)',
            ':hover': { opacity: '1' }
          }}></div>

          <div style={{ position: 'relative', zIndex: '10' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <div style={{
                fontSize: '24px',
                padding: '8px',
                background: 'linear-gradient(135deg, #16a34a33, #dc262633)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)'
              }}>
                🎯
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                background: 'linear-gradient(to right, #ffffff, #9caaba)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent'
              }}>
                Répartition des utilisateurs
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.2} />
                    </linearGradient>
                    <filter id="barGlow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid stroke="#23282f" strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    stroke="#9caaba"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#9caaba"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f1419e6',
                      border: '1px solid #16a34a4d',
                      borderRadius: '12px',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.3)'
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} filter="url(#barGlow)">
                    {barData.map((entry, index) => (
                      <Bar
                        key={`bar-${index}`}
                        fill={entry.color}
                        filter="url(#barGlow)"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '32px',
              marginTop: '16px'
            }}>
              {barData.map((entry, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: entry.color,
                    boxShadow: `0 0 15px ${entry.color}80`,
                    animation: 'pulse 1.5s infinite',
                    transition: 'transform 0.3s',
                    ':hover': { transform: 'scale(1.25)' }
                  }}></div>
                  <span style={{
                    color: '#9caaba',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'color 0.3s',
                    ':hover': { color: '#ffffff' }
                  }}>
                    {entry.name}: <span style={{ color: '#ffffff', fontWeight: '600' }}>{entry.value}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
        `}
      </style>
    </div>
  );
};

export default DashboardSection;