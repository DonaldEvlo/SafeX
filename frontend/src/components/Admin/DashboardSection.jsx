import React, { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis, YAxis
} from 'recharts'
const StatsCardsSection = ({ stats }) => {
  return (
    <div className="grid grid-cols-4 gap-4">
      {[
        { label: 'Total utilisateurs', value: stats.totalUsers, color: '#16a34a' },
        { label: 'Utilisateurs actifs', value: stats.activeUsers, color: '#0ea5e9' },
        { label: 'Suspendus', value: stats.suspendedUsers, color: '#dc2626' },
        { label: 'Messages envoyés', value: stats.totalMessages, color: '#f59e0b' }
      ].map((s, i) => (
        <div key={i} className="relative group">
          {/* Effet de lueur externe */}
          <div 
            className="absolute -inset-1 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-1000"
            style={{ backgroundColor: `${s.color}20` }}
          ></div>
          
          <div className="relative bg-gradient-to-br from-[#181d23]/95 to-[#0f1419]/95 p-6 rounded-2xl shadow-2xl border border-[#23282f]/60 backdrop-blur-sm overflow-hidden group-hover:scale-[1.02] transition-all duration-500"
               style={{ borderColor: `${s.color}40` }}>
            
            {/* Effet de scan supérieur */}
            <div 
              className="absolute top-0 left-0 w-full h-0.5 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-500"
              style={{ backgroundColor: s.color }}
            ></div>
            
            {/* Grille de fond subtile */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, ${s.color} 1px, transparent 0)`,
              backgroundSize: '15px 15px'
            }}></div>
            
            <div className="relative z-10 text-center">
              {/* Indicateur d'état */}
              <div className="flex justify-center mb-3">
                <div 
                  className="w-3 h-3 rounded-full animate-pulse shadow-lg"
                  style={{ 
                    backgroundColor: s.color,
                    boxShadow: `0 0 15px ${s.color}60`
                  }}
                ></div>
              </div>
              
              {/* Valeur principale */}
              <div className="mb-2">
                <p 
                  className="text-4xl font-bold tracking-tight"
                  style={{ color: s.color }}
                >
                  {s.value}
                </p>
              </div>
              
              {/* Label */}
              <p className="text-sm text-[#9caaba] font-medium tracking-wide">
                {s.label}
              </p>
              
              {/* Barres d'activité */}
              <div className="flex justify-center gap-1 mt-3">
                {[...Array(4)].map((_, idx) => (
                  <div 
                    key={idx} 
                    className="w-1 rounded-full animate-pulse"
                    style={{ 
                      backgroundColor: `${s.color}60`,
                      animationDelay: `${idx * 0.2}s`,
                      height: `${Math.random() * 8 + 8}px`
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

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
        const token = localStorage.getItem('token')

        const headers = {
          Authorization: `Bearer ${token}`
        }

        const [usersRes, messagesRes, loginsRes] = await Promise.all([
          fetch('http://localhost:3000/api/users', { headers }),
          fetch('http://localhost:3000/api/messages/count', { headers }),
          fetch('http://localhost:3000/api/audit/logins-week', { headers }),
        ])

        if (!usersRes.ok || !messagesRes.ok || !loginsRes.ok) {
          throw new Error("Échec de l'authentification")
        }

        const users = await usersRes.json()
        const { count } = await messagesRes.json() // <-- corrige ici
        const logins = await loginsRes.json()

        const active = users.filter(u => u.disabled === false).length
        const suspended = users.filter(u => u.disabled === true).length

        setStats({
          totalUsers: users.length,
          activeUsers: active,
          suspendedUsers: suspended,
          totalMessages: count // <-- corrige ici aussi
        })

        setLoginsData(logins)
      } catch (err) {
        console.error('❌ Erreur chargement dashboard:', err)
      }
    }

    fetchStats()
  }, [])

  // Tooltip personnalisé pour les graphiques
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f1419]/95 backdrop-blur-md border border-[#16a34a]/30 rounded-xl p-3 shadow-2xl">
          <p className="text-[#9caaba] text-sm">{`${label}`}</p>
          <p className="text-[#16a34a] font-semibold">
            {`Connexions: ${payload[0].value}`}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-8">
      {/* Statistiques principales avec design futuriste */}
      
       <StatsCardsSection stats={stats} />

      {/* Graphique des connexions avec effets futuristes */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#16a34a]/10 via-transparent to-[#16a34a]/10 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        
        <div className="relative bg-gradient-to-br from-[#181d23]/90 to-[#0f1419]/90 p-6 rounded-3xl shadow-2xl border border-[#23282f]/50 backdrop-blur-sm overflow-hidden group-hover:scale-[1.01] transition-all duration-500">
          {/* Bordure animée */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#16a34a]/20 via-[#0ea5e9]/20 to-[#16a34a]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-2xl p-2 bg-gradient-to-br from-[#16a34a]/20 to-[#0ea5e9]/20 rounded-xl backdrop-blur-sm">
                📈
              </div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-white to-[#9caaba] bg-clip-text text-transparent">
                Connexion hebdomadaire
              </h3>
            </div>
            
            <div className="relative">
              {/* Grille holographique de fond */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `linear-gradient(#16a34a 1px, transparent 1px), linear-gradient(90deg, #16a34a 1px, transparent 1px)`,
                backgroundSize: '20px 20px'
              }}></div>
              
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={loginsData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorLogin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.9} />
                      <stop offset="50%" stopColor="#16a34a" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.1} />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#23282f" opacity={0.3} />
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
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#16a34a"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorLogin)"
                    filter="url(#glow)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Répartition utilisateurs avec design holographique */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#16a34a]/10 via-transparent to-[#dc2626]/10 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        
        <div className="relative bg-gradient-to-br from-[#181d23]/90 to-[#0f1419]/90 p-6 rounded-3xl shadow-2xl border border-[#23282f]/50 backdrop-blur-sm overflow-hidden group-hover:scale-[1.01] transition-all duration-500">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#16a34a]/20 via-[#0ea5e9]/20 to-[#16a34a]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-2xl p-2 bg-gradient-to-br from-[#16a34a]/20 to-[#dc2626]/20 rounded-xl backdrop-blur-sm">
                🎯
              </div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-white to-[#9caaba] bg-clip-text text-transparent">
                Répartition des utilisateurs
              </h3>
            </div>
            
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <defs>
                    <filter id="pieGlow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={35}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#0f1419"
                    filter="url(#pieGlow)"
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#0f1419e6',
                      border: '1px solid #16a34a30',
                      borderRadius: '12px',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Légende futuriste */}
            <div className="flex justify-center gap-8 mt-4">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center gap-3 group/legend">
                  <div 
                    className="w-3 h-3 rounded-full shadow-lg animate-pulse group-hover/legend:scale-125 transition-transform duration-300"
                    style={{ 
                      backgroundColor: COLORS[index],
                      boxShadow: `0 0 15px ${COLORS[index]}50`
                    }}
                  ></div>
                  <span className="text-[#9caaba] text-sm font-medium group-hover/legend:text-white transition-colors duration-300">
                    {entry.name}: <span className="text-white font-semibold">{entry.value}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardSection