const express = require('express')
const router = express.Router()
const admin = require('../services/firebaseAdmin')

// 🔹 GET /api/users — liste tous les utilisateurs
router.get('/', async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('users').get()

    const usersData = await Promise.all(snapshot.docs.map(async doc => {
      const userFirestore = doc.data()
      const uid = doc.id

      try {
        const userAuth = await admin.auth().getUser(uid)
        return {
          ...userFirestore,
          uid,
          email: userAuth.email,
          disabled: userAuth.disabled,
        }
      } catch (error) {
        console.warn(`⚠️ Impossible de récupérer les données auth de ${uid}`, error)
        return { ...userFirestore, uid, disabled: null }
      }
    }))

    res.json(usersData)
  } catch (err) {
    console.error('Erreur récupération utilisateurs:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})


// 🔹 DELETE /api/users/:uid — supprimer un utilisateur
router.delete('/:uid', async (req, res) => {
  const { uid } = req.params
  try {
    await admin.auth().deleteUser(uid)
    await admin.firestore().collection('users').doc(uid).delete()
    res.json({ message: `Utilisateur ${uid} supprimé.` })
  } catch (err) {
    console.error('Erreur suppression utilisateur:', err)
    res.status(500).json({ error: 'Erreur suppression utilisateur' })
  }
})

// 🔹 POST /api/users/:uid/suspend — suspendre un utilisateur
router.post('/:uid/suspend', async (req, res) => {
  const { uid } = req.params
  try {
    await admin.auth().updateUser(uid, { disabled: true })
    res.json({ message: `Utilisateur ${uid} suspendu.` })
  } catch (err) {
    console.error('Erreur suspension utilisateur:', err)
    res.status(500).json({ error: 'Erreur suspension utilisateur' })
  }
})

// 🔹 POST /api/users/:uid/unsuspend — lever la suspension
router.post('/:uid/unsuspend', async (req, res) => {
  const { uid } = req.params
  try {
    await admin.auth().updateUser(uid, { disabled: false })
    res.json({ message: `Utilisateur ${uid} réactivé.` })
  } catch (err) {
    console.error('Erreur levée suspension utilisateur:', err)
    res.status(500).json({ error: 'Erreur réactivation utilisateur' })
  }
})

// 🔹 POST /api/users/signout-all — invalider tous les tokens (déconnexion globale)
router.post('/signout-all', async (req, res) => {
  try {
    const listUsers = await admin.auth().listUsers()
    const promises = listUsers.users.map(user =>
      admin.auth().revokeRefreshTokens(user.uid)
    )
    await Promise.all(promises)
    res.json({ message: 'Tous les utilisateurs ont été déconnectés.' })
  } catch (err) {
    console.error('Erreur déconnexion globale:', err)
    res.status(500).json({ error: 'Erreur déconnexion globale' })
  }
})

// 🔹 POST /api/users/:uid/signout — invalider un seul token utilisateur
router.post('/:uid/signout', async (req, res) => {
  const { uid } = req.params
  try {
    await admin.auth().revokeRefreshTokens(uid)
    res.json({ message: `Utilisateur ${uid} déconnecté.` })
  } catch (err) {
    console.error('Erreur déconnexion utilisateur:', err)
    res.status(500).json({ error: 'Erreur déconnexion utilisateur' })
  }
})

module.exports = router
