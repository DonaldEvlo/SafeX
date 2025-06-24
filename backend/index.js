const express = require('express')
const cors = require('cors')
const app = express()

// Middlewares
app.use(cors())
app.use(express.json())

// ✅ Route de bienvenue
app.get('/', (req, res) => {
  res.send('👋 Bienvenue sur l’API SafeX 🚀')
})

// Routes
const authRoutes = require('./routes/auth')
const auditRoutes = require('./routes/audit');
app.use('/api/auth', authRoutes)
app.use('/api/messages', require('./routes/messages'));

app.use('/api/audit', auditRoutes);


// Port
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`✅ Backend SafeX lancé sur http://localhost:${PORT}`)
})
