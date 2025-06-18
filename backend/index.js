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
app.use('/api/auth', authRoutes)

// Port
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`✅ Backend SafeX lancé sur http://localhost:${PORT}`)
})
