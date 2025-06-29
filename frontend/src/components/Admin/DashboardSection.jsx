import React, { useEffect, useState } from 'react'
import SectionCard from './SectionCard'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

const DashboardSection = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    totalMessages: 0
  })

  const [loginsData, setLoginsData] = useState([])

  const pieData = [
    { name: 'Actifs', value: stats.activeUsers },
    { name: 'Suspendus', value: stats.suspendedUsers },
  ]

  const COLORS = ['#16a34a', '#dc2626']

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Appels API réels
        const [usersRes, messagesRes, loginsRes] = await Promise.all([
          fetch('http://localhost:3000/api/users'),
          fetch('http://localhost:3000/api/messages/count'),
          fetch('http://localhost:3000/api/audit/logins-week'),
        ])

        const users = await usersRes.json()
        const { total } = await messagesRes.json()
        const logins = await loginsRes.json()

        const active = users.filter(u => u.disabled === false).length
        const suspended = users.filter(u => u.disabled === true).length

        setStats({
          totalUsers: users.length,
          activeUsers: active,
          suspendedUsers: suspended,
          totalMessages: total
        })

        setLoginsData(logins)
      } catch (err) {
        console.error('❌ Erreur chargement dashboard:', err)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="space-y-6">
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total utilisateurs', value: stats.totalUsers },
          { label: 'Utilisateurs actifs', value: stats.activeUsers },
          { label: 'Suspendus', value: stats.suspendedUsers },
          { label: 'Messages envoyés', value: stats.totalMessages }
        ].map((s, i) => (
          <div key={i} className="bg-[#181d23] p-6 rounded-2xl shadow border border-[#23282f]">
            <p className="text-sm text-[#9caaba]">{s.label}</p>
            <p className="text-2xl font-semibold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Graphique des connexions */}
      <SectionCard icon="📈" title="Connexion hebdomadaire">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={loginsData}>
            <defs>
              <linearGradient id="colorLogin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2c353f" />
            <XAxis dataKey="date" stroke="#9caaba" />
            <YAxis stroke="#9caaba" />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#16a34a"
              fillOpacity={1}
              fill="url(#colorLogin)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Répartition utilisateurs */}
      <SectionCard icon="🎯" title="Répartition des utilisateurs">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label
            >
              {pieData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </SectionCard>
    </div>
  )
}

export default DashboardSection
