const express = require('express')
const router = express.Router()
const admin = require('../services/firebaseAdmin')

// Enregistrement de l'utilisateur après création du compte Firebase
router.post('/signup', async (req, res) => {
  const { token, name, username } = req.body

  try {
    const decoded = await admin.auth().verifyIdToken(token)

    const uid = decoded.uid
    const email = decoded.email

    const firstInitial = name?.trim()?.charAt(0)?.toUpperCase() || 'U'
    const profileUrl = `https://ui-avatars.com/api/?name=${firstInitial}&background=random`

    const userRef = admin.firestore().collection('users').doc(uid)
    const doc = await userRef.get()

   if (!doc.exists) {
  console.log('📝 Création de l’utilisateur dans Firestore...')
  await userRef.set({
    uid,
    email,
    name,
    username,
    role: 'user',
    profileUrl,
    createdAt: new Date().toISOString()
  })
  console.log('✅ Utilisateur enregistré dans Firestore')
} else {
  console.log('⚠️ Utilisateur déjà présent')
}


    res.status(201).json({ message: 'Utilisateur enregistré', uid })
  } catch (error) {
    console.error('Erreur signup:', error)
    res.status(401).json({ error: 'Token invalide' })
  }
})

// Connexion (token valide)
router.post('/login', async (req, res) => {
  const { token } = req.body

  try {
    const decoded = await admin.auth().verifyIdToken(token)
    res.status(200).json({ message: 'Connexion réussie', uid: decoded.uid, email: decoded.email })
  } catch (error) {
    console.error('Erreur login:', error)
    res.status(401).json({ error: 'Token invalide' })
  }
})


router.post('/logout', async (req, res) => {
  const { token } = req.body

  try {
    const decoded = await admin.auth().verifyIdToken(token)
    await admin.auth().revokeRefreshTokens(decoded.uid)

    res.status(200).json({ message: 'Déconnexion réussie (token révoqué)' })
  } catch (error) {
    console.error('Erreur logout:', error)
    res.status(400).json({ error: 'Impossible de déconnecter' })
  }
})

module.exports = router
