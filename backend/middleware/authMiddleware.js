const admin = require('../services/firebaseAdmin')

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant ou invalide' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decodedToken = await admin.auth().verifyIdToken(token)
    req.user = decodedToken
    next()
  } catch (error) {
    console.error('Erreur de vérification du token :', error)
    res.status(403).json({ error: 'Token invalide' })
  }
}

module.exports = verifyToken
