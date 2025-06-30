const express = require('express')
const router = express.Router()
const admin = require('../services/firebaseAdmin')
const auth = require('../middleware/authMiddleware')

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

router.put('/profile', auth, async (req, res) => {
  const { username, profileUrl } = req.body;
  const uid = req.user.uid; // récupéré depuis verifyToken

  if (!username || typeof username !== 'string' || username.trim() === '') {
    return res.status(400).json({ error: 'Username est requis et doit être une chaîne non vide' });
  }

  try {
    const userRef = admin.firestore().collection('users').doc(uid);
    await userRef.update({
      username: username.trim(),
      profileUrl: profileUrl || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return res.json({ message: 'Profil mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error); 
    return res.status(500).json({ error: 'Erreur serveur lors de la mise à jour' });
  }
});


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

//trouver un utilisateur par email
router.get('/find', auth, async (req, res) => {
  const { email } = req.query
  if (!email) return res.status(400).json({ error: 'Email requis' })

  try {
    // Référence à la collection users
    const usersRef = admin.firestore().collection('users')

    // Requête pour chercher l'utilisateur avec l'email donné
    const querySnapshot = await usersRef.where('email', '==', email).get()

    if (querySnapshot.empty) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()
    const userPublic = {
      uid: userDoc.id,
      email: userData.email,
      name: userData.name,
      username: userData.username,
      profileUrl: userData.profileUrl
    }
    res.json(userPublic)
  } catch (err) {
    console.error('Erreur recherche utilisateur:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})




module.exports = router
